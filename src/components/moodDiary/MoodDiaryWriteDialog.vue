<template>
  <el-dialog
    v-model="visible"
    :title="$t('moodDiary.writeDialogTitle')"
    width="min(580px, 94vw)"
    class="mood-write-dialog"
    modal-class="mood-write-overlay"
    align-center
    append-to-body
    destroy-on-close
    :show-close="true"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <MoodDiaryNowPanel in-dialog @submitted="onSubmitted" />
  </el-dialog>
</template>

<script>
import MoodDiaryNowPanel from '@/components/moodDiary/MoodDiaryNowPanel.vue'

export default {
  name: 'MoodDiaryWriteDialog',
  components: { MoodDiaryNowPanel },
  data() {
    return {
      visible: false
    }
  },
  methods: {
    open() {
      this.visible = true
    },
    close() {
      this.visible = false
    },
    onSubmitted() {
      this.close()
    },
    onClosed() {
      this.visible = false
    }
  }
}
</script>

<style>
.mood-write-overlay {
  background-color: rgba(0, 0, 0, 0.62) !important;
}

.mood-write-dialog .el-dialog {
  border-radius: 28px;
  overflow: hidden;
}

.mood-write-dialog .el-dialog__header {
  padding: 8px 12px 0;
  margin-right: 0;
}

.mood-write-dialog .el-dialog__headerbtn {
  top: 8px;
  right: 12px;
}

.mood-write-dialog .el-dialog__title {
  display: none;
}

.mood-write-dialog .el-dialog__body {
  padding: 12px 24px 28px;
  min-height: min(72vh, 760px);
  max-height: min(90vh, 960px);
  overflow-y: auto;
}

.mood-write-dialog .now-panel--dialog {
  padding: 0;
  overflow: visible;
  background: transparent;
}
</style>
