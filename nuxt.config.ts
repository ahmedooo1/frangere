// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: true,
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'فرانجير | Frangère - دليلك الإداري في فرنسا',
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'ملخصات إدارية مترجمة وموثوقة للمقيمين في فرنسا - السكن، الصحة، العمل، الإقامة، غلاء المعيشة، والقوانين.'
        },
        { name: 'google-site-verification', content: 'Jm3BxzLvC-acCme-bCsqcP1qNtExuhR9DfqaKkOeNZk' },
        { name: 'theme-color', content: '#1B2A4A' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Frangère' },
        { property: 'og:title', content: 'فرانجير | Frangère - دليلك الإداري في فرنسا' },
        {
          property: 'og:description',
          content:
            'ملخصات إدارية مترجمة وموثوقة للمقيمين في فرنسا - السكن، الصحة، العمل، الإقامة، غلاء المعيشة، والقوانين.'
        },
        { property: 'og:image', content: 'https://frangere.aaweb.fr/og-image.png' },
        { property: 'og:url', content: 'https://frangere.aaweb.fr' },
        { property: 'og:locale', content: 'ar_AR' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'فرانجير | Frangère - دليلك الإداري في فرنسا' },
        { name: 'twitter:image', content: 'https://frangere.aaweb.fr/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Mono:wght@400;700&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    cronEnabled: process.env.CRON_ENABLED || 'true',
    cronSchedule: process.env.CRON_SCHEDULE || '0 */6 * * *',
    cronSecret: process.env.CRON_SECRET || '',
    // Offset from the main pipeline's :00 ticks so the two never compete for
    // the same per-minute Gemini quota at the exact same moment.
    backfillCronEnabled: process.env.BACKFILL_CRON_ENABLED || 'true',
    backfillCronSchedule: process.env.BACKFILL_CRON_SCHEDULE || '15 3 * * *',
    public: {
      siteName: 'Frangère',
      defaultLocale: 'ar'
    }
  },

  nitro: {
    experimental: {
      tasks: true
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  }
})
