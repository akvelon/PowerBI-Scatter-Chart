module.exports = {
    env: {
        'browser': true,
        'es6': true,
        'es2017': true,
    },
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    plugins: [
        'powerbi-visuals',
    ],
    extends: [
        'plugin:powerbi-visuals/recommended',
    ],
    rules: {},
};
