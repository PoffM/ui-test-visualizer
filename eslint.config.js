const config = require('@antfu/eslint-config').default

module.exports = config({
  rules: {
    // My prefs
    'no-console': 'off',
    'no-use-before-define': 'off',
    'curly': ['error', 'all'],
    'ts/no-use-before-define': 'off',
    'style/jsx-one-expression-per-line': 'off',
    'style/yield-star-spacing': ['error', 'after'],
    // Named callback functions are useful for debugging;
    // they are labelled in stack traces.
    'prefer-arrow-callback': 'off',

    // Convenient for this project
    'node/prefer-global/process': 'off',
    'antfu/no-import-node-modules-by-path': 'off',
  },
})
