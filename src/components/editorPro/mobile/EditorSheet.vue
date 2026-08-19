<template>
  <Teleport to="body">
    <div v-if="modelValue" class="editor-sheet" @keydown.esc.prevent="close">
      <div class="editor-sheet__mask" @click="close" />
      <div
        class="editor-sheet__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'panel'"
      >
        <div class="editor-sheet__handle" aria-hidden="true" />
        <header class="editor-sheet__head">
          <h3 class="editor-sheet__title">{{ title }}</h3>
          <button type="button" class="editor-sheet__close" aria-label="close" @click="close">
            ×
          </button>
        </header>
        <div class="editor-sheet__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.editor-sheet {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.editor-sheet__mask {
  position: absolute;
  inset: 0;
  background: rgba(20, 18, 30, 0.38);
  pointer-events: auto;
}

.editor-sheet__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 28px rgba(26, 26, 40, 0.16);
  display: flex;
  flex-direction: column;
  min-height: 0;
  pointer-events: auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  animation: editor-sheet-up 0.22s ease-out;
}

.editor-sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #d8d6e0;
  margin: 8px auto 0;
  flex-shrink: 0;
}

.editor-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid #eef1f6;
  flex-shrink: 0;
}

.editor-sheet__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2430;
}

.editor-sheet__close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f7;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  color: #555;
  cursor: pointer;
}

.editor-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 12px 16px;
  text-align: left;
}

@keyframes editor-sheet-up {
  from {
    transform: translateY(12%);
    opacity: 0.85;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
