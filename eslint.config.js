import config from '@remcohaszing/eslint'

export default [
  ...config,
  {
    rules: {
      'import-x/no-extraneous-dependencies': 'off'
    }
  }
]
