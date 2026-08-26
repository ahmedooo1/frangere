/**
 * Re-runs a single already-published article through fetchFullArticleText +
 * the AI pipeline and updates it in place - for articles published before
 * full-article-text extraction existed (see server/utils/article-content.ts),
 * which were translated from just the thin RSS teaser.
 *
 *   npx tsx scripts/regenerate-article.ts <articleId>
 */
import 'dotenv/config'
import { prisma } from '../server/utils/prisma'
import { fetchFullArticleText } from '../server/utils/article-content'
import { processArticleWithAi, getGeminiApiKeys } from '../server/utils/ai'
import { getRecentTitlesForDuplicateCheck } from '../server/utils/pipeline'

async function main() {
  const articleId = process.argv[2]
  if (!articleId) {
    console.error('Usage: npx tsx scripts/regenerate-article.ts <articleId>')
    process.exit(1)
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } })
  if (!article) {
    console.error(`No article with id ${articleId}`)
    process.exit(1)
  }

  console.log(`Regenerating "${article.titleFr}" (${article.sourceUrl})`)

  const fullText = await fetchFullArticleText(article.sourceUrl)
  const body = fullText && fullText.length > article.originalBodyFr.length ? fullText : article.originalBodyFr
  console.log(`Using body: ${body.length} chars (was ${article.originalBodyFr.length})`)

  const apiKeys = getGeminiApiKeys()
  // Exclude the article's own title, or the AI will flag it as a duplicate of itself.
  const recentTitles = (await getRecentTitlesForDuplicateCheck()).filter(
    (t) => t !== article.titleFr && t !== article.titleAr
  )

  const result = await processArticleWithAi({
    title: article.originalTitleFr,
    body,
    sourceName: 'regenerate-article',
    apiKeys,
    recentTitles
  })

  if (result.model === 'mock-fallback') {
    console.error('AI unavailable (mock fallback) - nothing updated, try again later')
    process.exit(1)
  }
  if (!result.relevant) {
    console.error('AI now judges this item not relevant - leaving the article untouched')
    process.exit(1)
  }

  await prisma.article.update({
    where: { id: articleId },
    data: {
      originalBodyFr: body,
      titleAr: result.titleAr,
      tldrAr: result.tldrAr,
      stepsAr: result.stepsAr,
      bodyAr: result.bodyAr,
      titleFr: result.titleFr,
      tldrFr: result.tldrFr,
      stepsFr: result.stepsFr,
      bodyFr: result.bodyFr,
      aiModel: result.model,
      aiProcessedAt: new Date()
    }
  })

  console.log('Updated successfully.')
  console.log('New bodyAr length:', result.bodyAr.length)
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
