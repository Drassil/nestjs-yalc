module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.dev.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    'prettier'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': ['warn'],
    '@typescript-eslint/no-empty-interface' : 'off',
    'no-console': 'error',
    'no-redeclare' : 'off',
    eqeqeq: 1,
  },
  ignorePatterns: [
    '**/node_modules',
    '**/*spec.ts',
    '**/__tests__',
    '**/__mocks__',
    '**/jest.config.ts',
  ],
};
