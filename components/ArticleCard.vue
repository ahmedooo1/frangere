<script setup lang="ts">
const { t, locale } = useLocale()
const { shareArticle } = useShare()
const router = useRouter()

const props = defineProps<{
  article: {
    id: string
    titleAr: string
    titleFr: string | null
    tldrAr: string[]
    tldrFr: string[]
    stepsAr: string[]
    stepsFr: string[]
    sourceUrl: string
    imageUrl?: string | null
    publishedAt: string | null
    category: { key: string; labelAr: string; labelFr: string }
  }
}>()

const isAr = computed(() => locale.value === 'ar')
const title = computed(() => (isAr.value ? props.article.titleAr : props.article.titleFr || props.article.titleAr))
const tldr = computed(() => (isAr.value ? props.article.tldrAr : props.article.tldrFr))
const steps = computed(() => (isAr.value ? props.article.stepsAr : props.article.stepsFr))
const categoryLabel = computed(() => (isAr.value ? props.article.category.labelAr : props.article.category.labelFr))

const categoryClass: Record<string, string> = {
  IMMIGRATION: 'tampon--immigration',
  HOUSING: 'tampon--housing',
  HEALTH: 'tampon--health',
  EMPLOYMENT: 'tampon--employment',
  COST_OF_LIVING: 'tampon--cost_of_living',
  LAWS: 'tampon--laws'
}

const formattedDate = computed(() => {
  if (!props.article.publishedAt) return ''
  const d = new Date(props.article.publishedAt)
  return d.toLocaleDateString(isAr.value ? 'ar-FR' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
})
</script>

<template>
  <article
    class="dossier-card p-5 sm:p-6 ps-8 sm:ps-9 flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-[box-shadow,transform]"
    @click="router.push(`/article/${article.id}`)"
  >
    <ArticleImage :image-url="article.imageUrl" :category-key="article.category.key" :alt="title" />

    <div class="dossier-tab">{{ formattedDate }}</div>

    <div class="flex items-start justify-between gap-3 pt-1">
      <span class="tampon" :class="categoryClass[article.category.key]">{{ categoryLabel }}</span>
    </div>

    <h2 class="font-display text-xl sm:text-2xl font-semibold text-ink-800 leading-snug hover:text-ink-600 transition-colors">
      {{ title }}
    </h2>

    <div class="rounded-sm bg-ink-800 text-paper-50 p-4">
      <p class="ref-label !text-paper-200 mb-2">{{ t.tldr }}</p>
      <ul class="space-y-1.5">
        <li v-for="(point, i) in tldr" :key="i" class="text-sm leading-relaxed flex gap-2">
          <span class="opacity-60">-</span>
          <span>{{ point }}</span>
        </li>
      </ul>
    </div>

    <div v-if="steps?.length">
      <p class="ref-label mb-2">{{ t.steps }}</p>
      <ol class="space-y-1.5">
        <li v-for="(step, i) in steps" :key="i" class="text-sm text-ink-800 flex gap-2 leading-relaxed">
          <span class="font-mono text-stamp-600 font-bold shrink-0">{{ i + 1 }}.</span>
          <span>{{ step }}</span>
        </li>
      </ol>
    </div>

    <div class="flex items-center justify-between gap-3 mt-1">
      <a
        :href="article.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-guichet-600 hover:text-guichet-800 underline underline-offset-4 decoration-guichet-400/50 w-fit"
        @click.stop
      >
        {{ t.readOriginal }}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </a>

      <button
        type="button"
        :aria-label="t.share"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-ink-800 transition-colors shrink-0"
        @click.stop="shareArticle(article)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
        </svg>
        {{ t.share }}
      </button>
    </div>
  </article>
</template>
