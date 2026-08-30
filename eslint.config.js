import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist', 'node_modules', 'opera-ink-fe-bundle', 'fix_pagination.ts', 'patch.ts', 'patch2.ts',
    // Halaman mock/legacy tidak direferensikan oleh App.tsx (route produksi).
    'src/mocks/**', 'src/pages/dashboard/**', 'src/pages/master/**', 'src/pages/Rencana/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      // Kontrak API lama masih memakai any pada mapper boundary; build TypeScript
      // tetap menjadi pemeriksa tipe untuk source produksi.
      '@typescript-eslint/no-explicit-any': 'off',
      // Komponen shadcn dan provider mengekspor helper bersama komponen.
      'react-refresh/only-export-components': 'off',
      // Beberapa effect memulihkan state saat parameter route berubah.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
