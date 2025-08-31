// apps/frontend/eslint.config.mjs
import js from '@eslint/js';
import next from 'eslint-plugin-next';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// 获取当前目录（ESM 兼容）
const __dirname = new URL(import.meta.url).pathname.replace(/\/eslint\.config\.mjs$/, '');

export default [
  // 基础 JavaScript 规则
  js.configs.recommended,

  // Next.js 规则（原生 Flat Config）
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      next,
      react,
      'react-hooks': reactHooks,
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Next.js 核心规则
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      // React 规则
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      // React Hooks 规则
      ...reactHooks.configs.recommended.rules,

      // TypeScript 规则
      ...typescriptEslint.configs.recommended.rules,

      // 自定义规则
      'no-console': 'warn',
      'react/prop-types': 'off', // TypeScript 已检查
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 忽略规则
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      '!.prettierrc.js',
    ],
  },
];