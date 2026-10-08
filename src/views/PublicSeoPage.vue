<template><PublicSeoContent :path="$route.path.replace(/\/$/, '')" /></template>
<script>
import PublicSeoContent from '@/components/PublicSeoContent.vue'
export default { components: { PublicSeoContent } }
</script>
