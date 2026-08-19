<script setup lang="ts">
const { t, locale } = useLocale()
const { shareArticle } = useShare()
const route = useRoute()

const { data: article, error } = await useFetch(`/api/articles/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const isAr = computed(() => locale.value === 'ar')
const title = computed(() => (isAr.value ? article.value?.titleAr : article.value?.titleFr || article.value?.titleAr))
const body = computed(() => (isAr.value ? article.value?.bodyAr : article.value?.bodyFr))
const tldr = computed(() => (isAr.value ? article.value?.tldrAr : article.value?.tldrFr) || [])
const steps = computed(() => (isAr.value ? article.value?.stepsAr : article.value?.stepsFr) || [])
const categoryLabel = computed(() =>
  isAr.value ? article.value?.category.labelAr : article.value?.category.labelFr
)

const description = computed(() => tldr.value?.[0] || body.value?.slice(0, 160) || '')
const canonicalUrl = computed(() => `https://frangere.aaweb.fr/article/${route.params.id}`)

useHead(() => ({
  title: title.value ? `${title.value} · Frangère` : 'Frangère',
  meta: [
    { name: 'description', content: description.value },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: title.value || 'Frangère' },
    { property: 'og:description', content: description.value },
    { property: 'og:url', content: canonicalUrl.value },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title.value || 'Frangère' },
    { name: 'twitter:description', content: description.value }
  ],
  link: [{ rel: 'canonical', href: canonicalUrl.value }]
}))
</script>

<template>
  <div v-if="article" class="mx-auto max-w-2xl px-4 sm:px-6 py-10">
    <NuxtLink to="/" class="text-sm text-slate hover:text-ink-800 inline-flex items-center gap-1.5 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {{ t.backHome }}
    </NuxtLink>

    <span class="tampon" :class="`tampon--${article.category.key.toLowerCase()}`">{{ categoryLabel }}</span>

    <h1 class="font-display text-3xl sm:text-4xl font-semibold text-ink-800 leading-tight mt-4">
      {{ title }}
    </h1>

    <p v-if="article.publishedAt" class="ref-label mt-3">
      {{ t.updated }}: {{ new Date(article.publishedAt).toLocaleDateString(isAr ? 'ar-FR' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </p>

    <div class="rounded-sm bg-ink-800 text-paper-50 p-5 mt-6">
      <p class="ref-label !text-paper-200 mb-2">{{ t.tldr }}</p>
      <ul class="space-y-2">
        <li v-for="(pt, i) in tldr" :key="i" class="text-sm leading-relaxed flex gap-2">
          <span class="opacity-60">-</span><span>{{ pt }}</span>
        </li>
      </ul>
    </div>

    <p class="mt-6 leading-relaxed text-ink-800">{{ body }}</p>

    <div v-if="steps.length" class="mt-6">
      <p class="ref-label mb-2">{{ t.steps }}</p>
      <ol class="space-y-2">
        <li v-for="(s, i) in steps" :key="i" class="flex gap-2 text-ink-800 leading-relaxed">
          <span class="font-mono text-stamp-600 font-bold shrink-0">{{ i + 1 }}.</span><span>{{ s }}</span>
        </li>
      </ol>
    </div>

    <div class="mt-8 flex items-center justify-between gap-3">
      <a
        :href="article.sourceUrl" target="_blank" rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-guichet-600 hover:text-guichet-800 underline underline-offset-4"
      >
        {{ t.readOriginal }}
      </a>

      <button
        type="button"
        :aria-label="t.share"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-ink-800 transition-colors shrink-0"
        @click="shareArticle(article)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
        </svg>
        {{ t.share }}
      </button>
    </div>

    <p class="mt-10 pt-6 border-t border-line text-xs text-slate leading-relaxed">
      {{ t.disclaimer }}
    </p>
  </div>
</template>
