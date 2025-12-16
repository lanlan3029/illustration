<template>
    <div style="overflow:hidden">
        <img :src="propValue">
    </div>
</template>
<script>
export default {
    name: 'CustomPicture',
    props:{
        propValue:{
            type:String,
            require:true,
            default:''
        },
        element:{
            type:Object,
            default:() => {}
        }
    }
}
</script>

<style scoped>
img{
    width: 100%;
    height: 100%;
}
</style>