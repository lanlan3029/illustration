module.exports = {
    devServer: {
        // 配置 host，允许所有接口访问
        host: '0.0.0.0',
        // 禁用 HMR 以避免 sockjs-node 连接错误
        hot: false,
        // 禁用客户端覆盖（可选）
        overlay: {
            warnings: false,
            errors: true
        }
    }
}

