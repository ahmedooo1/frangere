import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

const USER_AGENT = 'FrangereBot/1.0 (+https://frangere.fr)'
const FETCH_TIMEOUT_MS = 10000

/**
 * RSS feeds (including every official French .gouv.fr/senat.fr/etc. feed
 * this app polls) typically only put a short teaser in <description> - the
 * real article body lives on the linked page. Feeding the AI just that
 * teaser meant it could only ever produce a thin rewrite of a thin snippet,
 * even though the source page itself often has much more useful detail
 * (exact procedure, exceptions, penalties, legal references...).
 *
 * Uses Readability (the same library behind Firefox's Reader View) rather
 * than per-site scraping rules: this app pulls from half a dozen+ different
 * official domains with completely different HTML structures, and a
 * generic "find the main article content" extractor is far less brittle
 * than hand-written selectors that break the moment one site redesigns.
 *
 * Best-effort: any failure (network, unparseable page, PDF link, etc.)
 * returns null so the caller falls back to the RSS snippet - full text is
 * an enhancement, never a hard requirement to keep publishing working.
 */
export async function fetchFullArticleText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null

    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const article = new Readability(dom.window.document).parse()
    const text = article?.textContent?.trim()
    return text || null
  } catch {
    return null
  }
}
