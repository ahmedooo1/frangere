<script setup lang="ts">
const props = defineProps<{
  imageUrl?: string | null
  alt: string
}>()

const failed = ref(false)
const showImage = computed(() => Boolean(props.imageUrl) && !failed.value)
</script>

<template>
  <div v-if="showImage" class="relative w-full aspect-video rounded-sm overflow-hidden shrink-0">
    <img
      :src="imageUrl!"
      :alt="alt"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="failed = true"
    />
  </div>
</template>
