const USER_AGENT = 'FrangereBot/1.0 (+https://frangere.fr)'
const FETCH_TIMEOUT_MS = 8000

/**
 * Extracts the article's real illustration (og:image) straight from its raw
 * HTML, if present. We deliberately never generate images - a real photo
 * from the official source is more trustworthy than an AI-generated stand-in,
 * and keeps the site's look consistent with "only real content" elsewhere.
 */
export function extractOgImage(html: string): string | null {
  const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  return match ? match[1] : null
}

/**
 * Fetches a page just to pull its og:image - used by the live RSS pipeline,
 * which (unlike the backfill scraper) doesn't already have the article's
 * HTML in hand. Best-effort: any failure just means no image, never blocks
 * publishing.
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    return extractOgImage(await res.text())
  } catch {
    return null
  }
}
