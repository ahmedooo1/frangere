import { prisma } from './prisma'
import { processFeedItem, getRecentTitlesForDuplicateCheck, type PipelineRunSummary } from './pipeline'
import type { FeedItem } from './rss'
import { extractOgImage } from './images'

/**
 * Scrapes service-public.gouv.fr's "actualités" listing page (not the RSS
 * feed, which only exposes the 10 most recent items) for articles published
 * within the last BACKFILL_LOOKBACK_DAYS days, and runs each one through the
 * exact same evaluation pipeline as the live RSS cron (relevance filter,
 * cross-source duplicate check, translation).
 *
 * Called both from scripts/backfill-month.ts (manual `npm run backfill:month`)
 * and from the daily backfill-cron Nitro plugin, so the site keeps catching
 * up on articles the RSS feed's rolling 10-item window would otherwise miss,
 * without needing anyone to trigger it by hand.
 */

const LISTING_URLS = ['https://www.service-public.gouv.fr/particuliers/actualites']
const BACKFILL_LOOKBACK_DAYS = 30
const BACKFILL_SOURCE_NAME = 'Service-Public.fr - Archives (import ponctuel)'
// Distinct from the live RSS source's url (unique constraint) - never polled
// by the recurring RSS cron since isActive stays false.
const BACKFILL_SOURCE_URL = 'https://www.service-public.gouv.fr/particuliers/actualites#backfill'
// Be polite to both the source site and the Gemini API between items.
const DELAY_BETWEEN_ITEMS_MS = 1500

const USER_AGENT = 'FrangereBot/1.0 (+https://frangere.fr)'

const MONTHS_FR: Record<string, number> = {
  janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11
}

function parseFrenchDate(text: string): Date | null {
  const match = text.match(/(\d{1,2})\s+([a-zéûîôàè]+)\s+(\d{4})/i)
  if (!match) return null
  const [, day, monthName, year] = match
  const month = MONTHS_FR[monthName.toLowerCase()]
  if (month === undefined) return null
  return new Date(Number(year), month, Number(day))
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchListingLinks(url: string): Promise<{ id: string; link: string; title: string }[]> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Failed to fetch listing ${url}: ${res.status}`)
  const html = await res.text()

  const re = /<a[^>]*href="(https:\/\/[^"]*actualites\/(A[0-9]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g
  const seen = new Map<string, { id: string; link: string; title: string }>()
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const [, rawLink, id, innerHtml] = match
    const title = stripHtml(innerHtml)
    if (!title || seen.has(id)) continue
    seen.set(id, { id, link: rawLink.split('?')[0], title })
  }
  return [...seen.values()]
}

async function fetchArticleDetail(link: string): Promise<{ title: string; body: string; date: Date | null; imageUrl: string | null } | null> {
  const res = await fetch(link, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return null
  const html = await res.text()

  const titleMatch = html.match(/<h1[^>]*id="titlePage"[^>]*>([^<]*)</)
  const dateMatch = html.match(/data-test="date-page">\s*Publié le\s*(\d{1,2}\s+[a-zéûîôàè]+\s+\d{4})/i)
  const leadMatch = html.match(/<p class="fr-text--lg">([\s\S]*?)<\/p>/)
  const bodyMatches = [...html.matchAll(/<p[^>]*data-test="contenu-texte"[^>]*>([\s\S]*?)<\/p>/g)]

  const paragraphs = [leadMatch?.[1], ...bodyMatches.map((m) => m[1])]
    .filter((p): p is string => Boolean(p))
    .map(stripHtml)
    .filter(Boolean)

  return {
    title: titleMatch ? stripHtml(titleMatch[1]) : '',
    body: paragraphs.join('\n\n'),
    date: dateMatch ? parseFrenchDate(dateMatch[1]) : null,
    imageUrl: extractOgImage(html)
  }
}

export interface BackfillSummary extends PipelineRunSummary {
  itemsOutOfWindow: number
  itemsUnreadable: number
}

export async function runBackfillMonth(apiKeyOverride?: string): Promise<BackfillSummary> {
  const apiKey = apiKeyOverride ?? (process.env.GEMINI_API_KEY || '')
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set - refusing to run (would only produce mock placeholders)')
  }

  const source = await prisma.feedSource.upsert({
    where: { url: BACKFILL_SOURCE_URL },
    update: {},
    create: {
      name: BACKFILL_SOURCE_NAME,
      organization: "Direction de l'information légale et administrative",
      url: BACKFILL_SOURCE_URL,
      isActive: false
    }
  })

  const categories = await prisma.category.findMany()
  const categoryByKey = new Map(categories.map((c) => [c.key, c]))
  const recentTitles = await getRecentTitlesForDuplicateCheck()

  const cutoff = new Date(Date.now() - BACKFILL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  const summary: BackfillSummary = {
    sourcesProcessed: LISTING_URLS.length,
    itemsSeen: 0,
    itemsSkippedExisting: 0,
    itemsFiltered: 0,
    itemsDuplicate: 0,
    itemsPending: 0,
    itemsPublished: 0,
    errors: [],
    itemsOutOfWindow: 0,
    itemsUnreadable: 0
  }

  for (const listingUrl of LISTING_URLS) {
    let links: { id: string; link: string; title: string }[]
    try {
      links = await fetchListingLinks(listingUrl)
    } catch (err: any) {
      summary.errors.push(`${listingUrl}: ${err?.message || String(err)}`)
      continue
    }

    for (const { id, link } of links) {
      const guid = `backfill:${id}`

      const existingByGuid = await prisma.article.findUnique({ where: { guid } })
      const existingByUrl = existingByGuid ? null : await prisma.article.findFirst({ where: { sourceUrl: link } })
      if (existingByGuid || existingByUrl) {
        summary.itemsSkippedExisting++
        continue
      }
      const alreadyRejected = await prisma.rejectedItem.findUnique({ where: { guid } })
      if (alreadyRejected) {
        summary.itemsSkippedExisting++
        continue
      }

      const detail = await fetchArticleDetail(link)
      if (!detail || !detail.body) {
        summary.itemsUnreadable++
        continue
      }
      if (detail.date && detail.date < cutoff) {
        summary.itemsOutOfWindow++
        continue
      }

      const item: FeedItem = {
        guid,
        title: detail.title || id,
        link,
        content: detail.body,
        isoDate: detail.date?.toISOString(),
        imageUrl: detail.imageUrl
      }

      await processFeedItem({
        item,
        sourceId: source.id,
        sourceName: BACKFILL_SOURCE_NAME,
        apiKey,
        categoryByKey,
        recentTitles,
        summary
      })

      await sleep(DELAY_BETWEEN_ITEMS_MS)
    }
  }

  return summary
}
