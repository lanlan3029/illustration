<template>
  <div class="museum-scene" aria-hidden="true" v-html="svgMarkup" />
</template>

<script>
import bgSvgRaw from '@/assets/images/newyear/homepage-bg-museum.svg?raw'
import bgPng from '@/assets/images/newyear/homepage-bg-museum-v2.png'

export default {
  name: 'MuseumSceneBackground',
  computed: {
    svgMarkup() {
      const svg = bgSvgRaw.replace(
        'homepage-bg-museum-v2.png',
        bgPng
      )
      return svg.replace(
        '<svg ',
        '<svg class="museum-scene__svg" '
      )
    },
  },
}
</script>

<style scoped>
.museum-scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.museum-scene :deep(.museum-scene__svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
