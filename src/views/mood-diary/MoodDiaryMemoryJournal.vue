<template>
  <div class="md-memory-journal">
    <MoodDiaryMemoryJournalPanel @done="onDone" />
  </div>
</template>

<script>
import MoodDiaryMemoryJournalPanel from '@/components/moodDiary/MoodDiaryMemoryJournalPanel.vue'

export default {
  name: 'MoodDiaryMemoryJournal',
  components: { MoodDiaryMemoryJournalPanel },
  methods: {
    onDone() {
      this.$router.replace('/mood-diary/narrative')
    }
  }
}
</script>

<style scoped>
.md-memory-journal {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .md-memory-journal {
    height: auto;
    min-height: 0;
    overflow: visible;
    padding: 0 2px;
  }
}
</style>
