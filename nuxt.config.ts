// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: true,
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'فرانجير | Frangère — دليلك الإداري في فرنسا',
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'ملخصات إدارية مترجمة وموثوقة للقادمين الجدد إلى فرنسا — السكن، الصحة، العمل، والإقامة.'
        }
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
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    cronEnabled: process.env.CRON_ENABLED || 'true',
    cronSchedule: process.env.CRON_SCHEDULE || '0 */6 * * *',
    cronSecret: process.env.CRON_SECRET || '',
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
