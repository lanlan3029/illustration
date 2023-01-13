<template>
<div id="app">
  <top-bar/>
  <login-register v-if="isMask" />
  <router-view />
  <the-footer/>
  </div>
</template>
<script>
import {mapState} from "vuex"
import TopBar from './components/TopBar.vue'
import LoginRegister from "./components//LoginRegister.vue"
import TheFooter from './components/TheFooter.vue'

document.oncontextmenu = function () {
        return false;
      };
export default {
  components: {
    TopBar,LoginRegister,TheFooter
  },
  data(){
    return{
    }   
  },
   computed:mapState([
        "isMask",      
    ]),
    
  methods:{
   
   
}
}
</script>

<style >
#app {
    font-family:
        "PingFang SC", "Lantinghei SC", "Microsoft YaHei", "HanHei SC", "Helvetica Neue", "Open Sans", Arial, "Hiragino Sans GB", 微软雅黑, STHeiti, "WenQuanYi Micro Hei", SimSun, sans-serif, HYWenHei-GEW ;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
</style>