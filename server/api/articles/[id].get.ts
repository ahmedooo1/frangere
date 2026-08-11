import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing article id' })

  const article = await prisma.article.findUnique({
    where: { id },
    include: { category: true, feedSource: true }
  })

  if (!article || article.status !== 'PUBLISHED') {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return article
})
