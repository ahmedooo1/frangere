<script setup lang="ts">
const { t, dir, toggleLocale, initLocale } = useLocale()

onMounted(() => {
  initLocale()
})

useHead(() => ({
  htmlAttrs: { lang: dir.value === 'rtl' ? 'ar' : 'fr', dir: dir.value }
}))
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 border-b border-line bg-paper-50/90 backdrop-blur">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink-800 text-ink-800 font-display font-semibold text-lg group-hover:bg-ink-800 group-hover:text-paper-50 transition-colors"
          >F</span>
          <span class="flex flex-col leading-tight">
            <span class="font-display font-semibold text-lg text-ink-800">{{ t.appName }}</span>
            <span class="ref-label !text-[0.6rem] hidden sm:inline">{{ t.tagline }}</span>
          </span>
        </NuxtLink>

        <button
          type="button"
          class="tampon tampon--immigration hover:bg-ink-800 hover:text-paper-50 hover:border-ink-800 transition-colors cursor-pointer"
          @click="toggleLocale"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
          </svg>
          {{ t.switchLang }}
        </button>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-line mt-16">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-3">
        <p class="ref-label">{{ t.appName }} · {{ new Date().getFullYear() }}</p>
        <p class="text-sm text-slate max-w-2xl leading-relaxed">
          {{ t.disclaimer }}
        </p>
      </div>
    </footer>
  </div>
</template>
