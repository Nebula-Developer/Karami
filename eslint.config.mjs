//@ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticTs from '@stylistic/eslint-plugin-ts';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['function', 'class', 'export', 'interface'],
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class', 'export', 'interface'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/ts/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['function', 'class', 'export', 'interface'],
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class', 'export', 'interface'],
        },
      ],
    },
    plugins: {
      '@stylistic/ts': stylisticTs,
    },
    ignores: ['*.js'],
  },
);
