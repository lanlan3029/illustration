<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="el-select">
          <el-select
            v-model="model"
            style="width: 12vw;margin:0"
            placeholder="排序方式"
             size="mini"
          >
            <el-option
              v-for="item in sortList"
              :value="item.value"
              :key="item.value"
              >{{ item.label }}</el-option
            >
          </el-select>
          <el-radio-group v-model="button1"  size="mini">
            <el-radio-button label="不限"></el-radio-button>
            <el-radio-button label="0-3岁"></el-radio-button>
            <el-radio-button label="3-6岁"></el-radio-button>
          </el-radio-group>
          <el-radio-group v-model="button2"  size="mini">
            <el-radio-button label="不限"></el-radio-button>
            <el-radio-button label="百科"></el-radio-button>
            <el-radio-button label="习惯"></el-radio-button>
            <el-radio-button label="益智"></el-radio-button>
            <el-radio-button label="艺术"></el-radio-button>
            <el-radio-button label="英语"></el-radio-button>
          </el-radio-group>
        </div>
        <div class="item" v-for="(item, index) in books" :key="index">
          <el-card style="width: 20vw" >
            <div>
              <el-image :src="item" class="image" fit="cover" @click="toDetail()"/>
               <div class="data">
              <span class="name">快乐的玛丽</span>
              <span class="icon"><i class="el-icon-edit"></i>123</span>
               <span class="icon"><i class="el-icon-share"></i>2345</span>
            </div>
            </div>
          </el-card>
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
      this.$router.push("/original-books/original-bookdetails");
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
  height: 15vw;
  overflow: hidden;
  border-radius: 4px;
  user-select: none;
}
.image {
  width: 17vw;
  height: 10vw;
  border-radius: 4px;
  cursor: pointer;
}
.text {
  margin-top: 1vh;
}
.el-select {
  margin-top: 2vh;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 1vw;
}
.el-input__inner{
  height:28px;
  line-height:28px;
}
.data{
  display: flex;
  height:18px;
justify-content: space-between;
color:#606266;
align-items: center;
  
}
.data .name{
  width:11vw;
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
  overflow: hidden;
  white-space:nowrap;
}
</style>