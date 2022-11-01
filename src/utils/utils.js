
// 深入拷贝
export function deepCopy(target){
    if (typeof target == "object"){
        // 判断target是否是数组
        const result = Array.isArray(target) ? [] : {}
        for(const key in target){
            if(typeof target[key] == "object"){
                result[key] = deepCopy(target[key])
            }else{
                result[key] = target[key]
            }
        }
        return result
    }
    return target
}

export function $(selector){
    return document.querySelector(selector)
}