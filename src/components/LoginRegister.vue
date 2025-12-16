<template>
  <div class="container">
    <div class="box">
        <div class="close"><i class="el-icon-close" @click="closeMask()"></i></div>
      <div class="left"></div>
      <div class="right">
        <ul class="title">
          <li @click="countIn" :class="[countLog ? 'curLogin' : '']">账号登陆</li>
          <li><el-divider direction="vertical"></el-divider></li>
          <li  @click="toregister" :class="[!countLog ? 'curLogin' : '']">注册</li>
        </ul>

         <div v-if="countLog" class="form">
            <div class="logLine">
            <span>账 号</span>
            <input v-model="count.name" type="text" name="email" class="input" placeholder="请输入邮箱" />
            </div>
            <div class="logLine">
            <span>密 码</span>
            <input v-model="count.pwd" type="password" name="password" class="input" placeholder="请输入密码" />
            </div>
            <el-button @click="login" class="btn">登录</el-button>
            <div class="toregister" @click="toregister">没有账号？<span>注册</span></div>
        </div>

      <div v-if="!countLog" class="form">
           <div class="logLine">
            <span>邮 箱</span>
            <input v-model="emailCount.emailName" type="text" name="email" class="input" placeholder="请输入邮箱" /></div>
            <div class="logLine"><span>密 码</span>
            <input v-model="emailCount.emailPwd" type="password" name="password" class="input" placeholder="请输入密码" /></div>
            <el-button @click="register" class="btn">注册</el-button>
            
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
    name: 'LoginRegister',
    setup() {
        const store = useStore()
        const { proxy } = getCurrentInstance()
        
        const countLog = ref(true)
        const count = ref({
            name: "",
            pwd: ""
        })
        const userid = ref("")
        const emailCount = ref({
            emailName: "",
            emailPwd: "",
        })
        
        const $http = proxy?.$http || axios
        const $message = proxy?.$message || ElMessage
        
        const closeMask = () => {
            store.commit("closeMask")
        }
        const countIn = () => {
            countLog.value = true
        }
       
        //获取用户信息
        const getUser = async () => {
            try {
                if (!userid.value) {
                    return // 如果没有用户ID，直接返回
                }
                let res = await $http.get(`/user/` + userid.value, {
                    timeout: 10000 // 10秒超时
                })
                let toolUser = res.data.message
                store.commit("setUserInfo", toolUser)
            } catch(err) {
                console.error('获取用户信息失败:', err)
                // 只有网络错误或超时才显示登录框，其他错误不处理
                if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('timeout')) {
                    // 网络错误或超时，不强制显示登录框
                } else {
                    store.commit('showMask')
                }
            }
        }
       
        //登陆
        const login = () => {
            // 表单验证
            if (!count.value.name || !count.value.pwd) {
                $message({
                    message: '请输入邮箱和密码',
                    type: 'warning',
                    offset: 180,
                })
                return
            }

            $http
                .post(`/pb/login`, {
                    email: count.value.name, 
                    password: count.value.pwd,
                }, {
                    timeout: 15000 // 15秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        closeMask()
                        localStorage.setItem("token", response.data.message)
                        localStorage.setItem("id", response.data.user_id)
                        store.commit("hasLogin", true)
                        userid.value = localStorage.getItem("id")
                        getUser(userid.value)
                    } else {
                        $message({
                            message: '邮箱或密码错误',
                            type: 'warning',
                            offset: 180,
                        })
                        console.log("login")
                    }
                })
                .catch((error) => {
                    console.error('登录错误:', error)
                    let errorMsg = '登录失败，请稍后重试'
                    if (error.code === 'ECONNABORTED') {
                        errorMsg = '请求超时，请检查网络连接'
                    } else if (error.code === 'ERR_NETWORK') {
                        errorMsg = '网络错误，请检查网络连接'
                    } else if (error.response) {
                        errorMsg = error.response.data?.message || '登录失败'
                    }
                    $message({
                        message: errorMsg,
                        type: 'error',
                        offset: 180,
                    })
                })
        }

        //注册
        const register = () => {
            // 表单验证
            if (!emailCount.value.emailName || !emailCount.value.emailPwd) {
                $message({
                    message: '请输入邮箱和密码',
                    type: 'warning',
                    offset: 180,
                })
                return
            }

            $http
                .post(`/pb/regist/`, {
                    email: emailCount.value.emailName, 
                    password: emailCount.value.emailPwd,
                }, {
                    timeout: 15000 // 15秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        countLog.value = true
                        $message({
                            message: '注册成功，请登陆吧',
                            type: 'success',
                            offset: 180,
                        })
                    } else {
                        $message({
                            message: response.data?.message || '出错啦，请再试一次',
                            type: 'warning',
                            offset: 180,
                        })
                    }
                })
                .catch((error) => {
                    console.error('注册错误:', error)
                    let errorMsg = '注册失败，请稍后重试'
                    if (error.code === 'ECONNABORTED') {
                        errorMsg = '请求超时，请检查网络连接'
                    } else if (error.code === 'ERR_NETWORK') {
                        errorMsg = '网络错误，请检查网络连接'
                    } else if (error.response) {
                        errorMsg = error.response.data?.message || '注册失败'
                    }
                    $message({
                        message: errorMsg,
                        type: 'error',
                        offset: 180,
                    })
                })
        }

        const toregister = () => {
            countLog.value = false
        }
        
        return {
            countLog,
            count,
            userid,
            emailCount,
            closeMask,
            countIn,
            getUser,
            login,
            register,
            toregister
        }
    }
}
</script>

