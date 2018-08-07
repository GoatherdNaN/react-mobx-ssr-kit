const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin'); //html
const HappyPack = require('happypack'); //多线程运行
const os = require('os');

var happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

module.exports = {
  entry: './src/index.js',
  resolve: {
    mainFields: ['jsnext:main', 'browser', 'main'], //npm读取先后方式  jsnext:main 是采用es6模块写法
    extensions: [".js", ".json", ".less"],
    alias: {
      //快捷入口
      assets: path.resolve('src/assets'),
      moment$: path.resolve('node_modules/moment/moment.js'),// 为了解决moment.js一个祖传的操蛋警告
    },
  },
  module: {
    // noParse: /node_modules\/(moment\.js)/, //不解析
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/, //排除
        include: [path.resolve('src')], //包括
        loader: 'happypack/loader?id=babel&&cacheDirectory=true',
      },
      {
        test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif)(\?.*)?$/i,
        exclude: /(node_modules|bower_components)/,
        include: [path.resolve('src')],
        use: [
          {
            loader: 'url-loader', //limit 图片大小的衡量，进行base64处理
            options: {
              limit: 1 * 1024,
              outputPath: "images"
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DllReferencePlugin({
      context: path.resolve(__dirname, '../'), // 指定一个路径作为上下文环境，需要与DllPlugin的context参数保持一致，建议统一设置为项目根目录
      manifest: require('../dist/dll/manifest.json'), // 指定manifest.json
      name: 'vendor_library',  // 当前Dll的所有内容都会存放在这个参数指定变量名的一个全局变量下，注意与DllPlugin的name参数保持一致
    }),
    new HtmlWebpackPlugin({
        title: 'my admin',
        inject: 'body',
        filename: 'index.html',
        template: path.resolve('./index.html'), //源html
        favicon: path.resolve('favicon.ico'),
        minify: {
          collapseWhitespace: true,
        }
    }),
    new HappyPack({
      //多线程运行 默认是电脑核数-1
      id: 'babel', //对于loaders id
      loaders: ['cache-loader', 'babel-loader?cacheDirectory'], //是用babel-loader解析
      threadPool: happyThreadPool,
      verboseWhenProfiling: true, //显示信息
    }),
  ],
};
