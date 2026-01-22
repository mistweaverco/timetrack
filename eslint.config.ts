import prettier from 'eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.svelte'],
    rules: {
      'no-undef': 'off', // Let TypeScript handle this
    },
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '.svelte-kit/**',
      '.vite/**',
      'web/**',
      'dist/**',
      'out/**',
      'generated/**',
    ],
  },
)
