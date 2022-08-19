const path = require('path');
const resolvePath = (p) => path.resolve(__dirname, p);
// HtmlWebpackPlugin帮助你创建html文件，并自动引入打包输出的bundles文件。支持html压缩。
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 该插件将CSS提取到单独的文件中。它会为每个chunk创造一个css文件。需配合loader一起使用
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 压缩css
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// 压缩js
const TerserPlugin = require('terser-webpack-plugin');
// 将已存在的单个文件或整个目录复制到打包目录
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
// 费时分析
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

const config = {
	// 入口文件
	entry: './src/index.js',

	// 开发模式打包     development/production
	mode: 'production',

	// 配置source map       开发:'cheap-module-source-map'  生产:'none'
	devtool: 'cheap-module-source-map',

	// 打包输出
	output: {
		// 输出文件目录（将来所有资源输出的公共目录，包括css和静态文件等等）
		path: resolvePath('../dist'),
		// 输出文件名，默认main.js
		filename: 'js/[name]_[contenthash:8].js',
		// 所有资源引入公共路径前缀，一般用于生产环境，小心使用
		publicPath: '',
		// 静态文件打包后的路径及文件名（默认是走全局的，如果有独立的设置就按照自己独立的设置来。）
		// assetModuleFilename: 'assets/[name]_[hash][ext]',

		// 非入口文件chunk的名称。所谓非入口即import动态导入形成的chunk或者optimization中的splitChunks提取的公共chunk
		// 它支持和 filename 一致的内置变量
		chunkFilename: '[name]_[contenthash:8].chunk.js',
		// 打包前清空输出目录，相当于clean-webpack-plugin插件的作用,webpack5新增。
		clean: true,
		// 当用 Webpack 去构建一个可以被其他模块导入使用的库时需要用到library   (自己写插件的时候用到)
		// library: {
		// 	// 整个库向外暴露的变量名
		// 	name: '[name]',
		// 	// 库暴露的方式
		// 	type: 'window',
		// },
	},

	// 模块解析配置
	resolve: {
		// 取别名
		alias: {
			'@': resolvePath('../src'),
			utils: resolvePath('../src/utils'),
			static: resolvePath('../src/static'),
			// ...
		},
	},

	// 模块匹配规则: 在这里为模块配置loader
	module: {
		rules: [
			{
				// 匹配所有的 css 文件
				test: /\.(css|less)$/i,
				use: [
					// 将 JS 字符串生成为 style 节点
					// 'style-loader',
					// MiniCssExtractPlugin.loader的作用就是把css-loader处理好的样式资源（js文件内），单独提取出来 成为css样式文件
					MiniCssExtractPlugin.loader, // 生产环境下使用，开发环境还是推荐使用style-loader
					'cache-loader', // 获取前面 loader 转换的结果
					// 将 CSS 转化成 CommonJS 模块
					'css-loader',
					// 使用 PostCSS 处理 CSS 的 loader, 里面可以配置 autoprefixer 添加 CSS 浏览器前缀
					'postcss-loader',
					// 将 Less 编译成 CSS
					'less-loader',
				],
			},
			{
				// 匹配字体文件
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
				// 发送一个单独的文件并导出 URL。之前通过使用 file-loader 实现。
				type: 'asset/resource',
				generator: {
					// 输出文件位置以及文件名
					filename: 'fonts/[name]_[hash:8][ext]',
				},
				// parser: {
				// 	dataUrlCondition: {
				// 		maxSize: 10 * 1024, // 超过10kb不转 base64
				// 	},
				// },
			},
			{
				// 匹配图片文件
				test: /\.(png|jpg|jpeg|gif|svg)$/i,
				// 在导出一个 data URI 和发送一个单独的文件之间自动选择。之前通过使用 url-loader，并且配置资源体积限制实现。
				type: 'asset',
				generator: {
					// 输出文件位置以及文件名
					filename: 'images/[name]_[hash:8][ext]',
					// 打包之后图片的访问公共前缀
					// publicPath: '../',
				},
				parser: {
					dataUrlCondition: {
						maxSize: 10 * 1024, // 超过10kb不转 base64
					},
				},
			},
			{
				// 匹配js文件
				test: /\.m?js$/,
				// 包含哪些目录
				include: resolvePath('../src'),
				// 不包含哪些目录   exclude逼include优先级高
				exclude: /(node_modules)/,
				use: [
					{
						loader: 'thread-loader', // 开启多进程打包
						options: {
							// 产生的 worker 的数量，默认是 (cpu 核心数 - 1)，或者，
							// 在 require('os').cpus() 是 undefined 时回退至 1
							workers: 3,
						},
					},
					{
						loader: 'babel-loader',
						options: {
							// 将 babel-loader 提速至少两倍。这会将转译的结果缓存到文件系统中,第一次构建慢,缓存后构建快
							cacheDirectory: true,
						},
					},
				],
			},
		],
	},

	// 开发服务器
	devServer: {
		// 运行代码的目录   老版写法: 		contentBase: resolvePath('dist'),
		static: {
			directory: resolvePath('dist'),
		},
		// 为每个静态文件开启gzip压缩
		compress: true,
		host: 'localhost', // 域名
		port: 9000, // 端口号
		// open: true, // 自动打开浏览器
		hot: true, //开启HMR功能
		// 设置代理
		proxy: {
			// 一旦devServer(9000端口)接收到/api/xxx的请求，就会用devServer起的服务把请求转发到另外一个服务器（3000）
			// 以此来解决开发中的跨域问题
			api: {
				target: 'htttp://localhost:3000',
				// 发送请求时，请求路径重写：将/api/xxx  --> /xxx （去掉/api）
				pathRewrite: {
					'^api': '',
				},
			},
		},
	},

	// 插件
	plugins: [
		// 把打包后的资源文件，例如：js 或者 css 文件可以自动引入到 Html 中
		new HtmlWebpackPlugin({
			// 模板html地址
			template: resolvePath('../src/index.html'),
			// 输出后的html文件名
			filename: 'index.html',
		}),
		// 该插件将CSS提取到单独的文件中。它会为每个chunk创造一个css文件。需配合loader一起使用
		new MiniCssExtractPlugin({
			filename: 'css/[name]_[contenthash:8].css',
			// chunkFilename: 'css/[name]_[contenthash:8].css',
		}),
		// 拷贝文件或者目录
		new CopyWebpackPlugin({
			patterns: [
				// from: 从哪里  to: 到哪里
				{ from: 'src/static', to: 'static' },
			],
		}),
		// 定义全局变量
		new webpack.DefinePlugin({
			PRODUCTION: JSON.stringify(true), // true
			VERSION: JSON.stringify('5fa3b9'), // '5fa3b9'
			BROWSER_SUPPORTS_HTML5: true, // true
			TWO: '1+1', // 2
			'typeof window': JSON.stringify('object'), // `object`
			// 用来区分环境
			// 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
		}),
	],

	// 优化
	optimization: {
		minimizer: [
			// 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
			// `...`,
			// 自定义配置压缩js的规则,不使用webpack5自带的压缩js规则
			// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
			new TerserPlugin({
				terserOptions: {
					// parallel: true, // 启用/禁用多进程并发运行功能
					// cache: true,
					compress: {
						warnings: true, // 是否去除warnig
						// drop_console: process.env.BUILD_ENV === 'prod', // 是否去除console
					},
					// output: {
					// 	comments: false,
					// 	// comments: /Build in/i
					// },
					safari10: true,
				},
				extractComments: false, // 启用/禁用剥离注释功能
			}),
			// 启动css压缩  一般在生产模式配置,开发环境不配置,可以通过环境来配置是否压缩css
			new CssMinimizerPlugin(),
		],
		// 如果还想在开发环境下启用 CSS 优化，请将 optimization.minimize 设置为 true:
		// minimize: true,
	},
};

module.exports = smp.wrap(config);
