<template>
  <div
    class="polaroid-frame"
    :class="{
      'polaroid-frame--revealed': revealed,
      'polaroid-frame--developing': developing,
      'polaroid-frame--interactive': interactive,
    }"
    :style="frameStyle"
  >
    <span class="polaroid-frame__tape" :style="tapeStyle" aria-hidden="true" />
    <div class="polaroid-frame__photo">
      <slot />
    </div>
    <p v-if="caption" class="polaroid-frame__caption">{{ caption }}</p>
  </div>
</template>

<script>
export default {
  name: 'PolaroidFrame',
  props: {
    caption: {
      type: String,
      default: '',
    },
    rotate: {
      type: Number,
      default: 0,
    },
    tapeHue: {
      type: Number,
      default: 42,
    },
    revealed: {
      type: Boolean,
      default: true,
    },
    developing: {
      type: Boolean,
      default: false,
    },
    interactive: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    frameStyle() {
      return {
        '--polaroid-rotate': `${this.rotate}deg`,
      }
    },
    tapeStyle() {
      return {
        '--tape-hue': this.tapeHue,
      }
    },
  },
}
</script>

<style scoped>
.polaroid-frame {
  --polaroid-rotate: 0deg;
  --tape-hue: 42;
  position: relative;
  width: 100%;
  padding: 12px 12px 28px;
  background: #fff;
  border-radius: 3px;
  box-shadow:
    0 2px 8px rgba(80, 60, 40, 0.08),
    0 12px 28px rgba(80, 60, 40, 0.12);
  transform: rotate(var(--polaroid-rotate));
  transform-origin: center center;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.polaroid-frame--interactive:hover {
  transform: rotate(var(--polaroid-rotate)) translateY(-4px) scale(1.02);
  box-shadow:
    0 4px 12px rgba(80, 60, 40, 0.1),
    0 18px 36px rgba(80, 60, 40, 0.16);
}

.polaroid-frame--revealed {
  animation: polaroid-stick 0.65s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}

.polaroid-frame__tape {
  position: absolute;
  top: -7px;
  left: 50%;
  width: 52px;
  height: 18px;
  margin-left: -26px;
  border-radius: 2px;
  background: hsla(var(--tape-hue), 55%, 78%, 0.72);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transform: rotate(-2deg);
  opacity: 0.88;
}

.polaroid-frame__photo {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: linear-gradient(145deg, #f5efe6 0%, #ebe3d8 100%);
  border-radius: 1px;
}

.polaroid-frame__photo :deep(img),
.polaroid-frame__photo :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: block;
}

.polaroid-frame__photo :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.polaroid-frame--developing .polaroid-frame__photo :deep(.el-image__inner),
.polaroid-frame--developing .polaroid-frame__photo :deep(img) {
  filter: blur(6px) saturate(0.85);
  animation: polaroid-develop 0.85s ease forwards;
}

.polaroid-frame__caption {
  margin: 10px 0 0;
  font-family: 'KaiTi', 'STKaiti', '楷体', cursive;
  font-size: 13px;
  line-height: 1.4;
  color: #6b5b4f;
  text-align: center;
  min-height: 1.2em;
}

@keyframes polaroid-stick {
  0% {
    opacity: 0;
    transform: rotate(var(--polaroid-rotate)) translateY(24px) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: rotate(var(--polaroid-rotate)) translateY(0) scale(1);
  }
}

@keyframes polaroid-develop {
  0% {
    filter: blur(8px) saturate(0.7);
  }
  100% {
    filter: blur(0) saturate(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .polaroid-frame--revealed,
  .polaroid-frame--developing .polaroid-frame__photo :deep(.el-image__inner),
  .polaroid-frame--developing .polaroid-frame__photo :deep(img) {
    animation: none;
  }
}
</style>
