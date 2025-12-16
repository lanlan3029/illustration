const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        // 配置 host，允许所有接口访问
        host: '0.0.0.0',
        // 禁用 HMR 以避免 sockjs-node 连接错误
        hot: false,
        // 客户端配置（webpack-dev-server 4+ 使用 client.overlay 替代 overlay）
        client: {
            overlay: {
                warnings: false,
                errors: true
            }
        }
    },
    configureWebpack: {
        resolve: {
            fallback: {
                "process": false,
                "buffer": false,
                "util": false
            },
            alias: {
                'animate.css': path.resolve(__dirname, 'node_modules/animate.css')
            }
        }
    }
})

