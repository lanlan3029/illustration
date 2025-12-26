<template>
  <div class="book-loading" :class="{ 'fullscreen': fullscreen }">
    <div class="book-loading-wrapper">
      <div class="loader"></div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookLoading',
  props: {
    fullscreen: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.book-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.book-loading.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  z-index: 9999;
  padding: 0;
}

.book-loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loader {
  width: 12px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #8167a9;
  clip-path: inset(-220%);
  animation: l28 2s infinite linear;
}

@keyframes l28 {
  0%  {box-shadow:0 0 0 0   , 40px 0,-40px 0,0 40px,0 -40px}
  10% {box-shadow:0 0 0 0   , 12px 0,-40px 0,0 40px,0 -40px}
  20% {box-shadow:0 0 0 4px , 0px  0,-40px 0,0 40px,0 -40px}
  30% {box-shadow:0 0 0 4px , 0px  0,-12px 0,0 40px,0 -40px}
  40% {box-shadow:0 0 0 8px , 0px  0,  0px 0,0 40px,0 -40px}
  50% {box-shadow:0 0 0 8px , 0px  0,  0px 0,0 12px,0 -40px}
  60% {box-shadow:0 0 0 12px, 0px  0,  0px 0,0  0px,0 -40px}
  70% {box-shadow:0 0 0 12px, 0px  0,  0px 0,0  0px,0 -12px}
  80% {box-shadow:0 0 0 16px, 0px  0,  0px 0,0  0px,0  0px }
  90%,
  100%{box-shadow:0 0 0 0   , 40px 0,-40px 0,0 40px,0 -40px}
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #8167a9;
  font-weight: 500;
  animation: textFade 2s ease-in-out infinite;
}

@keyframes textFade {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .loader {
    width: 10px;
  }
  
  .loading-text {
    font-size: 12px;
  }
}
</style>
