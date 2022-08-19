// postcss.config.js

// {
// loader: 'postcss-loader',
// options: {
//     postcssOptions: {
//         plugins: [require('autoprefixer')],
//     },
// },

// 导出去的就是postcss - loader里面的options的postcssOptions属性对象
module.exports = {
	plugins: [require('autoprefixer')],
};
