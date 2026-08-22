export interface ShareableArticle {
  id: string
  titleAr: string
  titleFr: string | null
  tldrAr: string[]
  tldrFr: string[]
  imageUrl?: string | null
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

  async function tryFetchImageFile(article: ShareableArticle): Promise<File | null> {
    if (!article.imageUrl) return null
    try {
      const res = await fetch(`/api/articles/${article.id}/image`)
      if (!res.ok) return null
      const blob = await res.blob()
      const file = new File([blob], 'frangere-article.jpg', { type: blob.type || 'image/jpeg' })
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return null
      return file
    } catch {
      return null
    }
  }

  async function shareArticle(article: ShareableArticle) {
    const text = buildShareText(article)

    if (navigator.share) {
      // Include the article's real image when the device's share sheet
      // supports file attachments (most mobile browsers) - falls back to
      // text-only automatically if the image can't be fetched/attached.
      const imageFile = await tryFetchImageFile(article)

      try {
        await navigator.share(imageFile ? { text, files: [imageFile] } : { text })
        return
      } catch (err: any) {
        // User closed the share sheet without picking anything - not an error.
        if (err?.name === 'AbortError') return
        // Some targets reject the files payload outright - retry text-only.
        if (imageFile) {
          try {
            await navigator.share({ text })
            return
          } catch (err2: any) {
            if (err2?.name === 'AbortError') return
          }
        }
      }
    }

    // Desktop / unsupported browsers: open WhatsApp Web directly. WhatsApp's
    // click-to-chat URL scheme only accepts pre-filled text, no way to
    // attach an image through it - a WhatsApp platform limitation, not
    // something fixable from our side.
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return { shareArticle }
}
