import { getCenterPoint,calculateRotatedPointCoordinate } from "./translate"

const funcs = {
    lt:calculateLeftTop,
    t:calculateTop,
    rt:calculateRightTop,
    r:calculateRight,
    rb:calculateRightBottom,
    b:calculateBottom,
    lb:calculateLeftBottom,
    l:calculateLeft,
}

function calculateLeftTop(style,curPosition,pointInfo){
    // 拿取对称点的坐标
    const { symmetricPoint } = pointInfo
    // 从点击的原点到斜对角连接成线，中心点的（x，y）的距离到画布的边缘
    let newCenterPoint = getCenterPoint(curPosition,symmetricPoint)
    let newTopLeftPoint = calculateRotatedPointCoordinate(curPosition,newCenterPoint,-style.rotate)
    let newBottomRightPoint = calculateRotatedPointCoordinate(symmetricPoint,newCenterPoint,-style.rotate)
    let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
    let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

    if(newWidth > 0 && newHeight > 0){
        style.width = Math.round(newWidth)
        style.height = Math.round(newHeight)
        style.left = Math.round(newTopLeftPoint.x)
        style.top = Math.round(newTopLeftPoint.y)
    }
}

function calculateTop(style,curPosition,pointInfo){
    const { symmetricPoint, curPoint } = pointInfo
    // 由于用户拉伸时是以任意角度拉伸的，所以在求得旋转前的坐标时，只取 y 坐标（这里的 x 坐标可能是任意值），x 坐标用 curPoint 的。
    // 这个中心点（第二个参数）用 curPoint, center, symmetricPoint 都可以，只要他们在一条直线上就行
    const rotatedcurPositon = calculateRotatedPointCoordinate(curPosition, curPoint, -style.rotate)

    // 算出旋转前 y 坐标，再用 curPoint 的 x 坐标，重新计算它们旋转后对应的坐标
    const rotatedTopMiddlePoint = calculateRotatedPointCoordinate({
        x: curPoint.x,
        y: rotatedcurPositon.y,
    }, curPoint, style.rotate)
    
    // 用旋转后的坐标和对称点算出新的高度（勾股定理）
    const newHeight = Math.sqrt((rotatedTopMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedTopMiddlePoint.y - symmetricPoint.y) ** 2)
    
    const newCenter = {
        x: rotatedTopMiddlePoint.x - (rotatedTopMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedTopMiddlePoint.y + (symmetricPoint.y - rotatedTopMiddlePoint.y) / 2,
    }

    let width = style.width
    
    style.width = width
    style.height = Math.round(newHeight)
    style.top = Math.round(newCenter.y - (newHeight / 2))
    style.left = Math.round(newCenter.x - (style.width / 2))
}

function calculateRightTop(style,curPosition,pointInfo){
    const { symmetricPoint } = pointInfo
    let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
    let newTopRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -style.rotate)
    let newBottomLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -style.rotate)

    let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
    let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

    if (newWidth > 0 && newHeight > 0) {
        style.width = Math.round(newWidth)
        style.height = Math.round(newHeight)
        style.left = Math.round(newBottomLeftPoint.x)
        style.top = Math.round(newTopRightPoint.y)
    }
}

function calculateRight(style,curPosition,pointInfo){
    const { symmetricPoint, curPoint } = pointInfo
    const rotatedcurPositon = calculateRotatedPointCoordinate(curPosition, curPoint, -style.rotate)
    const rotatedRightMiddlePoint = calculateRotatedPointCoordinate({
        x: rotatedcurPositon.x,
        y: curPoint.y,
    }, curPoint, style.rotate)
  
    const newWidth = Math.sqrt((rotatedRightMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedRightMiddlePoint.y - symmetricPoint.y) ** 2)

    const newCenter = {
        x: rotatedRightMiddlePoint.x - (rotatedRightMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedRightMiddlePoint.y + (symmetricPoint.y - rotatedRightMiddlePoint.y) / 2,
    }

    let height = style.height
        
    style.height = height
    style.width = Math.round(newWidth)
    style.top = Math.round(newCenter.y - (style.height / 2))
    style.left = Math.round(newCenter.x - (newWidth / 2))
}

function calculateRightBottom(style,curPosition,pointInfo){
    const { symmetricPoint } = pointInfo
    let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
    let newTopLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -style.rotate)
    let newBottomRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -style.rotate)
  
    let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
    let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

    if (newWidth > 0 && newHeight > 0) {
        style.width = Math.round(newWidth)
        style.height = Math.round(newHeight)
        style.left = Math.round(newTopLeftPoint.x)
        style.top = Math.round(newTopLeftPoint.y)
    }
}

function calculateBottom(style,curPosition,pointInfo){
    const { symmetricPoint, curPoint } = pointInfo
    const rotatedcurPositon = calculateRotatedPointCoordinate(curPosition, curPoint, -style.rotate)
    const rotatedBottomMiddlePoint = calculateRotatedPointCoordinate({
        x: curPoint.x,
        y: rotatedcurPositon.y,
    }, curPoint, style.rotate)
  
    const newHeight = Math.sqrt((rotatedBottomMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedBottomMiddlePoint.y - symmetricPoint.y) ** 2)

    const newCenter = {
        x: rotatedBottomMiddlePoint.x - (rotatedBottomMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedBottomMiddlePoint.y + (symmetricPoint.y - rotatedBottomMiddlePoint.y) / 2,
    }

    let width = style.width
        
    style.width = width
    style.height = Math.round(newHeight)
    style.top = Math.round(newCenter.y - (newHeight / 2))
    style.left = Math.round(newCenter.x - (style.width / 2))
}

function calculateLeftBottom(style,curPosition,pointInfo){
    const { symmetricPoint } = pointInfo
    let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
    let newTopRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -style.rotate)
    let newBottomLeftPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -style.rotate)

    let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
    let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

    if (newWidth > 0 && newHeight > 0) {
        style.width = Math.round(newWidth)
        style.height = Math.round(newHeight)
        style.left = Math.round(newBottomLeftPoint.x)
        style.top = Math.round(newTopRightPoint.y)
    }
}

function calculateLeft(style,curPosition,pointInfo){
    const { symmetricPoint, curPoint } = pointInfo
    const rotatedcurPositon = calculateRotatedPointCoordinate(curPosition, curPoint, -style.rotate)
    const rotatedLeftMiddlePoint = calculateRotatedPointCoordinate({
        x: rotatedcurPositon.x,
        y: curPoint.y,
    }, curPoint, style.rotate)
  
    const newWidth = Math.sqrt((rotatedLeftMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedLeftMiddlePoint.y - symmetricPoint.y) ** 2)

    const newCenter = {
        x: rotatedLeftMiddlePoint.x - (rotatedLeftMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedLeftMiddlePoint.y + (symmetricPoint.y - rotatedLeftMiddlePoint.y) / 2,
    }
        
    let height = style.height
        
    style.height = height
    style.width = Math.round(newWidth)
    style.top = Math.round(newCenter.y - (style.height / 2))
    style.left = Math.round(newCenter.x - (newWidth / 2))
}

export default function calculateComponentPositionAndSize(name,style,curPosition,pointInfo){
    /**
     * name:八个角所代表的名字
     * style:组件的默认样式
     * curPosition:鼠标距离画布边缘的距离
     * proportion:长宽高比列 {x,y}
     * needLockProportion:是否处于可移动状态
     * pointInfo:{
     *      center:组件的中心点，
     *      curPoint:原点中心位置到画布边缘的距离，
     *      symmetricPoint:获取对称的原点坐标{x,y}
     * }
    */
    funcs[name](style,curPosition,pointInfo)
}