<template>
  <div class="md-generate">
    <MoodDiaryPosterWizard @done="$router.replace('/mood-diary/narrative')" />
  </div>
</template>

<script>
import MoodDiaryPosterWizard from '@/components/moodDiary/MoodDiaryPosterWizard.vue'

export default {
  name: 'MoodDiaryGenerate',
  components: { MoodDiaryPosterWizard }
}
</script>

<style scoped>
.md-generate {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
