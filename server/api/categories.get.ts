import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { articles: { where: { status: 'PUBLISHED' } } } }
    }
  })

  return categories.map((c) => ({
    key: c.key,
    labelFr: c.labelFr,
    labelAr: c.labelAr,
    count: c._count.articles
  }))
})
