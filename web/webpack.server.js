const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	entry: './server/index.jsx',
	mode: process.env.NODE_ENV,
	target: 'node',

	output: {
		path: path.resolve('dist'),
		filename: 'index.js'
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/,
				use: 'babel-loader'
			}
		]
	},
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	plugins:[
		new webpack.IgnorePlugin(/^(pg-native)$/),
	]
};