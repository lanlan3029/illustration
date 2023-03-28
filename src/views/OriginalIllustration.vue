<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="el-select">
          <el-select
            v-model="model"
            style="width: 12vw; margin: 0"
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
        </div>

        <div class="items" v-infinite-scroll="load">
          <div class="item" v-for="item in illsArry" :key="item._id">
            <div>
              <el-image
                :src="`https://static.kidstory.cc/` + item.content"
                class="image"
                fit="cover"
                @click="toDetail(item._id)"
              />
              <div class="data">
                <span class="name">{{ item.title }}</span>
                <div class="icon"
                  ><span v-if="likeIllusArr.includes(item._id)" ><i class="iconfont icon-aixin1" style="color:#F489B5"></i></span>
                  <span v-else><i  class="iconfont icon-aixin" @click="likeIllusFun(item._id)"></i></span></div
                >
              </div>
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
import {mapState} from "vuex"

export default {
  name: "Home",
  components: {
    RightMenu,
  },
  data() {
    return {
      userid:localStorage.getItem("id"),
      illsArry: [],
      num: 1,
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
  computed:mapState([
        "collectIllusArr",
        "likeIllusArr",
    ]),
  methods: {
    toDetail(id) {
      this.$router.push({
        name: "illusdetails",
        params: { illId: id },
      });
    },
    getIllus() {
      this.$http
        .get(`/ill/?sort_param=heat&sort_num=desc&page=1`)
        .then((response) => {
          this.illsArry = response.data.message;
          console.log(this.illsArry);
        })
        .catch((error) => console.log(error));
    },
    async load() {
      this.num++;
      try {
        let res = await this.$http.get(
          `/ill/?sort_param=heat&sort_num=desc&page=` + this.num
        );
        console.log(res.data.message);
        this.illsArry = this.illsArry.concat(res.data.message);
        console.log(this.illsArry);
      } catch (err) {
        console.log(err);
      }
    },

    //新增喜欢插画
    likeIllusFun(id) {     
      this.$http
        .post(`/user/like/`+id,{ownerid:this.userid,type:"illustration",likeid:id}
        ,{
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          console.log(response)
          if (response.data.desc === "success") {
              //把该插画ID添加到用户已收藏插画数组
              this.$store.commit("likeIllus",id)
          } 
        })
        .catch((error) => console.log(error));
    },
  },
  mounted() {
    this.getIllus();
  },
}
</script>
<style scoped>
.content {
  display: flex;
}
.content-left {
  width: 80vw;
  height: 88vh;
  background-color: #f5f6fa;
  overflow-y: scroll;
}
.items {
  width: 100%;
  padding: 0 6vw;
  height: 88vw;
  margin-top: 2vh;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
}
.item {
  width: 20vw;
  margin: 1vw;
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
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
}
.text {
  margin-top: 1vh;
}
.data {
  display: flex;
  height: 18px;
  justify-content: space-between;
  color: #606266;
  align-items: center;
}
.data .name {
  width: 12vw;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipse;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}
.data .icon {
  width: 4vw;
  font-size: 14px;
 display: inline-flex;
 justify-content: flex-end;
 align-items: center;
  cursor: pointer;
}

.el-select {
  margin-top: 2vh;
  width: 100%;
  display: flex;
  justify-content: space-around;
  height: 30px;
  padding: 0 1vw;
}
</style>




