import cron from 'node-cron'
import { runPipeline } from '../utils/pipeline'

// Registers a Node-cron scheduled job when the Nitro server boots.
// Runs every 6 hours by default (CRON_SCHEDULE env override supported).
// Guarded so it only runs once per process and can be disabled via CRON_ENABLED=false
// (useful for serverless deployments where an external scheduler, e.g. Vercel Cron
// or a system crontab calling `npm run cron:run`, triggers the pipeline instead).
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const enabled = config.cronEnabled !== 'false'
  const schedule = (config.cronSchedule as string) || '0 */6 * * *'

  if (!enabled) {
    console.log('[cron] Disabled via CRON_ENABLED=false. Trigger manually via POST /api/feed.')
    return
  }

  if (!cron.validate(schedule)) {
    console.warn(`[cron] Invalid CRON_SCHEDULE "${schedule}", falling back to every 6 hours.`)
  }

  const finalSchedule = cron.validate(schedule) ? schedule : '0 */6 * * *'

  console.log(`[cron] Frangère pipeline scheduled: "${finalSchedule}" (every 6h by default)`)

  cron.schedule(finalSchedule, async () => {
    console.log('[cron] Running scheduled Frangère pipeline...')
    try {
      const summary = await runPipeline(config.anthropicApiKey as string)
      console.log('[cron] Pipeline finished:', summary)
    } catch (err) {
      console.error('[cron] Pipeline run failed:', err)
    }
  })
})
