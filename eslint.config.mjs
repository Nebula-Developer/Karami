//@ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticTs from '@stylistic/eslint-plugin-ts';

export default tseslint.config(
  {
    ignores: ['dist', 'docs']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@stylistic/ts/indent': ['error', 2]
    },
    plugins: {
      '@stylistic/ts': stylisticTs
    }
  }
);
