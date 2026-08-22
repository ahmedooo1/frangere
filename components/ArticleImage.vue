<script setup lang="ts">
const props = defineProps<{
  imageUrl?: string | null
  categoryKey: string
  alt: string
}>()

const failed = ref(false)

// Simple line icons per category (not AI-generated) shown when the source
// article has no usable image - matches the tampon badges' color palette.
const ICONS: Record<string, string> = {
  IMMIGRATION: 'M5 4h14v16l-7-3-7 3V4Z M9 9h6 M9 12h6',
  HOUSING: 'M4 11 12 4l8 7 M6 10v9h12v-9',
  HEALTH: 'M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9Z',
  EMPLOYMENT: 'M4 8h16v11H4V8Z M9 8V6a3 3 0 0 1 6 0v2 M4 13h16',
  COST_OF_LIVING: 'M12 3v18 M8 8c0-1.5 1.8-3 4-3s4 1 4 2.5S16 10 12 10s-4 1.5-4 3 1.8 2.5 4 2.5 4-1.5 4-3',
  LAWS: 'M12 3v18 M5 8l4-2 4 2-4 2-4-2Z M15 8l4-2 4 2-4 2-4-2Z M4 8v5a3 3 0 0 0 6 0V8 M14 8v5a3 3 0 0 0 6 0V8 M8 21h8'
}

const iconPath = computed(() => ICONS[props.categoryKey] || ICONS.LAWS)
const showImage = computed(() => Boolean(props.imageUrl) && !failed.value)
</script>

<template>
  <div
    class="relative w-full aspect-video rounded-sm overflow-hidden shrink-0"
    :class="!showImage ? `tampon--${categoryKey.toLowerCase()} bg-current/[0.06] border-2 border-current/25` : ''"
  >
    <img
      v-if="showImage"
      :src="imageUrl!"
      :alt="alt"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="failed = true"
    />
    <div v-else class="absolute inset-0 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path :d="iconPath" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>
