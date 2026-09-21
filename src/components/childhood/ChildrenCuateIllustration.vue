<template>
  <div
    class="children-cuate"
    :class="{ 'children-cuate--paused': !playing }"
    :style="{ '--cuate-size': `${size}px` }"
    aria-hidden="true"
  >
    <object
      class="children-cuate__svg"
      :data="svgSrc"
      type="image/svg+xml"
      aria-hidden="true"
    />
  </div>
</template>

<script>
import svgSrc from '@/assets/childhood/children-cuate.svg'

export default {
  name: 'ChildrenCuateIllustration',
  props: {
    size: {
      type: Number,
      default: 220,
    },
    playing: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return { svgSrc }
  },
}
</script>

<style scoped>
.children-cuate {
  --cuate-size: 220px;
  width: var(--cuate-size);
  max-width: 100%;
  pointer-events: none;
  user-select: none;
  animation: cuate-float 8s ease-in-out infinite;
}

.children-cuate__svg {
  display: block;
  width: 100%;
  height: var(--cuate-size);
  pointer-events: none;
}

.children-cuate--paused {
  animation-play-state: paused;
}

@keyframes cuate-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .children-cuate {
    animation: none;
  }
}
</style>
