// 公共样式
export const commonStyle = {
    rotate: 0,
    opacity: 1,
    zIndex: 1
}

export const commonAttr = {

    events: {},
    groupStyle: {}, // 当一个组件成为 Group 的子组件时使用
    isLock: false, // 是否锁定组件
}


// 编辑器左侧组件列表
const list = [{
    component: 'v-text',
    label: '插入文字',
    propValue: '双击编辑文字',
    icon: 'wenben',
    style: {
        width: 200,
        height: 32,
        fontSize: 28,
        fontWeight: 700,
        fontFamily: 'Microsoft YaHei, sans-serif', // 默认字体（微软雅黑，清晰易读，适合儿童）
        lineHeight: '',
        letterSpacing: 0,
        textAlign: '',
        color: '#000000', // 默认黑色
    },
}, ]

for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i]
    item.style = {...commonStyle, ...item.style }
    list[i] = {...commonAttr, ...item }
}

export default list