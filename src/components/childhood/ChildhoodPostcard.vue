<template>
  <el-dialog v-model="visible" class="childhood-postcard-dialog" width="900px" :title="$t('childhoodMoments.postcardTitle')" destroy-on-close @closed="reset">
    <div class="postcard-layout">
      <div class="postcard-preview" :aria-busy="busy">
        <img v-if="poster" :src="poster" :alt="$t('childhoodMoments.postcardAlt')" />
        <p v-else-if="busy" role="status">{{ $t('childhoodMoments.postcardLoading') }}</p>
        <div v-else class="postcard-error" role="alert">
          <p>{{ error }}</p>
          <button type="button" @click="render">{{ $t('childhoodMoments.retryPostcard') }}</button>
        </div>
      </div>
      <div class="postcard-controls">
        <p class="postcard-kicker">CHILDHOOD POST OFFICE</p>
        <h2>{{ $t('childhoodMoments.postcardHeading') }}</h2>
        <p class="postcard-intro">{{ $t('childhoodMoments.postcardIntro') }}</p>
        <button class="postcard-primary" type="button" :disabled="!poster || busy" @click="save">{{ $t('childhoodMoments.savePostcard') }}</button>
        <p class="postcard-hint">{{ $t('childhoodMoments.savePostcardHint') }}</p>
        <label for="postcard-invitation">{{ $t('childhoodMoments.invitationLabel') }}</label>
        <textarea id="postcard-invitation" v-model="invitation" rows="6" />
        <button class="postcard-secondary" type="button" @click="copy">{{ $t('childhoodMoments.copyInvitation') }}</button>
        <p v-if="status" class="postcard-status" role="status">{{ status }}</p>
        <p class="postcard-footnote">{{ $t('childhoodMoments.postcardLinkHint') }}</p>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ElDialog } from 'element-plus'
import { drawChildhoodSharePoster } from '@/utils/childhoodSharePoster'
import { downloadDataUrl } from '@/utils/lassoCrop'
import { buildShareLink, buildShareTitle } from '@/utils/childhoodMoments'

export default {
  name: 'ChildhoodPostcard',
  components: { ElDialog },
  props: {
    modelValue: Boolean,
    memory: { type: Object, default: null },
    crowdSrcs: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  data: () => ({ poster: '', busy: false, error: '', invitation: '', status: '', renderVersion: 0 }),
  computed: {
    visible: {
      get() { return this.modelValue },
      set(value) { this.$emit('update:modelValue', value) },
    },
  },
  watch: {
    modelValue(open) { if (open) this.render() },
  },
  beforeUnmount() { this.renderVersion++ },
  methods: {
    reset() { this.renderVersion++; this.poster = ''; this.status = ''; this.busy = false },
    async render() {
      if (!this.memory?.imageUrl) return
      const version = ++this.renderVersion
      const memory = this.memory
      const url = buildShareLink(memory.id)
      this.poster = ''; this.error = ''; this.status = ''; this.busy = true
      this.invitation = `${buildShareTitle(memory.note)}\n\n${this.$t('childhoodMoments.invitationText')}\n${url}`
      try {
        const poster = await drawChildhoodSharePoster({
          heroSrc: memory.imageUrl, crowdSrcs: this.crowdSrcs,
          story: memory.note, date: memory.createdAt, shareUrl: url,
        })
        if (version === this.renderVersion) this.poster = poster
      } catch (error) {
        console.warn('[ChildhoodPostcard] render failed', error)
        if (version === this.renderVersion) this.error = this.$t('childhoodMoments.postcardError')
      } finally {
        if (version === this.renderVersion) this.busy = false
      }
    },
    save() {
      if (!this.poster) return
      downloadDataUrl(`childhood-postcard-${this.memory.id || Date.now()}.png`, this.poster)
      this.status = this.$t('childhoodMoments.postcardDownloaded')
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(this.invitation)
        this.status = this.$t('childhoodMoments.invitationCopied')
      } catch {
        this.status = this.$t('childhoodMoments.copyManually')
      }
    },
  },
}
</script>

<style>
.el-dialog.childhood-postcard-dialog { max-width: calc(100vw - 28px); border-radius: 12px; background: #f8f5ee; margin: 5vh auto 40px; }
.childhood-postcard-dialog .el-dialog__title { color: #51483e; font-size: 17px; }
.childhood-postcard-dialog .el-dialog__body { padding: 10px 12px 18px; }
</style>
<style scoped>
.postcard-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr); gap: 30px; align-items: center; color: #51483e; text-align: left; }
.postcard-preview { background: #e5e9dd; min-height: 330px; display: grid; place-items: center; }
.postcard-preview img { width: auto; max-width: 100%; max-height: calc(100dvh - 150px); height: auto; display: block; }
.postcard-error { padding: 28px; text-align: center; }
.postcard-controls { padding: 8px 8px 8px 0; }
.postcard-kicker { font-size: 10px; letter-spacing: 2px; color: #697c71; }
.postcard-controls h2 { font-family: 'Songti SC', 'SimSun', serif; font-size: 28px; line-height: 1.6; margin: 16px 0; font-weight: 500; }
.postcard-intro, .postcard-hint, .postcard-footnote { line-height: 1.8; font-size: 13px; color: #777466; }
.postcard-intro { margin-bottom: 24px; }
.postcard-hint { font-size: 11px; margin: 8px 0 24px; }
.postcard-footnote { font-size: 11px; margin: 16px 0 0; }
.postcard-controls label { font-size: 12px; display: block; margin-bottom: 8px; }
.postcard-controls textarea { box-sizing: border-box; width: 100%; resize: vertical; border: 1px solid #d8d3c8; border-radius: 6px; background: #fffcf6; padding: 12px; color: #625d51; font: inherit; font-size: 12px; line-height: 1.7; }
.postcard-primary, .postcard-secondary, .postcard-error button { width: 100%; border: 1px solid #587784; border-radius: 6px; padding: 12px; font: inherit; font-size: 14px; cursor: pointer; }
.postcard-primary { background: #587784; color: #fff; }
.postcard-secondary { background: transparent; color: #425e69; margin-top: 12px; }
button:disabled { opacity: .5; cursor: wait; }
button:focus-visible, textarea:focus-visible { outline: 2px solid #587784; outline-offset: 3px; }
.postcard-status { font-size: 12px; color: #486d53; line-height: 1.6; }
@media (max-width: 640px) {
  .postcard-preview img { width: 100%; max-height: none; }
  .postcard-layout { grid-template-columns: 1fr; gap: 20px; }
  .postcard-controls { padding: 0 8px; }
  .postcard-controls h2 { margin: 8px 0; font-size: 23px; }
}
</style>
