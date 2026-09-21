<template>
  <div
    class="children-cuate"
    :class="[
      `children-cuate--${variant}`,
      { 'children-cuate--paused': !playing },
    ]"
    :style="size ? { '--cuate-size': `${size}px` } : null"
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
    variant: {
      type: String,
      default: 'inline',
    },
    size: {
      type: Number,
      default: 0,
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
  pointer-events: none;
  user-select: none;
}

.children-cuate--inline {
  --cuate-size: 220px;
  width: var(--cuate-size);
  max-width: 100%;
  animation: cuate-float 9s ease-in-out infinite;
}

.children-cuate--hero {
  width: min(720px, 100%);
  margin: 0 auto;
}

.children-cuate__svg {
  display: block;
  width: 100%;
  pointer-events: none;
}

.children-cuate--inline .children-cuate__svg {
  height: var(--cuate-size);
}

.children-cuate--hero .children-cuate__svg {
  height: auto;
  aspect-ratio: 1 / 1;
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
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .children-cuate--inline {
    animation: none;
  }
}
</style>
