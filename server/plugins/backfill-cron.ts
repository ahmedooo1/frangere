import cron from 'node-cron'
import { runBackfillMonth } from '../utils/backfill'
import { getGeminiApiKeys } from '../utils/ai'

// Registers a once-daily scheduled job that catches up on articles the live
// RSS cron's rolling 10-item window misses (service-public.gouv.fr's
// "actualités" page carries roughly a month of history, RSS only the 10
// most recent). Runs at 03:15 local by default - deliberately off the main
// pipeline's :00 ticks (server/plugins/cron.ts) so the two never fire in the
// same minute and thrash the 5-req/min Gemini rate limit; they still share
// the same daily quota, but that's a hard cap either way.
// Disable via BACKFILL_CRON_ENABLED=false.
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const enabled = config.backfillCronEnabled !== 'false'
  const schedule = (config.backfillCronSchedule as string) || '15 3 * * *'

  if (!enabled) {
    console.log('[backfill-cron] Disabled via BACKFILL_CRON_ENABLED=false. Trigger manually via `npm run backfill:month`.')
    return
  }

  const finalSchedule = cron.validate(schedule) ? schedule : '15 3 * * *'
  if (!cron.validate(schedule)) {
    console.warn(`[backfill-cron] Invalid BACKFILL_CRON_SCHEDULE "${schedule}", falling back to "${finalSchedule}".`)
  }

  console.log(`[backfill-cron] Historical backfill scheduled: "${finalSchedule}" (once daily by default)`)

  cron.schedule(finalSchedule, async () => {
    console.log('[backfill-cron] Running scheduled backfill...')
    try {
      const summary = await runBackfillMonth(getGeminiApiKeys())
      console.log('[backfill-cron] Backfill finished:', summary)
    } catch (err) {
      console.error('[backfill-cron] Backfill run failed:', err)
    }
  })
})
