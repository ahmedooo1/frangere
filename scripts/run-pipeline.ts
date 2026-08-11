/**
 * Standalone entrypoint to run the Frangère pipeline outside of the Nitro
 * server process. Useful for serverless deploys (e.g. Vercel Cron hitting
 * a route, or `vercel.json` cron) or a plain system crontab:
 *
 *   0 (star)/6 * * *  cd /path/to/frangere && npm run cron:run >> /var/log/frangere.log 2>&1
 *
 * Loads env vars the same way Nuxt does (.env at project root).
 */
import 'dotenv/config'
import { runPipeline } from '../server/utils/pipeline'

async function main() {
  console.log(`[cron:run] Starting Frangère pipeline at ${new Date().toISOString()}`)
  const summary = await runPipeline(process.env.GEMINI_API_KEY)
  console.log('[cron:run] Summary:', JSON.stringify(summary, null, 2))
  process.exit(summary.errors.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('[cron:run] Fatal error:', err)
  process.exit(1)
})
