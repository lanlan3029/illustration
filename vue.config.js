const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
    transpileDependencies: true,
    // CSS 提取配置
    css: {
        extract: process.env.NODE_ENV === 'production' ? {
            // 启用 CSS 代码分割
            ignoreOrder: true,
            // 将 CSS 提取到单独的文件
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].css'
        } : false
    },
    // 链式配置 webpack
    chainWebpack: config => {
        // 优化 CSS 提取
        if (process.env.NODE_ENV === 'production') {
            // 配置 CSS 文件名
            config.plugin('extract-css').tap(args => {
                args[0].filename = 'css/[name].[contenthash:8].css'
                args[0].chunkFilename = 'css/[name].[contenthash:8].css'
                return args
            })
        }
    },
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
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // 将 Element Plus 单独打包
                    elementPlus: {
                        name: 'chunk-elementPlus',
                        test: /[\\/]node_modules[\\/]element-plus[\\/]/,
                        priority: 20,
                        chunks: 'all'
                    },
                    // 将 Element Plus 图标单独打包
                    elementPlusIcons: {
                        name: 'chunk-elementPlusIcons',
                        test: /[\\/]node_modules[\\/]@element-plus[\\/]icons-vue[\\/]/,
                        priority: 20,
                        chunks: 'all'
                    },
                    // 将其他大型库单独打包
                    libs: {
                        name: 'chunk-libs',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 10,
                        chunks: 'all',
                        minChunks: 1
                    },
                    // 公共代码
                    common: {
                        name: 'chunk-common',
                        minChunks: 2,
                        priority: 5,
                        chunks: 'all',
                        reuseExistingChunk: true
                    }
                }
            }
        }
    }
})

