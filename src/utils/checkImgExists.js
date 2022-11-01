export default function checkImgExists(imgurl){
    var ImgObj = new Image() // 判断图片是否存在
    ImgObj.src = imgurl
    return new Promise((res)=>{
        // 存在图片
        ImgObj.onload = function(){
            if(ImgObj.filesSize > 0 || (ImgObj.width > 0 && ImgObj.height > 0)){
                res(true)
            }else{
                res(false)
            }
        }
        ImgObj.onerror = function(){
            res(false)
        }
    })
}