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
        height: 22,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: '',
        letterSpacing: 0,
        textAlign: '',
        color: '',
    },
}, ]

for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i]
    item.style = {...commonStyle, ...item.style }
    list[i] = {...commonAttr, ...item }
}

export default list