<script setup lang="ts">
const { t, locale } = useLocale()

const search = ref('')
const category = ref('')
const page = ref(1)

const debouncedSearch = refDebounced(search, 350)

const query = computed(() => ({
  q: debouncedSearch.value || undefined,
  category: category.value || undefined,
  page: page.value,
  pageSize: 9
}))

const { data, pending, refresh } = await useFetch('/api/articles', {
  query,
  watch: [query]
})

const { data: categoriesRaw } = await useFetch('/api/categories')

const categories = computed(() =>
  (categoriesRaw.value || []).map((c) => ({
    key: c.key,
    label: locale.value === 'ar' ? c.labelAr : c.labelFr,
    count: c.count
  }))
)

watch([search, category], () => {
  page.value = 1
})

const articles = computed(() => data.value?.items || [])
const pagination = computed(() => data.value?.pagination)
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="border-b border-line bg-paper-100">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        <p class="ref-label mb-4">{{ t.heroKicker }}</p>
        <h1 class="font-display text-3xl sm:text-5xl font-semibold text-ink-800 leading-[1.15] max-w-3xl">
          {{ t.heroTitle }}
        </h1>
        <p class="mt-4 text-base sm:text-lg text-slate max-w-2xl leading-relaxed">
          {{ t.heroBody }}
        </p>
      </div>
    </section>

    <div class="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <SearchBar v-model="search" class="sm:max-w-sm w-full" />
        <CategoryFilter v-model="category" :categories="categories" />
      </div>

      <!-- Loading state -->
      <div v-if="pending" class="grid gap-5 sm:grid-cols-2">
        <div v-for="i in 4" :key="i" class="dossier-card p-6 animate-pulse h-64" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!articles.length" class="dossier-card p-10 text-center flex flex-col items-center gap-2">
        <p class="font-display text-xl text-ink-800">{{ t.noResults }}</p>
        <p class="text-sm text-slate">{{ t.noResultsHint }}</p>
      </div>

      <!-- Article grid -->
      <div v-else class="grid gap-5 sm:grid-cols-2">
        <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
        <button
          v-for="p in pagination.totalPages"
          :key="p"
          type="button"
          class="h-9 w-9 rounded-full font-mono text-sm border-2 transition-colors"
          :class="p === pagination.page ? 'bg-ink-800 text-paper-50 border-ink-800' : 'border-line text-ink-800 hover:border-ink-600'"
          @click="page = p"
        >
          {{ p }}
        </button>
      </div>
    </div>
  </div>
</template>
