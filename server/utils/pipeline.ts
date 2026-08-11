import { prisma } from './prisma'
import { fetchFeedItems } from './rss'
import { processArticleWithAi, type CategoryKey } from './ai'

export interface PipelineRunSummary {
  sourcesProcessed: number
  itemsSeen: number
  itemsSkippedExisting: number
  itemsFiltered: number
  itemsPublished: number
  errors: string[]
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
    itemsPublished: 0,
    errors: []
  }

  const sources = await prisma.feedSource.findMany({ where: { isActive: true } })
  const categories = await prisma.category.findMany()
  const categoryByKey = new Map(categories.map((c) => [c.key, c]))

  for (const source of sources) {
    summary.sourcesProcessed++
    try {
      const items = await fetchFeedItems(source.url, source.name)

      for (const item of items) {
        summary.itemsSeen++

        const existing = await prisma.article.findUnique({ where: { guid: item.guid } })
        if (existing) {
          summary.itemsSkippedExisting++
          continue
        }

        const result = await processArticleWithAi({
          title: item.title,
          body: item.content,
          sourceName: source.name,
          apiKey
        })

        if (!result.relevant || !result.category) {
          summary.itemsFiltered++
          continue
        }

        const category = categoryByKey.get(result.category as CategoryKey)
        if (!category) {
          summary.errors.push(`Unknown category "${result.category}" for item ${item.guid}`)
          continue
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
            feedSourceId: source.id,
            aiModel: result.model,
            aiProcessedAt: new Date()
          }
        })

        summary.itemsPublished++
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
