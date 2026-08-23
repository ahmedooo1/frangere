/**
 * Manual entrypoint for the historical backfill (see server/utils/backfill.ts
 * for what it actually does). Also runs automatically once a day via
 * server/plugins/backfill-cron.ts - this is for on-demand/manual runs.
 *
 *   npm run backfill:month
 */
import 'dotenv/config'
import { prisma } from '../server/utils/prisma'
import { runBackfillMonth } from '../server/utils/backfill'
import { getGeminiApiKeys } from '../server/utils/ai'

async function main() {
  console.log(`[backfill] Starting at ${new Date().toISOString()}`)
  const summary = await runBackfillMonth(getGeminiApiKeys())
  console.log('[backfill] Summary:', JSON.stringify(summary, null, 2))
  await prisma.$disconnect()
  process.exit(summary.errors.length > 0 ? 1 : 0)
}

main().catch(async (err) => {
  console.error('[backfill] Fatal error:', err)
  await prisma.$disconnect()
  process.exit(1)
})
