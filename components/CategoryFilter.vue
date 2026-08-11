<script setup lang="ts">
const { t } = useLocale()

const props = defineProps<{
  categories: { key: string; label: string; count?: number }[]
}>()

const model = defineModel<string>({ default: '' })

const categoryStyles: Record<string, string> = {
  IMMIGRATION: 'border-ink-600 text-ink-600 data-[active=true]:bg-ink-600',
  HOUSING: 'border-guichet-600 text-guichet-600 data-[active=true]:bg-guichet-600',
  HEALTH: 'border-stamp-600 text-stamp-600 data-[active=true]:bg-stamp-600',
  EMPLOYMENT: 'border-[#8A6D1F] text-[#8A6D1F] data-[active=true]:bg-[#8A6D1F]'
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="rounded-full border-2 px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase font-mono border-ink-800 text-ink-800 transition-colors"
      :class="model === '' ? 'bg-ink-800 text-paper-50' : 'hover:bg-ink-800/5'"
      @click="model = ''"
    >
      {{ t.allCategories }}
    </button>
    <button
      v-for="c in categories"
      :key="c.key"
      type="button"
      :data-active="model === c.key"
      class="rounded-full border-2 px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase font-mono transition-colors data-[active=true]:!text-paper-50"
      :class="categoryStyles[c.key]"
      @click="model = model === c.key ? '' : c.key"
    >
      {{ c.label }}
      <span v-if="c.count !== undefined" class="opacity-60">· {{ c.count }}</span>
    </button>
  </div>
</template>
