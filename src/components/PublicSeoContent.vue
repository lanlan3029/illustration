<template><div v-html="html" /></template>
<script>
import publicSeo from '@/utils/publicSeoContent.cjs'
import '@/styles/publicSeo.css'
export default {
  props: { path: { type: String, required: true }, compact: { type: Boolean, default: false } },
  computed: {
    html() {
      const page = publicSeo.catalog.pages.find(page => page.path === this.path)
      return page ? publicSeo.renderPageContent(page, this.compact) : ''
    },
  },
}
</script>
