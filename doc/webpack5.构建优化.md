# 优化构建速度

如何优化构建速度,首先你要知道哪些文件构建比较耗时,这个就要借助`speed-measure-webpack-plugin`插件来实现了

## 1. 费时分析

1. 安装 [`speed-measure-webpack-plugin`](https://www.npmjs.com/package/speed-measure-webpack-plugin)，

```js
yarn add -D speed-measure-webpack-plugin
```

2. 修改配置

```js
...
// 费时分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
    // ....
})
```

3. 执行打包

发现 `mini-css-extract-plugin` 插件报错

!["error"](https://cdn.nlark.com/yuque/0/2022/jpeg/566044/1660877663422-34420d1f-4a3b-4954-b891-6503cd049776.jpeg)

解决方案

-   不用 mini-css-extract-plugin,使用 style-loader
-   我们对`mini-css-extract-plugin`进行降级处理

不用 mini-css-extract-plugin,使用 style-loader,打包 OK

![使用style-loader打包](https://cdn.nlark.com/yuque/0/2022/png/566044/1660878336608-30187586-aded-4d42-97a8-0b1ca85ec7a1.png)

我们对`mini-css-extract-plugin`进行降级处理: `^2.6.1` -> `^1.3.6`

```js
yarn add -D mini-css-extract-plugin@^1.3.6
```

然后重新打包,还是报错,报错信息如下,所要配置 publicPath
![error2](https://cdn.nlark.com/yuque/0/2022/png/566044/1660878162653-f52a2f9c-a061-4b10-809b-4b787bed7a8c.png)

根据报错提示信息，我们给配置加上 publicPath

```js
const path = require('path');
const resolvePath = (p) => path.resolve(__dirname, p);
module.exports = {
	output: {
		// 输出文件目录（将来所有资源输出的公共目录，包括css和静态文件等等）
		path: resolvePath('../dist'),
		// 输出文件名，默认main.js
		filename: 'js/[name]_[contenthash:8].js',
		// 所有资源引入公共路径前缀，一般用于生产环境，小心使用
		publicPath: '',
		// 非入口文件chunk的名称。所谓非入口即import动态导入形成的chunk或者optimization中的splitChunks提取的公共chunk
		// 它支持和 filename 一致的内置变量
		chunkFilename: '[name]_[contenthash:8].chunk.js',
		// 打包前清空输出目录，相当于clean-webpack-plugin插件的作用,webpack5新增。
		clean: true,
	},
};
```

重新打包,就好了

综上所的:

-   我们使用 `speed-measure-webpack-plugin`, 有些 Loader 或者 Plugin 新版本会不兼容，需要进行降级处理
-   在 webpack5 中为了使用费时分析去对插件进行降级或者修改配置写法是非常不划算的，这里只是为了分析耗时怎么去优化构建速度用的,在平时开发不推荐使用

## 2. 优化 resolve 配置

resolve: 设置模块如何被解析,webpack 内部提供了合理的默认值,但是我们根据项目的需要,还是会优化这些解析的配置项,提高 webpack 查找模块的速度

webpack 如何[模块解析](https://webpack.docschina.org/concepts/module-resolution)的,这一章节我们不讨论这个,下次可以单独出一章节

### 1 alias (别名) [官方文档](https://webpack.docschina.org/configuration/resolve/#resolvealias)

配置别名可以加快 webpack 查找模块的速度

创建 `import` 或 `require` 的别名，来确保模块引入变得更简单。例如，一些位于 src/ 文件夹下的常用模块：

`webpack.config.js`

```js
const path = require('path');

module.exports = {
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '../src'),
			utils: path.resolve(__dirname, '../src/utils'),
			static: path.resolve(__dirname, '../src/static'),
			// ...
		},
	},
};
```

配置完成之后，我们在项目中就可以

```js
// src/index.js

// 以前的用法
// import { sum } from '../utils/common.js';
// 使用 src 别名 @
import '@/utils/common.js';
// 使用 utils 别名
import { sum } from 'utils/common.js';
```

### 2 extensions (自动添加后缀名) [官方文档](https://webpack.docschina.org/configuration/resolve/#resolveextensions)

指定 extension 之后可以不用在 require 或是 import 的时候加文件扩展名,会依次尝试添加扩展名进行匹配

webpack 默认配置

```js
module.exports = {
	resolve: {
		extensions: ['.js', '.json', '.wasm'],
	},
};
```

自己配置

```js
module.exports = {
	resolve: {
		// 如果想保留默认配置，可以用 ... 扩展运算符代表默认配置
		// extensions: ['...', '.css', '.less'],
		extensions: ['.js', '.json', '.css', '.less'],
	},
};
```

需要注意的是：

-   高频文件后缀名放前面；
-   手动配置后，默认配置会被覆盖

配置完成之后，我们在项目中引入模块时不带扩展名,那么 webpack 就会按照 extensions 配置的数组从左到右的顺序去尝试解析模块

```js
// src/index.js

// 以前的用法
// import 'utils/common.js';
// 现在不用加后缀名了,他会自动在文件后面加extensions配置的后缀名去找文件
import 'utils/common';
```

### 3. modules [文档地址](https://webpack.docschina.org/configuration/resolve/#resolvemodules)

-   对于直接声明依赖名的模块（如 react ），webpack 会类似 Node.js 一样进行路径搜索，搜索 node_modules 目录
-   这个目录就是使用 resolve.modules 字段进行配置的 默认配置

```js
module.exports = {
	resolve: {
		modules: ['node_modules'],
	},
};
```

如果可以确定项目内所有的第三方依赖模块都是在项目根目录下的 node_modules 中的话

```js
module.exports = {
	resolve: {
		modules: [path.resolve(__dirname, 'node_modules')],
	},
};
```

如果你想要添加一个目录到模块搜索目录，此目录优先于 node_modules/ 搜索：

```js
module.exports = {
	resolve: {
		modules: [path.resolve(__dirname, 'src'), 'node_modules'],
	},
};
```

### 4. resolveLoader [文档地址](https://webpack.docschina.org/configuration/resolve/#resolveloader)

这组选项配置对象与上面的 `resolve` 对象的属性集合相同， 但仅用于解析 webpack 的 loader 包

一般情况下保持默认配置就可以了，但如果你有自定义的 Loader 就需要配置一下，不配可能会因为找不到 loader 报错

例如：我们在 loader 文件夹下面，放着我们自己写的 loader

-   那就要配置先找 node_modules 下面的 loader,找不到再找我们自己配置的 loader 目录找

`webpack.config.js`

```js
const path = require('path');

// 路径处理方法
function resolvePath = dir => path.resolve(__dirname, dir)

module.exports = {
	resolveLoader: {
		// 先找node_modules下面的loader,找不到再找我们自己配置的loader目录下面找
		modules: ['node_modules', resolvePath('loader')],
	},
};
```

## 3. noParse 不要解析的模块 [文档地址](https://webpack.docschina.org/configuration/module/#modulenoparse)

-   module.noParse 字段，可以用于配置哪些模块文件的内容不需要进行解析
-   不需要解析依赖（即无依赖） 的第三方大型类库等，可以通过这个字段来配置，以提高整体的构建速度
-   使用 noParse 进行忽略的模块文件中不应该含有 import, require, define 的调用，或任何其他导入机制

```js
module.exports = {
	// ...
	module: {
		noParse: /jquery|lodash/, // 正则表达式
		// // 或者使用函数
		// noParse(content) {
		// 	return /jquery|lodash/.test(content);
		// },
	},
};
```

## 4. IgnorePlugin 忽略模块 [文档地址](https://webpack.docschina.org/plugins/ignore-plugin)

IgnorePlugin 用于忽略某些特定的模块，让 webpack 不把这些指定的模块打包进去

防止在 import 或 require 调用时，生成以下正则表达式匹配的模块：

-   requestRegExp 匹配(test)资源请求路径的正则表达式。
-   contextRegExp 匹配(test)资源上下文（目录）的正则表达式。

例如: 我们只要 moment 插件中文版的进行打包,其他语言的排除掉不要打包.这样就可以大大节省打包的体积了

```js
const webpack = requrie('webpack');
module.exports = {
	// 配置插件
	plugins: [
		new webpack.IgnorePlugin({
			resourceRegExp: /^\.\/locale$/,
			contextRegExp: /moment$/,
		}),
	],
};
```

## 5. externals 扩展依赖 [文档地址](https://webpack.docschina.org/configuration/externals#root)

-   `externals` 配置选项提供了`「从输出的 bundle 中排除依赖」`的方法。
-   此功能通常对 library 开发人员来说是最有用的，然而也会有各种各样的应用程序用到它。

防止将某些 import 的包(package)打包到 bundle 中，而是在运行时(runtime)再去从外部获取这些扩展依赖(external dependencies)。

例如，从 `CDN` 引入 jQuery，而不是把它打包：

```js
// src/index.html
<script
	src="https://code.jquery.com/jquery-3.1.0.js"
	integrity="sha256-slogkvB1K3VOkzAI8QITxV3VzpOnkeNVsKvtkYLMjfk="
	crossorigin="anonymous"
></script>
```

```js
// webpack.config.js
module.exports = {
	externals: {
		// 属性名称是 jquery，表示应该排除 import $ from 'jquery' 中的 jquery 模块。为了替换这个模块，jQuery 的值将被用来检索一个全局的 jQuery 变量。换句话说，当设置为一个字符串时，它将被视为全局的（定义在上面和下面）。
		jquery: 'jQuery',
	},
};
```

这样就剥离了那些不需要改动的依赖模块，大大节省打包构建的时间. 换句话，下面展示的代码还可以正常运行：

```js
import $ from 'jquery';

$('.my-element').animate(/* ... */);
```

具有外部依赖(external dependency)的 bundle 可以在各种模块上下文(module context)中使用，例如 `CommonJS, AMD, 全局变量和 ES2015 模块`。外部 library 可能是以下任何一种形式

-   root：可以通过一个全局变量访问 library（例如，通过 script 标签）。
-   commonjs：可以将 library 作为一个 CommonJS 模块访问。
-   commonjs2：和上面的类似，但导出的是 module.exports.default.
-   amd：类似于 commonjs，但使用 AMD 模块系统。

请查看上面的例子。属性名称是 `jquery`，表示应该排除 `import $ from 'jquery'` 中的 `jquery` 模块。为了替换这个模块，`jQuery` 的值将被用来检索一个全局的 `jQuery` 变量。换句话说，当设置为一个字符串时，它将被视为全局的（定义在上面和下面）。

另一方面，如果你想将一个符合 CommonJS 模块化规则的类库外部化，你可以提供外联类库的类型以及类库的名称。

如果你想将 fs-extra 从输出的 bundle 中剔除并在运行时中引入它，你可以如下定义

```js
module.exports = {
	externals: {
		'fs-extra': 'commonjs2 fs-extra',
	},
};
```

这样的做法会让任何依赖的模块都不变，正如以下所示的代码：

```js
import fs from 'fs-extra';
```

会将代码编译成:

```js
const fs = require('fs-extra');
```

## 6. 缩小查找范围

在配置 loader 的时候，我们需要更精确的去指定 loader 的作用目录或者需要排除的目录，通过使用 `include` 和 `exclude` 两个配置项，可以实现这个功能，常见的例如：

-   `include`: 符合条件的模块进行解析
-   `exclude`: 排除符合条件的模块，不解析
-   `exclude`: 优先级更高

例如: babel-loader 的配置

```js
const path = require('path');
const resolvePath = (p) => path.resolve(__dirname, p);
const config = {
	module: {
		rules: [
			{
				// 匹配js文件
				test: /\.m?js$/,
				// 包含哪些目录
				include: resolvePath('src'),
				// 不包含哪些目录   exclude逼include优先级高
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						// 将 babel-loader 提速至少两倍。这会将转译的结果缓存到文件系统中
						// cacheDirectory: true,
					},
				},
			},
		],
	},
};
```

## 7. 利用缓存

-   webpack 中利用缓存一般有以下几种思路：
    -   babel-loader 开启缓存
    -   使用 cache-loader
    -   使用 hard-source-webpack-plugin
    -   dll webpack5 不建议使用了
    -   cache 持久化缓存

### 1. babel-loader 开启缓存

-   Babel 在转义 js 文件过程中消耗性能较高，将 babel-loader 执行的结果缓存起来，当重新打包构建时会尝试读取缓存，从而提高打包构建速度、降低消耗
-   缓存位置： node_modules/.cache/babel-loader

```js
const path = require('path');
const resolvePath = (p) => path.resolve(__dirname, p);
module.exports = {
	// 模块解析
	module: {
		// 匹配模块规则
		rules: [
			{
				// 匹配js文件
				test: /\.m?js$/,
				// 包含哪些目录
				include: resolvePath('src'),
				// 不包含哪些目录   exclude逼include优先级高
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						// 将 babel-loader 提速至少两倍。这会将转译的结果缓存到文件系统中,第一次构建慢,缓存后构建快
						cacheDirectory: true,
					},
				},
			},
		],
	},
};
```

上面缓存只会缓存 bable-loader,其他的 loader 使用[cache-loader](https://www.npmjs.com/package/cache-loader)来做

### 2. cache-loader

-   在一些性能开销较大的 loader 之前添加此 loader,以将结果缓存到磁盘里
-   存和读取这些缓存文件会有一些时间开销,所以请只对性能开销较大的 loader 使用此 loader

```js
yarn add -D  cache-loader
```

未使用 cache-loader 的重新构建耗时如下图:

![未使用cache-loader](https://cdn.nlark.com/yuque/0/2022/png/566044/1660901319644-fe170a03-a3dd-40f6-b603-8f72f4934c54.png)

为 css,less 模块添加 cache-loader 模块缓存打包结果

```js
module.exports = {
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
		],
	},
};
```

使用 cache-loader 的重新构建耗时如下图:
![使用cache-loader](https://cdn.nlark.com/yuque/0/2022/png/566044/1660901351613-c1dce132-f882-4976-97fa-1b13e18fb504.png)

明显可以看出使用了 cache-loader 的重新构建耗时速度快了好多

### 3. hard-source-webpack-plugin

[hard-source-webpack-plugin](https://github.com/mzgoddard/hard-source-webpack-plugin) 为模块提供了中间缓存，重复构建时间大约可以减少 80%，但是在 webpack5 中已经内置了模块缓存，不需要再使用此插件

### 4. dll ❌

在 webpack5.x 中已经不建议使用这种方式进行模块缓存，因为其已经内置了更好体验的 cache 方法

### 5. cache 持久化缓存

通过配置 cache 缓存生成的 webpack 模块和 chunk，来改善构建速度

```js
module.exports = {
	cache: {
		type: 'filesystem',
	},
};
```

## 8. 多进程处理

### 1 thread-loader

-   把 [thread-loader](https://webpack.docschina.org/loaders/thread-loader/#root) 放置在其他 loader 之前， 放置在这个 loader 之后的 loader 就会在一个单独的 worker 池(worker pool)中运行

```js
yarn add -D thread-loader
```

在 worker 池中运行的 loader 是受到限制的。例如：

-   这些 loader 不能生成新的文件。
-   这些 loader 不能使用自定义的 loader API（也就是说，不能通过插件来自定义）。
-   这些 loader 无法获取 webpack 的配置。

每个 worker 都是一个独立的 node.js 进程，其开销大约为 600ms 左右。同时会限制跨进程的数据交换。

`请仅在耗时的操作中使用此 loader！,如果不耗时的操作使用这个loader,反而导致构建速度慢`

```js
module.exports = {
	module: {
		rules: [
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
							// cacheDirectory: true,
						},
					},
				],
			},
		],
	},
};
```

`thread-loader的其他配置信息`

```js
use: [
	{
		loader: 'thread-loader',
		// 有同样配置的 loader 会共享一个 worker 池
		options: {
			// 产生的 worker 的数量，默认是 (cpu 核心数 - 1)，或者，
			// 在 require('os').cpus() 是 undefined 时回退至 1
			workers: 2,

			// 一个 worker 进程中并行执行工作的数量
			// 默认为 20
			workerParallelJobs: 50,

			// 额外的 node.js 参数
			workerNodeArgs: ['--max-old-space-size=1024'],

			// 允许重新生成一个僵死的 work 池
			// 这个过程会降低整体编译速度
			// 并且开发环境应该设置为 false
			poolRespawn: false,

			// 闲置时定时删除 worker 进程
			// 默认为 500（ms）
			// 可以设置为无穷大，这样在监视模式(--watch)下可以保持 worker 持续存在
			poolTimeout: 2000,

			// 池分配给 worker 的工作数量
			// 默认为 200
			// 降低这个数值会降低总体的效率，但是会提升工作分布更均一
			poolParallelJobs: 50,

			// 池的名称
			// 可以修改名称来创建其余选项都一样的池
			name: 'my-pool',
		},
	},
	// 耗时的 loader（例如 babel-loader）
];
```

### 2. happypack ❌

同样为开启多进程打包的工具，webpack5 已弃用。

### 3. parallel

[`terser-webpack-plugin`](https://webpack.docschina.org/plugins/terser-webpack-plugin/#root) 开启 parallel 参数

-   使用多进程并发运行以提高构建速度

```js
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
	optimization: {
		minimizer: [
			new TerserPlugin({
				// 使用多进程并发运行以提高构建速度
				parallel: true,
			}),
		],
	},
};
```

## 9. oneOf

-   [规则](https://webpack.docschina.org/configuration/module/#rule) 数组，当规则匹配时，只使用第一个匹配规则
-   每个文件对于 rules 中的所有规则都会遍历一遍，这样会影响构建性能
-   如果使用 [oneOf](https://webpack.docschina.org/configuration/module/#ruleoneof) 就可以解决该问题，只要能匹配一个即可退出。类似 for 循环里面的 break (注意：在 oneOf 中不能两个配置处理同一种类型文件)

```js
module.exports = {
	module: {
		rules: [
			// js有多个配置处理,所以要单独提出来1个,不然放在oneOf当中,只会走1个
			{
				test: /\.js$/,
				enforce: 'pre',
				loader: 'eslint-loader',
			},
			{
				// 文件只要匹配到oneOf里面的1个规则就不走其他规则了
				oneOf: [
					{
						test: /\.css$/,
						use: ['style-loader', 'css-loader'],
					},
					{
						test: /\.html$/,
						loader: 'html-loader',
					},
					{
						test: /\.js$/,
						loader: 'babel-loader',
					},
				],
			},
		],
	},
};
```
