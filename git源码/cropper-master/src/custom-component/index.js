import Vue from "vue"

const components = [
    'Picture',
    'VText'
]

components.forEach(key => {
    Vue.component(key,() => import(`@/custom-component/${key}`))
})