import store from "../store";

export function changeStyleWithScale(value) {
    // 1200 * 100 / 100
    // 740 * 100 / 100
    return value * parseInt(store.state.canvasStyleData.scale) / 100
}
// 判断该角度是负值还是正值
// 如果deg是正的话，那么结果就是deg
// 如果结果是负的话，那么结果是deg+360
export function mod360(deg){
    return (deg + 360) % 360
}

// 角度转弧度
// Math.PI = 180 度
function angleToRadian(angle){
    return angle * Math.PI / 180
}

// 求鼠标到斜对面对称点之间的中点坐标到画布边缘的距离
export function getCenterPoint(p1,p2){
    return {
        x:p1.x + ((p2.x - p1.x) / 2),
        y:p1.y + ((p2.y - p1.y) / 2),
    }
}

/**
 * 计算根据圆心旋转后的点的坐标
 * @param {Obejct} point 旋转后的点坐标
 * @param {Object} center 旋转中心
 * @param {Number} rotate 旋转的角度
 * @return {Object}       旋转后的坐标
 * https://www.zhihu.com/question/67425734/answer/252724399 旋转矩阵公式  
*/
export function calculateRotatedPointCoordinate(point,center,rotate){
    /**
     * 旋转公式
     * 点a（x，y）
     * 旋转中心c（x，y）
     * 旋转后点n（x，y）
     * 旋转角度deg
     * nx = cosdeg * (a.x - c.x) - sindeg * (a.y - c.y) + c.x
     * ny = sindeg * (a.x - c.x) - cosdeg * (a.y - c.y) + c.y
    */
    /**
     * point:鼠标到画布的距离
     * center:圆心的坐标
    */
    return {
        x:(point.x - center.x) * Math.cos(angleToRadian(rotate)) - (point.y - center.y) * Math.sin(angleToRadian(rotate)) + center.x,
        y:(point.x - center.x) * Math.sin(angleToRadian(rotate)) + (point.y - center.y) * Math.cos(angleToRadian(rotate)) + center.y,
    }
}
