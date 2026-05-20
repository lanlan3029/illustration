<template>
  <div class="book-flip-loader" role="img" :aria-label="ariaLabel">
    <div class="bb-scene">
      <!-- 书脊与后封 -->
      <div class="bb-spine" />
      <!-- 左页（固定） -->
      <div class="bb-page bb-page--left">
        <span class="bb-line" />
        <span class="bb-line bb-line--short" />
      </div>
      <!-- 右下承页 -->
      <div class="bb-page bb-page--right-base">
        <span class="bb-icon" />
      </div>
      <!-- 翻页层：双面前后同色，绕书脊 Y 轴 -->
      <div class="bb-flip">
        <div class="bb-flip-face bb-flip-face--front" />
        <div class="bb-flip-face bb-flip-face--back" />
      </div>
      <!-- 书签 -->
      <div class="bb-ribbon" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookFlipLoader',
  props: {
    ariaLabel: {
      type: String,
      default: '加载中'
    }
  }
}
</script>

<style scoped>
/* 配色参考：米色书页、橄榄封面、灰蓝书签 */
.bb-scene {
  --bb-page: #e8dcc8;
  --bb-cover: #7a6b52;
  --bb-ink: #5c4f3d;
  --bb-ribbon: #b8c4ce;
  --bb-w: 104px;
  --bb-h: 72px;
  --bb-radius: 6px;
  position: relative;
  width: var(--bb-w);
  height: var(--bb-h);
  perspective: 520px;
  perspective-origin: 50% 50%;
}

.bb-spine {
  position: absolute;
  left: 50%;
  top: 2px;
  transform: translateX(-50%);
  width: 8px;
  height: calc(100% - 4px);
  background: linear-gradient(90deg, var(--bb-cover), #8f8068, var(--bb-cover));
  border-radius: 2px;
  z-index: 0;
}

.bb-page {
  position: absolute;
  top: 4px;
  height: calc(100% - 8px);
  background: var(--bb-page);
  border: 2px solid var(--bb-cover);
  border-radius: var(--bb-radius);
  box-sizing: border-box;
}

.bb-page--left {
  left: 2px;
  width: calc(50% - 5px);
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
}

.bb-line {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: var(--bb-ink);
  opacity: 0.35;
  width: 100%;
}

.bb-line--short {
  width: 72%;
  align-self: flex-start;
}

.bb-page--right-base {
  right: 2px;
  width: calc(50% - 5px);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bb-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bb-ink);
  opacity: 0.4;
  position: relative;
}
.bb-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -4px;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50% 50% 40% 40%;
  background: var(--bb-ink);
  opacity: 0.5;
}

/* 翻页：右半页绕左缘旋转 */
.bb-flip {
  position: absolute;
  right: 2px;
  top: 4px;
  width: calc(50% - 5px);
  height: calc(100% - 8px);
  transform-style: preserve-3d;
  transform-origin: left center;
  z-index: 4;
  animation: bb-flip-cycle 2.2s ease-in-out infinite;
}

.bb-flip-face {
  position: absolute;
  inset: 0;
  border-radius: 0 var(--bb-radius) var(--bb-radius) 0;
  border: 2px solid var(--bb-cover);
  border-left: none;
  box-sizing: border-box;
  backface-visibility: hidden;
  background: var(--bb-page);
}

.bb-flip-face--back {
  transform: rotateY(180deg);
}

@keyframes bb-flip-cycle {
  0% {
    transform: rotateY(0deg);
  }
  45% {
    transform: rotateY(-178deg);
  }
  55% {
    transform: rotateY(-178deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

.bb-ribbon {
  position: absolute;
  left: 50%;
  top: -2px;
  transform: translateX(-50%);
  width: 6px;
  height: 18px;
  background: var(--bb-ribbon);
  border-radius: 1px 1px 0 0;
  z-index: 5;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  animation: bb-ribbon-sway 2.2s ease-in-out infinite;
}
.bb-ribbon::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid var(--bb-ribbon);
}

@keyframes bb-ribbon-sway {
  0%,
  100% {
    transform: translateX(-50%) rotate(0deg);
  }
  25% {
    transform: translateX(-50%) rotate(-4deg);
  }
  75% {
    transform: translateX(-50%) rotate(4deg);
  }
}
</style>
