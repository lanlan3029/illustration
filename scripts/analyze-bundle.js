#!/usr/bin/env node
/**
 * Bundle 分析脚本
 * 使用 webpack-bundle-analyzer 分析打包结果
 * 
 * 使用方法：
 * npm run build:analyze
 * 
 * 分析结果会生成在 dist/bundle-report.html
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔍 开始分析 bundle...\n')

try {
    // 设置环境变量并执行构建
    process.env.ANALYZE = 'true'
    
    console.log('📦 正在构建项目（带分析）...')
    execSync('vue-cli-service build', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
    })
    
    console.log('\n✅ 分析完成！')
    console.log('📊 分析报告已生成：dist/bundle-report.html')
    console.log('💡 在浏览器中打开该文件查看详细的 bundle 分析结果')
    
} catch (error) {
    console.error('❌ 分析失败：', error.message)
    process.exit(1)
}

