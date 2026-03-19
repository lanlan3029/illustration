<template>
  <Button class="ai-transfer-btn" style="margin-left: 10px" @click="toStyleTransfer">
    {{ $t('toolbar.styleTransfer') || 'AI优化' }}
  </Button>
</template>

<script setup name="style-transfer-btn">
import { Message } from 'view-ui-plus';
import { useRouter } from 'vue-router';
import useSelect from '@/components/editorPro/hooks/select';

const router = useRouter();
const { canvasEditor } = useSelect();

const toStyleTransfer = async () => {
  try {
    // 与 Creation.vue 一致：写入 localStorage，然后跳转到同一路径
    const base64 = await canvasEditor.preview();
    localStorage.setItem('styleTransferContentImage', base64);
    router.push('/user/upload/style-transfer');
  } catch (e) {
    Message.error('导出失败');
  }
};
</script>

<style>
.ai-transfer-btn {
  color: #dff4ff;
  border: 1px solid rgba(91, 226, 255, 0.65) !important;
  border-radius: 999px;
  padding: 0 24px;
  height: 30px;
  margin-right: 24px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-color: #1f2f5f !important;
  background-image: linear-gradient(135deg, rgba(42, 16, 92, 0.9), rgba(14, 84, 156, 0.95)) !important;
  box-shadow:
    0 0 0 1px rgba(111, 240, 255, 0.22) inset,
    0 0 14px rgba(40, 197, 255, 0.35);
  transition: all 0.2s ease;
}

.ai-transfer-btn:hover {
  color: #ffffff;
  transform: translateY(-1px);
  border-color: rgba(144, 245, 255, 0.95) !important;
  background-color: #243b75 !important;
  background-image: linear-gradient(135deg, rgba(52, 24, 112, 0.95), rgba(21, 105, 188, 1)) !important;
  box-shadow:
    0 0 0 1px rgba(111, 240, 255, 0.35) inset,
    0 0 18px rgba(56, 214, 255, 0.55);
}

.ai-transfer-btn:active {
  transform: translateY(0);
  filter: brightness(0.96);
}
</style>

