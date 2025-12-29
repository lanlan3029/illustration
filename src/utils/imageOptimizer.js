/**
 * 图片优化工具
 * 支持 WebP 格式检测和自动回退
 */

/**
 * 检测浏览器是否支持 WebP 格式
 * @returns {Promise<boolean>}
 */
export function checkWebPSupport() {
    return new Promise((resolve) => {
        const webP = new Image()
        webP.onload = webP.onerror = () => {
            resolve(webP.height === 2)
        }
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
}

/**
 * 获取优化的图片路径（支持 WebP 回退）
 * @param {string} imagePath - 原始图片路径（require 返回的路径）
 * @param {string} webpPath - WebP 版本路径（可选）
 * @returns {Promise<string>}
 */
export async function getOptimizedImagePath(imagePath, webpPath = null) {
    // 如果提供了 WebP 路径且浏览器支持，优先使用 WebP
    if (webpPath) {
        const supportsWebP = await checkWebPSupport()
        if (supportsWebP) {
            return webpPath
        }
    }
    // 否则使用原始路径
    return imagePath
}

/**
 * 批量获取优化的图片路径
 * @param {Array<{image: string, webp?: string}>} images - 图片配置数组
 * @returns {Promise<Array<string>>}
 */
export async function getOptimizedImagePaths(images) {
    const supportsWebP = await checkWebPSupport()
    return images.map(img => {
        if (supportsWebP && img.webp) {
            return img.webp
        }
        return img.image
    })
}

