import Vue from 'vue'
import Vuex from 'vuex'
import { $ } from '@/utils/utils'
import contextmenu from "./contextmenu"
import copy from "./copy"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {

        ...contextmenu.state,
        ...copy.state,
        // 编辑器模式 edit preview
        editMode: "edit",
        // 页面全局数据
        canvasStyleData: {
            width: 1200,
            height: 740,
            scale: 100
        },
        // 画布组件数据
        componentData: [],
        // 鼠标选中的组件
        curComponent: null,
        // 鼠标选中的组件id
        curComponentIndex: null,
        // 点击画布时是否点中组件，主要用于取消选中组件用
        // 如果没有中组件，并且在画布空白处弹起鼠标，则取消当前组件的选中状态
        isClickComponent: false,
        // 是否裁剪
        ifCropper: false,
        //合成PDF
        imgToPDF: [],
        isLogin: false,
        isMask: false,

        //creation页面要上传的图片
        imgUrl: '',
        editionIllus: {},
        editionBook: {},
        books: [],
        myBooks: [],
    },
    mutations: {
        ...contextmenu.mutations,
        ...copy.mutations,
        // 是否裁剪
        changeCropper(state, status) {
            state.ifCropper = status
        },
        // 是否编辑文字

        getEditor(state) {
            state.editor = $('#editor')
        },
        // 是否处在点击组件的阶段
        setClickComponentStatus(state, status) {
            state.isClickComponent = status
        },
        setEditMode(state, mode) {
            state.editMode = mode
        },
        setCanvasStyle(state, style) {
            state.canvasStyleData = style
        },
        setCurComponent(state, { component, index }) {
            state.curComponent = component
            state.curComponentIndex = index
        },
        setShapeStyle({ curComponent }, { top, left, width, height, rotate }) {
            if (top) curComponent.style.top = top
            if (left) curComponent.style.left = left
            if (width) curComponent.style.width = width
            if (height) curComponent.style.height = height
            if (rotate) curComponent.style.rotate = rotate
        },
        setShapeSingStyle({ curComponent }, { key, value }) {
            curComponent.style[key] = value
        },
        setComponentData(state, componentData = []) {
            Vue.set(state, "componentData", componentData)
        },
        setComponentImage(state, status) {
            state.curComponent.propValue = status
        },
        // 添加图片数据的内容
        addComponent(state, { component, index }) {
            if (index !== undefined) {
                // splice(从第index元素开始插入或者删除,删除的元素个数是多少，要添加到数组的新元素)
                state.componentData.splice(index, 0, component)
            } else {
                state.componentData.push(component)
            }
        },
        deleteComponent(state, index) {
            if (index === undefined) {
                index = state.curComponentIndex
            }

            if (index == state.curComponentIndex) {
                state.curComponentIndex = null
                state.curComponent = null
            }
            // 匹配一个数字，等价于[0-9]
            if (/\d/.test(index)) {
                state.componentData.splice(index, 1)
            }
        },
        addImages(state, item) {
            state.imgToPDF = state.imgToPDF.concat(item)
        },
        showMask(state) {
            state.isMask = true
        },

        closeMask(state) {
            state.isMask = false
        },

        uploadIllustration(state, item) {
            state.imgUrl = item
        },
        editionIllusFun(state, item) {
            state.editionIllus = item
        },
        editionBookFun(state, item) {
            state.editionBook = item
        },
        addBooks(state, items) {
            state.books = items
        },
        addMyBooks(state, items) {
            state.myBooks = items
        },
        hasLogin(state) {
            state.isLogin = true
        }

    },
    actions: {},
    modules: {}
})