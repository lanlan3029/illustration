<template>
  <div class="mask-wrap">
    <RadioGroup v-model="maskLevel" type="button" size="small" @on-change="onLevelChange">
      <Radio label="none">{{ $t('bgSeting.maskNone') || '无' }}</Radio>
      <Radio label="light">{{ $t('bgSeting.maskLight') || '浅色' }}</Radio>
      <Radio label="dark">{{ $t('bgSeting.maskDark') || '深色' }}</Radio>
    </RadioGroup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import useSelect from '@/components/editorPro/hooks/select.js'

const { canvasEditor } = useSelect() || {}

const maskLevel = ref('none')

const syncFromEditor = () => {
  if (typeof canvasEditor?.getWorkspaceMaskLevel === 'function') {
    maskLevel.value = canvasEditor.getWorkspaceMaskLevel() || 'none'
    return
  }
  // 兼容旧 API
  maskLevel.value = canvasEditor?.getworkspaceMaskStatus?.() ? 'dark' : 'none'
}

const onLevelChange = (level) => {
  const next = level === 'light' || level === 'dark' ? level : 'none'
  maskLevel.value = next
  if (typeof canvasEditor?.setWorkspaceMaskLevel === 'function') {
    canvasEditor.setWorkspaceMaskLevel(next)
    return
  }
  // 兼容旧开关：仅 none ↔ dark
  const on = canvasEditor?.getworkspaceMaskStatus?.()
  if (next === 'none' && on) canvasEditor.workspaceMaskToggle()
  if (next !== 'none' && !on) canvasEditor.workspaceMaskToggle()
}

onMounted(() => {
  syncFromEditor()
})
</script>

<style scoped>
.mask-wrap {
  display: flex;
  align-items: center;
}
</style>
