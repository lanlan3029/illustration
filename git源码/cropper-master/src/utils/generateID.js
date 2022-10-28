let id = 0
// 主要用于 vue 的 diff 算法，为每一个元素创建一个独一无二的id
export default function generateID(){
    return id++
}