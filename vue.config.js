module.exports = {
    publicPath: './', // 公共路径(必须有的)
    outputDir: "dist", // 输出文件目录
    assetsDir: "static", //静态资源文件名称
    lintOnSave: false,
    productionSourceMap: false, //去除打包后js的map文件
    devServer: { //启动项目在8080端口自动打开
        open: true,
        port: 8080,
        proxy: null,


    }
}