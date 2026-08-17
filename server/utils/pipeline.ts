import { prisma } from './prisma'
import { fetchFeedItems, type FeedItem } from './rss'
import { processArticleWithAi, type CategoryKey } from './ai'

export interface PipelineRunSummary {
  sourcesProcessed: number
  itemsSeen: number
  itemsSkippedExisting: number
  itemsFiltered: number
  itemsDuplicate: number
  itemsPending: number
  itemsPublished: number
  errors: string[]
}

// How many days back to look, and how many titles at most to feed into the
// duplicate-detection prompt - bounded so the prompt doesn't grow unbounded
// as the article count increases over time.
const DUPLICATE_LOOKBACK_DAYS = 21
const DUPLICATE_TITLES_LIMIT = 60

export async function getRecentTitlesForDuplicateCheck(): Promise<string[]> {
  const recentArticles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: new Date(Date.now() - DUPLICATE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) }
    },
    orderBy: { publishedAt: 'desc' },
    take: DUPLICATE_TITLES_LIMIT,
    select: { titleFr: true, titleAr: true }
  })
  return recentArticles.map((a) => a.titleFr || a.titleAr)
}

/**
 * Evaluates a single feed item (dedup -> AI relevance/translation/duplicate
 * check -> publish) and mutates `summary` + `recentTitles` accordingly.
 * Shared between the live RSS loop below and scripts/backfill-month.ts, so
 * a one-off historical import goes through exactly the same rules (never
 * publish a mock placeholder, skip cross-source duplicates, etc.) as the
 * recurring cron.
 */
export async function processFeedItem(params: {
  item: FeedItem
  sourceId: string
  sourceName: string
  apiKey: string
  categoryByKey: Map<string, { id: string }>
  recentTitles: string[]
  summary: PipelineRunSummary
}): Promise<void> {
  const { item, sourceId, sourceName, apiKey, categoryByKey, recentTitles, summary } = params

  summary.itemsSeen++

  const existing = await prisma.article.findUnique({ where: { guid: item.guid } })
  if (existing) {
    summary.itemsSkippedExisting++
    return
  }

  // Already evaluated by a real AI call and judged not relevant (or a
  // duplicate) - the feed's "N latest items" window keeps showing it for
  // days, no need to spend another call re-confirming the same verdict.
  const alreadyRejected = await prisma.rejectedItem.findUnique({ where: { guid: item.guid } })
  if (alreadyRejected) {
    summary.itemsSkippedExisting++
    return
  }

  const result = await processArticleWithAi({
    title: item.title,
    body: item.content,
    sourceName,
    apiKey,
    recentTitles
  })

  // Never publish a mock placeholder - an article only appears once it has
  // real translated content. Nothing is persisted here, so this item is
  // retried from scratch on the next run.
  if (result.model === 'mock-fallback') {
    summary.itemsPending++
    return
  }

  if (!result.relevant || !result.category) {
    summary.itemsFiltered++
    await prisma.rejectedItem.create({ data: { guid: item.guid } })
    return
  }

  // Same topic already covered by another source (recently, or earlier in
  // this same run) - skip publishing, but remember it as evaluated so it's
  // not re-sent to the AI (and re-spend quota) next run.
  if (result.isDuplicate) {
    summary.itemsDuplicate++
    await prisma.rejectedItem.create({ data: { guid: item.guid } })
    return
  }

  const category = categoryByKey.get(result.category as CategoryKey)
  if (!category) {
    summary.errors.push(`Unknown category "${result.category}" for item ${item.guid}`)
    return
  }

  await prisma.article.create({
    data: {
      guid: item.guid,
      sourceUrl: item.link,
      originalTitleFr: item.title,
      originalBodyFr: item.content,
      titleAr: result.titleAr,
      tldrAr: result.tldrAr,
      stepsAr: result.stepsAr,
      bodyAr: result.bodyAr,
      titleFr: result.titleFr,
      tldrFr: result.tldrFr,
      stepsFr: result.stepsFr,
      bodyFr: result.bodyFr,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: category.id,
      feedSourceId: sourceId,
      aiModel: result.model,
      aiProcessedAt: new Date()
    }
  })

  summary.itemsPublished++
  // Keep the AI's duplicate check aware of what THIS run has already
  // published, not just what existed before it started.
  recentTitles.unshift(result.titleFr)
}

/**
 * Runs the full poll -> filter -> translate -> summarize -> categorize -> save pipeline.
 * Accepts an explicit apiKey so it can be called both from inside Nitro (via the
 * cron plugin / API route, using useRuntimeConfig) and from the standalone
 * scripts/run-pipeline.ts entrypoint (using process.env directly), e.g. for
 * deployments that prefer an external scheduler (system crontab, Vercel Cron, etc.).
 */
export async function runPipeline(apiKeyOverride?: string): Promise<PipelineRunSummary> {
  const apiKey = apiKeyOverride ?? (process.env.GEMINI_API_KEY || '')

  const summary: PipelineRunSummary = {
    sourcesProcessed: 0,
    itemsSeen: 0,
    itemsSkippedExisting: 0,
    itemsFiltered: 0,
    itemsDuplicate: 0,
    itemsPending: 0,
    itemsPublished: 0,
    errors: []
  }

  const sources = await prisma.feedSource.findMany({ where: { isActive: true } })
  const categories = await prisma.category.findMany()
  const categoryByKey = new Map(categories.map((c) => [c.key, c]))

  // Recent titles across ALL sources, so an item from source B gets flagged
  // as a duplicate of something source A already published, even though they
  // have different guids. Updated in-memory as this run publishes new
  // articles, so two similar items from different sources in the SAME run
  // are also caught, not just against past runs.
  const recentTitles = await getRecentTitlesForDuplicateCheck()

  for (const source of sources) {
    summary.sourcesProcessed++
    try {
      const items = await fetchFeedItems(source.url, source.name)

      for (const item of items) {
        await processFeedItem({
          item,
          sourceId: source.id,
          sourceName: source.name,
          apiKey,
          categoryByKey,
          recentTitles,
          summary
        })
      }

      await prisma.feedSource.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date(), lastError: null }
      })
    } catch (err: any) {
      const message = err?.message || String(err)
      summary.errors.push(`${source.name}: ${message}`)
      await prisma.feedSource.update({
        where: { id: source.id },
        data: { lastError: message }
      })
    }
  }

  return summary
}
