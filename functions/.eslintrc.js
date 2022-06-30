module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"google",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["tsconfig.json", "tsconfig.dev.json"],
		tsconfigRootDir: __dirname,
		sourceType: "module",
	},
	ignorePatterns: [
		"/lib/**/*", // Ignore built files.
	],
	plugins: ["@typescript-eslint", "import"],
	rules: {
		quotes: ["error", "double"],
		// indent: [2, 2, { SwitchCase: 1 }],
		indent: 0,
		"require-jsdoc": 0,
		"@typescript-eslint/no-var-requires": 0,
		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/no-empty-function": 0,
		"@typescript-eslint/no-invalid-this": 0,
		"@typescript-eslint/explicit-module-boundary-types": 0,
		"spaced-comment": 0,
		"new-cap": ["error", { capIsNew: false }],
		"prettier/prettier": ["warn",  {"endOfLine": "auto"}],
	},
};
