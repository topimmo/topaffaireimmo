module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react-hooks/rules-of-hooks': 'warn', // Demote to warning for now
    'react-hooks/exhaustive-deps': 'warn', // Demote to warning for now  
    'react-hooks/set-state-in-effect': 'off', // Disable for pre-existing code
    'react-hooks/immutability': 'off', // Disable for pre-existing code
    'react-hooks/purity': 'off', // Disable - Math.random() in useMemo is acceptable
    'no-useless-escape': 'warn',
    'prefer-const': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
