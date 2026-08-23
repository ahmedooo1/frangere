import { runPipeline } from '../utils/pipeline'
import { getGeminiApiKeys } from '../utils/ai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.cronSecret as string | undefined

  // If a CRON_SECRET is configured, require it as a bearer token so this
  // endpoint can't be spammed publicly (it consumes Gemini API quota).
  if (secret) {
    const auth = getHeader(event, 'authorization')
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  // Read live, not via config.geminiApiKey - that value is baked in at
  // build time by Nuxt's runtimeConfig, which is empty on CI (GEMINI_API_KEY
  // isn't set on the GitHub Actions runner), permanently forcing mock
  // fallback regardless of what's actually configured on the server.
  const summary = await runPipeline(getGeminiApiKeys())
  return { ok: true, summary }
})
