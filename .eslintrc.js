module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  ignorePatterns: [
    '**/iconfont.js',
    '**/iconfont.js1',
    '**/assets/**/*.js'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-self-assign': 'warn',
    'no-unused-vars': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/no-deprecated-slot-attribute': 'warn',
    'vue/no-deprecated-v-bind-sync': 'warn',
    'vue/no-deprecated-destroyed-lifecycle': 'warn',
    'vue/no-mutating-props': 'warn',
    'vue/require-toggle-inside-transition': 'warn'
  }
}
