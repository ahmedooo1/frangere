<script setup lang="ts">
const { t } = useLocale()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="relative">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate pointer-events-none start-4"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      v-model="model"
      type="search"
      :placeholder="t.searchPlaceholder"
      class="w-full rounded-sm border border-line bg-paper-50 ps-11 pe-4 py-3 text-sm text-ink-800 placeholder:text-slate/70 focus:outline-none focus-visible:border-ink-600 transition-colors"
    >
  </div>
</template>
