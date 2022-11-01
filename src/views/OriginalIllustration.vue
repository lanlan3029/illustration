<template>
  <div>
    <div class="content">
      <div class="content-left">
       
        <div class="item" v-for="(item, index) in books" :key="index">
          
            <div>
              <el-image :src="item" class="image" fit="cover"  @click="toDetail()"/>
            <div class="data">
              <span class="name">快乐的玛丽</span>
              <span class="icon"><i class="el-icon-edit"></i>123</span>
               <span class="icon"><i class="el-icon-share"></i>2345</span>
            </div>
            </div>
         
        </div>
      </div>

      <right-menu />

      
    </div>
  </div>
</template>

<script>
// @ is an alias to /src


import RightMenu from "../components/RightMenu.vue";

export default {
  name: "Home",
  components: {
    
    RightMenu,
  },
  data() {
    return {
      books: [
        require("../assets/books/image-12085380--square.jpg"),
        require("../assets/books/image-12085381--square.jpg"),
        require("../assets/books/image-12085382--square.jpg"),
        require("../assets/books/image-12085389--square.jpg"),
        require("../assets/books/image-12086904--square.jpg"),
        require("../assets/books/image-12086905--square.jpg"),
        require("../assets/books/image-12086906--square.jpg"),
        require("../assets/books/image-12086907--square.jpg"),
        require("../assets/books/image-12086908--square.jpg"),
        require("../assets/books/image-12087548--square.jpg"),
        require("../assets/books/image-12089476--square.jpg"),
        require("../assets/books/image-12089477--square.jpg"),
        require("../assets/books/image-12089478--square.jpg"),
      ],
      sortList: [
        {
          value: "default",
          label: "默认",
        },
        {
          value: "hot",
          label: "热度",
        },
        {
          value: "time",
          label: "时间",
        },
      ],
      model: "",
      button1: "不限",
      button2: "不限",
    };
  },
  methods: {
    toDetail() {
      this.$router.push("/original-illustration/original-illusdetails");
    },
  },
};
</script>
<style scoped>
.content {
  display: flex;
}
.content-left {
  width: 80vw;
  padding: 0 7vw;
  height: 88vh;
  display: flex;
  flex-wrap: wrap;
  background-color: #f5f6fa;
  overflow: scroll;
}
.item {
  width: 20vw;
  margin: 2vh 1vw;
  height: 16vw;
  overflow: hidden;
  border-radius: 4px;
  user-select: none;
}
.image {
  cursor: pointer;
  width: 20vw;
  height: 14.08vw;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .1);
}
.text {
  margin-top: 1vh;
}
.data{
  display: flex;
  height:18px;
justify-content: space-between;
color:#606266;
  align-items: center;
}
.data .name{
  width:14vw;
  display: inline-block;
 white-space:nowrap;
overflow:hidden;
text-overflow:ellipse;
font-size:14px;
font-weight: 500;
}
.data .icon{
  width:3vw;
  display: block;
  font-size:12px;
}
</style>