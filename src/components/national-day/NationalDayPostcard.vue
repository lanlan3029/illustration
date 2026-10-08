<template>
  <el-dialog v-model="visible" class="national-day-postcard-dialog" width="900px" :title="$t('nationalDayMoments.postcardTitle')" destroy-on-close @closed="reset">
    <div class="postcard-layout">
      <div class="postcard-preview" :aria-busy="busy">
        <img v-if="poster" :src="poster" :alt="$t('nationalDayMoments.postcardAlt')" />
        <p v-else-if="busy" role="status">{{ $t('nationalDayMoments.postcardLoading') }}</p>
        <div v-else class="postcard-error" role="alert">
          <p>{{ error }}</p>
          <button type="button" @click="render">{{ $t('nationalDayMoments.retryPostcard') }}</button>
        </div>
      </div>
      <div class="postcard-controls">
        <p class="postcard-kicker">NATIONAL DAY POST OFFICE</p>
        <h2>{{ $t('nationalDayMoments.postcardHeading') }}</h2>
        <p class="postcard-intro">{{ $t('nationalDayMoments.postcardIntro') }}</p>
        <button class="postcard-primary" type="button" :disabled="!poster || busy" @click="save">{{ $t('nationalDayMoments.savePostcard') }}</button>
        <p class="postcard-hint">{{ $t('nationalDayMoments.savePostcardHint') }}</p>
        <label for="national-postcard-invitation">{{ $t('nationalDayMoments.invitationLabel') }}</label>
        <textarea id="national-postcard-invitation" v-model="invitation" rows="6" />
        <button class="postcard-secondary" type="button" @click="copy">{{ $t('nationalDayMoments.copyInvitation') }}</button>
        <p v-if="status" class="postcard-status" role="status">{{ status }}</p>
        <p class="postcard-footnote">{{ $t('nationalDayMoments.postcardLinkHint') }}</p>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'
import { downloadPostcard, drawNationalDaySharePoster } from '@/utils/nationalDaySharePoster'
import { loadImageBlob } from '@/utils/canvasImageCompose'
import { buildShareLink, buildShareTitle } from '@/utils/nationalDayMoments'

export default {
  name: 'NationalDayPostcard',
  components: { ElDialog },
  props: {
    modelValue: Boolean,
    memory: { type: Object, default: null },
    crowdSrcs: { type: Array, default: () => [] },
    readyPoster: { type: String, default: '' },
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
    readyPoster(value) { if (value && this.modelValue) this.poster = value },
  },
  beforeUnmount() { this.renderVersion += 1 },
  methods: {
    reset() { this.renderVersion += 1; this.poster = ''; this.status = ''; this.busy = false },
    async render() {
      if (!this.memory?.imageUrl) return
      const version = this.renderVersion + 1
      this.renderVersion = version
      const memory = this.memory
      const url = buildShareLink(memory.id)
      this.poster = ''
      this.error = ''
      this.status = ''
      this.busy = true
      this.invitation = `${buildShareTitle(memory.note)}\n\n${this.$t('nationalDayMoments.invitationText')}\n${url}`
      if (this.readyPoster) {
        this.poster = this.readyPoster
        this.busy = false
        return
      }
      const objectUrls = []
      try {
        const heroSrc = await this.toDrawable(memory.imageUrl, objectUrls)
        const crowdSrcs = []
        for (const src of this.crowdSrcs) {
          try { crowdSrcs.push(await this.toDrawable(src, objectUrls)) } catch { /* skip one wall image */ }
        }
        const poster = await drawNationalDaySharePoster({
          heroSrc,
          crowdSrcs,
          story: memory.note,
          date: memory.createdAt,
          shareUrl: url,
        })
        if (version === this.renderVersion) this.poster = poster
      } catch (error) {
        console.warn('[NationalDayPostcard] render failed', error)
        if (version === this.renderVersion) this.error = this.$t('nationalDayMoments.postcardError')
      } finally {
        objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
        if (version === this.renderVersion) this.busy = false
      }
    },
    async toDrawable(src, objectUrls) {
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src
      const blob = await loadImageBlob(src, {
        http: this.$http,
        apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      })
      const objectUrl = URL.createObjectURL(blob)
      objectUrls.push(objectUrl)
      return objectUrl
    },
    save() {
      if (!this.poster) return
      const saved = downloadPostcard(this.poster, `national-day-postcard-${this.memory?.id || Date.now()}.png`)
      if (saved) this.status = this.$t('nationalDayMoments.postcardDownloaded')
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(this.invitation)
        this.status = this.$t('nationalDayMoments.invitationCopied')
      } catch {
        this.status = this.$t('nationalDayMoments.copyManually')
      }
    },
  },
}
</script>

<style>
.el-dialog.national-day-postcard-dialog { max-width: calc(100vw - 28px); border-radius: 12px; background: #fff6ef; margin: 5vh auto 40px; }
.national-day-postcard-dialog .el-dialog__title { color: #4a2c28; font-size: 17px; }
.national-day-postcard-dialog .el-dialog__body { padding: 10px 12px 18px; }
</style>
<style scoped>
.postcard-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr); gap: 30px; align-items: center; color: #4a2c28; text-align: left; }
.postcard-preview { background: #f8e6d8; min-height: 330px; display: grid; place-items: center; border-radius: 12px; }
.postcard-preview img { width: auto; max-width: 100%; max-height: calc(100dvh - 150px); height: auto; display: block; }
.postcard-error { padding: 28px; text-align: center; }
.postcard-controls { padding: 8px 8px 8px 0; }
.postcard-kicker { font-size: 10px; letter-spacing: 2px; color: #c23b32; }
.postcard-controls h2 { font-family: 'Songti SC', 'SimSun', serif; font-size: 28px; line-height: 1.6; margin: 16px 0; font-weight: 500; white-space: pre-line; }
.postcard-intro, .postcard-hint, .postcard-footnote { line-height: 1.8; font-size: 13px; color: #8a675f; }
.postcard-intro { margin-bottom: 24px; }
.postcard-hint { font-size: 11px; margin: 8px 0 24px; }
.postcard-footnote { font-size: 11px; margin: 16px 0 0; }
.postcard-controls label { font-size: 12px; display: block; margin-bottom: 8px; }
.postcard-controls textarea { box-sizing: border-box; width: 100%; resize: vertical; border: 1px solid #f0d2c4; border-radius: 6px; background: #fffdf8; padding: 12px; color: #4a2c28; font: inherit; font-size: 12px; line-height: 1.7; }
.postcard-primary, .postcard-secondary, .postcard-error button { width: 100%; border: 1px solid #c23b32; border-radius: 6px; padding: 12px; font: inherit; font-size: 14px; cursor: pointer; }
.postcard-primary { background: #c23b32; color: #fff; }
.postcard-secondary { background: transparent; color: #9b2c26; margin-top: 12px; }
button:disabled { opacity: .5; cursor: wait; }
button:focus-visible, textarea:focus-visible { outline: 2px solid #c23b32; outline-offset: 3px; }
.postcard-status { font-size: 12px; color: #9b2c26; line-height: 1.6; }
@media (max-width: 640px) {
  .postcard-preview img { width: 100%; max-height: none; }
  .postcard-layout { grid-template-columns: 1fr; gap: 20px; }
  .postcard-controls { padding: 0 8px; }
  .postcard-controls h2 { margin: 8px 0; font-size: 23px; }
}
</style>
