import './index.css'; // css-loader
import './index.less'; // less-loader

// 图片
import logo from './assets/images/logo.jpg';
// import { sum } from './utils/common.js';
import { sum } from 'utils/common.js';
const count = sum(1, 2);
console.log('sum函数', count);

const img = new Image();
img.src = logo;
document.getElementById('imgBox').appendChild(img);

// babel-loader 的预设preset-env
class Person {
	name = 'zhangshan';
	age = 18;

	info = () => {
		return {
			name: this.name,
			age: this.age,
		};
	};
}

// babel-loader 的插件
// 装时器的问题 https://www.cnblogs.com/Annely/p/14613567.html
@log('打印log')
class MyClass {
	// 直接声明实例化成员
	a = 1;
}

function log(text) {
	return function (target) {
		target.prototype.logger = () => `${text}，${target.name}`;
	};
}

const test = new MyClass();
console.log(test, 2222, test.logger());

// DefinePlugin 的使用
// PRODUCTION: JSON.stringify(true),
// VERSION: JSON.stringify('5fa3b9'),
// BROWSER_SUPPORTS_HTML5: true,
// TWO: '1+1',
// 'typeof window': JSON.stringify('object'),
console.log('-- DefinePlugin的使用 --');
console.log('PRODUCTION: JSON.stringify(true):', typeof PRODUCTION, PRODUCTION);
console.log(`VERSION: JSON.stringify('5fa3b9'):`, typeof VERSION, VERSION);
console.log(
	`BROWSER_SUPPORTS_HTML5: true:`,
	typeof BROWSER_SUPPORTS_HTML5,
	BROWSER_SUPPORTS_HTML5
);
console.log(`TWO: '1+1':`, typeof TWO, TWO);
console.log(
	`typeof window': JSON.stringify('object'):`,
	typeof typeof window,
	typeof window
);
console.log('-- DefinePlugin的使用 --');

export { sum, Person };
