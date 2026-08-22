import { prisma } from '../../../utils/prisma'

const USER_AGENT = 'FrangereBot/1.0 (+https://frangere.fr)'

/**
 * Proxies an article's source image through our own domain so the browser
 * can fetch it as a Blob for native sharing (navigator.share with files) -
 * a direct client-side fetch of the external gouv.fr URL would usually be
 * blocked by CORS since those servers don't send Access-Control-Allow-Origin.
 * Only ever proxies the imageUrl already stored for a real published
 * article (looked up by id), never an arbitrary URL, to avoid an open proxy.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing article id' })

  const article = await prisma.article.findUnique({ where: { id }, select: { imageUrl: true, status: true } })
  if (!article || article.status !== 'PUBLISHED' || !article.imageUrl) {
    throw createError({ statusCode: 404, statusMessage: 'No image for this article' })
  }

  const res = await fetch(article.imageUrl, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch source image' })
  }

  setResponseHeader(event, 'content-type', res.headers.get('content-type') || 'image/jpeg')
  setResponseHeader(event, 'cache-control', 'public, max-age=86400')
  return Buffer.from(await res.arrayBuffer())
})
