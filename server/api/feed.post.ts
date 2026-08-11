import { runPipeline } from '../utils/pipeline'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.cronSecret as string | undefined

  // If a CRON_SECRET is configured, require it as a bearer token so this
  // endpoint can't be spammed publicly (it consumes Anthropic API quota).
  if (secret) {
    const auth = getHeader(event, 'authorization')
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  const summary = await runPipeline(config.anthropicApiKey as string)
  return { ok: true, summary }
})