<style scoped>
.container {
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box {
  width: 820px;
  height: 440px;
  position: relative;
   color:#505050;
  border-radius: 8px;
  box-shadow: 0 0 6px rgb(0 0 0 / 10%);
  padding: 52px 65px 29px 92px;
  box-sizing: border-box;
  background-color: #fff;
  background-image: url('../assets/images/login.png');
  background-position: 100% 100%, 100% 100%;
  background-repeat: no-repeat, no-repeat;
  background-size: 100%;
  display: flex;
  justify-content: space-between;
  user-select: none;
}
.box .close{
    font-size:22px;
    position: absolute;
    top:20px;
    right:20px;
    cursor: pointer;
}
.box .close:hover{
    color:#4fa5d9;
}

.box .left {
  width: 173px;
  height: 281px;
}
.box .divider {
  width: 0px;
  height: 200px;
  border: 1px dashed #1d1d1f;
  margin: auto 45px;
}
.box .right {
  width: 400px;
  height: 281px;
}
.box .right .title{
    list-style: none;
    display: flex;
    justify-content:center;
    margin-bottom: 20px;
    margin-top:20px;
}
.curLogin{
    color:#4fa5d9;
}
.box .right .title li{
    font-size:18px;
    width:80px;
   height:20px;
   line-height: 20px;
    text-align: center;
    cursor: pointer;
}
.form{
display: flex;
    flex-direction: column;
    min-width: 100%;
    margin:0 auto;
}
.form .logLine{
    width:400px;
    height: 40px;
    display: flex;
    border: 1px solid #e7e7e7;
    border-radius: 4px;
    margin-bottom: 16px;
    padding:0 20px;
    font-size:14px;
    align-items: center;
}
.form .logLine span{
     height: 40px;
     line-height: 40px;
    
     color:#212121;
     margin-right: 20px;
}
.form .logLine input{
    width:230px;
    border:none;
    box-shadow: none;
   font-size:14px;
    color:#212121;
    
}
.toregister{
  text-align: center;
  margin-top:12px;
}
.toregister span{
  cursor: pointer;
}
.toregister span:hover{
  color:#4fa5d9;
}
</style>
