const config = require('@antfu/eslint-config').default

module.exports = config({
  rules: {
    'no-console': 'off',
    'no-use-before-define': 'off',
    'node/prefer-global/process': 'off',
    'antfu/no-import-node-modules-by-path': 'off',
    'curly': ['error', 'all'],
    'ts/no-use-before-define': 'off',
    'style/jsx-one-expression-per-line': 'off',
    'style/yield-star-spacing': ['error', 'after'],
    'ts/no-require-imports': 'off',
    'ts/no-var-requires': 'off',
  },
})
