const { override, overrideDevServer, addBabelPlugins } = require('customize-cra');

module.exports = {
	webpack: override(
		addBabelPlugins("@babel/plugin-proposal-optional-chaining",
			"@babel/plugin-proposal-nullish-coalescing-operator",
			["@babel/plugin-proposal-decorators", { legacy: true }],
			["@babel/plugin-proposal-class-properties", { loose: true }]
		)
	),
}