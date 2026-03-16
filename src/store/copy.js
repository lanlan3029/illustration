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
                // 将菜单的屏幕坐标转换为相对于画布(editor)的坐标
                const editorEl = store.state.editor
                if (editorEl && editorEl.getBoundingClientRect) {
                    const rect = editorEl.getBoundingClientRect()
                    const top = state.menuTop - rect.top
                    const left = state.menuLeft - rect.left
                    data.style.top = top
                    data.style.left = left
                } else {
                    // 找不到 editor 时，退化为在原位置附近粘贴
                    data.style.top = (data.style.top || 0) + 10
                    data.style.left = (data.style.left || 0) + 10
                }
            } else {
                data.style.top = (data.style.top || 0) + 10
                data.style.left = (data.style.left || 0) + 10
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