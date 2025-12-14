import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  
  // TypeScript 配置
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // 代码质量基础规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Import 规则
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/no-absolute-path': 'error',
      
      // React 规则
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      
      // React Hooks 规则
      ...reactHooksPlugin.configs.recommended.rules,
      
      // 错误处理
      'no-useless-catch': 'error',
      'prefer-promise-reject-errors': 'error',
      
      // 安全性
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  
  // 忽略文件
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.next/',
      'out/',
      'apps/backend/prisma/generated/',
      'packages/types/dist/',
      '**/*.js', // 主要检查 TypeScript
    ],
  }
];