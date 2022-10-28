// import store from "./index"
import toast from "@/utils/toast"
import generateID from "@/utils/generateID"
import { deepCopy } from '@/utils/utils'
import store from "./index"

export default {
    state: {
        copyData: null, // 复制粘贴剪切
        isCut: false
    },
    mutations: {
        copy(state) {
            if (!state.curComponent) {
                toast("请选择组件", "error")
                return
            } else {
                toast("已添加到剪切板", "success")
                copyData(state)

                state.isCut = false
            }
        },
        paste(state, isMouse) {
            if (!state.copyData) {
                toast("请选择组件", "error")
                return
            }
            const data = state.copyData.data

            if (isMouse) {
                data.style.top = state.menuTop
                data.style.left = state.menuLeft
            } else {
                data.style.top += 10
                data.style.left += 10
            }

            data.id = generateID()

            store.commit("addComponent", { component: deepCopy(data) })
            if (state.isCut) {
                state.copyData = null
            }
        },
        cut(state) {
            if (!state.curComponent) {
                toast("请选择组件", "error")
                return
            }

            copyData(state)

            store.commit('deleteComponent')
            state.isCut = true
        }
    }
}

function copyData(state) {
    state.copyData = {
        data: deepCopy(state.curComponent),
        index: state.curComponentIndex
    }
}