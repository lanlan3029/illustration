<template>
    <div v-if="show" class="model-bg" @click="hide">
        <div class="fadeInLeft animated modal" @click="stopPropagation">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    model:{
        prop:'show',
        event:'change'
    },
    props:{
        show:{
            type:Boolean,
            default:false
        }
    },
    methods:{
        /**
         * 通过 $on(eventName,eventHandler) 侦听一个事件
         * 通过 $once(eventName,eventHandler) 一次性侦听一个事件
         * 通过 $off(eventName,eventHandler) 停止侦听一个事件
         * $emit 触发当前实例上的事件。附加参数都会传给监听器回调
        */
       hide(){
           this.$emit('change')
       },
       stopPropagation(e){
           e.stopPropagation()
       }
    }
}
</script>
<style scoped>
.model-bg{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, .5);
    z-index: 1001;
}
.modal{
    width: 400px;
    background: #fff;
    height: 100%;
}
</style>