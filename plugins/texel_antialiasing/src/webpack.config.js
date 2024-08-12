const PathModule = require('path');

module.exports = {
	mode: 'development',
	devtool: false,
	target: 'node',
	entry: './index.ts',
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: 'texel_antialiasing.js',
		path: PathModule.resolve(__dirname, '..')
	}
}
