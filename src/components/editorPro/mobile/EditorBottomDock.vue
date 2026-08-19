<template>
  <nav class="editor-dock" aria-label="editor tools">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="editor-dock__btn"
      :class="{ active: activeKey === item.key && leftOpen }"
      @click="$emit('select-left', item.key)"
    >
      <Icon :type="item.icon" size="22" />
      <span class="editor-dock__label">{{ item.name }}</span>
    </button>
    <button
      type="button"
      class="editor-dock__btn"
      :class="{ active: rightOpen }"
      @click="$emit('select-right')"
    >
      <Icon type="md-options" size="22" />
      <span class="editor-dock__label">{{ attrsLabel }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  activeKey: { type: String, default: '' },
  leftOpen: { type: Boolean, default: false },
  rightOpen: { type: Boolean, default: false },
  attrsLabel: { type: String, default: '属性' },
})

defineEmits(['select-left', 'select-right'])
</script>

<style scoped>
.editor-dock {
  position: relative;
  z-index: 20;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  width: 100%;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #e8ecf2;
  box-shadow: 0 -4px 18px rgba(30, 30, 50, 0.08);
}

.editor-dock__btn {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #8a8aa3;
  cursor: pointer;
  padding: 6px 2px;
  -webkit-tap-highlight-color: transparent;
}

.editor-dock__btn.active {
  color: #6b5ce0;
}

.editor-dock__label {
  font-size: 10px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
