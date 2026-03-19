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

        // 让 webpack 正确处理 src/kuaitu-core/core 下的 .ts 文件
        config.module
          .rule('kuaitu-ts')
          .test(/\.ts$/)
          .include.add(path.resolve(__dirname, 'src/kuaitu-core/core')).end()
          .use('ts-loader')
          .loader('ts-loader')
          .options({
            // 使用项目的 tsconfig.json，只做转译，不做类型检查
            transpileOnly: true
          })

        // SVG 仍按资源处理（url/img），避免 svg 组件化链路导致编译/渲染不稳定
        
        // 配置 webpack-bundle-analyzer（仅在分析时使用）
        if (process.env.ANALYZE === 'true') {
            const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
            config.plugin('bundle-analyzer').use(BundleAnalyzerPlugin, [{
                analyzerMode: 'static',
                openAnalyzer: true,
                reportFilename: 'bundle-report.html'
            }])
        }
    },
    devServer: {
        // 配置 host：优先保证本机可正常启动（某些环境下读取网卡信息会报错）
        host: 'localhost',
        // 禁用 HMR 以避免 sockjs-node 连接错误
        hot: false,
        // 客户端配置（webpack-dev-server 4+ 使用 client.overlay 替代 overlay）
        client: {
            overlay: {
                warnings: false,
                errors: true
            }
        },
        // 禁用缓存，确保开发时总是获取最新代码
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
    },
    configureWebpack: {
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
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
                minSize: 20000, // 最小 chunk 大小（20KB）
                maxSize: 244000, // 最大 chunk 大小（244KB，符合推荐限制）
                cacheGroups: {
                    // 将 Element Plus 单独打包
                    elementPlus: {
                        name: 'chunk-elementPlus',
                        test: /[\\/]node_modules[\\/]element-plus[\\/]/,
                        priority: 30,
                        chunks: 'all',
                        enforce: true
                    },
                    // 将 Element Plus 图标单独打包
                    elementPlusIcons: {
                        name: 'chunk-elementPlusIcons',
                        test: /[\\/]node_modules[\\/]@element-plus[\\/]icons-vue[\\/]/,
                        priority: 25,
                        chunks: 'all',
                        enforce: true
                    },
                    // 将 Vue 相关库单独打包
                    vue: {
                        name: 'chunk-vue',
                        test: /[\\/]node_modules[\\/](vue|vue-router|vuex|pinia)[\\/]/,
                        priority: 20,
                        chunks: 'all',
                        enforce: true
                    },
                    // 将 Axios 等工具库单独打包
                    utils: {
                        name: 'chunk-utils',
                        test: /[\\/]node_modules[\\/](axios|@vueuse)[\\/]/,
                        priority: 15,
                        chunks: 'all',
                        enforce: true
                    },
                    // 将其他大型库单独打包（限制大小）
                    libs: {
                        name: 'chunk-libs',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 10,
                        chunks: 'all',
                        minChunks: 1,
                        maxSize: 244000, // 限制单个 chunk 大小
                        reuseExistingChunk: true
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

