import { prisma } from '../utils/prisma'

const SITE_URL = 'https://frangere.aaweb.fr'

const STATIC_PATHS = ['/', '/guides', '/infos-utiles']

export default defineEventHandler(async (event) => {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' }
  })

  const staticUrls = STATIC_PATHS.map(
    (path) => `<url><loc>${SITE_URL}${path}</loc><changefreq>hourly</changefreq></url>`
  )

  const articleUrls = articles.map(
    (a) =>
      `<url><loc>${SITE_URL}/article/${a.id}</loc><lastmod>${a.updatedAt.toISOString()}</lastmod></url>`
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...articleUrls].join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
