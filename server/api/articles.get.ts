import { prisma } from '../utils/prisma'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const category = typeof query.category === 'string' ? query.category.toUpperCase() : ''
  const page = Math.max(1, parseInt((query.page as string) || '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt((query.pageSize as string) || '12', 10) || 12))

  const where: Prisma.ArticleWhereInput = {
    status: 'PUBLISHED'
  }

  if (category && ['IMMIGRATION', 'HOUSING', 'HEALTH', 'EMPLOYMENT'].includes(category)) {
    where.category = { key: category as any }
  }

  if (search) {
    where.OR = [
      { titleAr: { contains: search, mode: 'insensitive' } },
      { titleFr: { contains: search, mode: 'insensitive' } },
      { bodyAr: { contains: search, mode: 'insensitive' } },
      { bodyFr: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { category: true, feedSource: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.article.count({ where })
  ])

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  }
})
