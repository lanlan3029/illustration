<template>
  <footer class="box">
    <a href="https://beian.miit.gov.cn/#/Integrated/index" class="message" target="_blank" rel="noopener">
      <img 
        src="../assets/images/record-14x14.png" 
        alt="备案" 
        width="14" 
        height="14" 
        loading="lazy"
        decoding="async"
      />
      <span>鲁ICP备2023000705号-1</span>
   </a>
  </footer>
</template>

<script>
export default {
  name: 'TheFooter'
}
</script>

<style scoped>
.box{
  height:40px;
  width: 100%;
    background-color: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box a{
  display: inline-flex;
  align-items: center;
  gap: 6px;
    text-decoration: none;
  color:#606266;
  font-size: 13px;
}

.box a:hover{
  color:#1f6fd4;
}

.box a img{
  width: 14px;
  height: 14px;
  object-fit: contain;
  display: block;
}
</style>