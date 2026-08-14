export interface ShareableArticle {
  id: string
  titleAr: string
  titleFr: string | null
  tldrAr: string[]
  tldrFr: string[]
}

const SITE_URL = 'https://frangere.aaweb.fr'

export function useShare() {
  const { locale } = useLocale()

  function buildShareText(article: ShareableArticle) {
    const isAr = locale.value === 'ar'
    const title = isAr ? article.titleAr : article.titleFr || article.titleAr
    const tldr = (isAr ? article.tldrAr : article.tldrFr) || []
    const url = `${SITE_URL}/article/${article.id}`

    const bullets = tldr.map((point) => `• ${point}`).join('\n')
    const readMore = isAr ? 'التفاصيل كاملة عبر فرانجير' : 'Détails complets sur Frangère'

    return `📌 ${title}\n\n${bullets}\n\n📖 ${readMore}\n${url}`
  }

  async function shareArticle(article: ShareableArticle) {
    const text = buildShareText(article)

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch (err: any) {
        // User closed the share sheet without picking anything - not an error.
        if (err?.name === 'AbortError') return
      }
    }

    // Desktop / unsupported browsers: open WhatsApp Web directly, since
    // that's specifically what was asked for as the primary use case.
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return { shareArticle }
}
