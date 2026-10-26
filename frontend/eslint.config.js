import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    rules: {
      // Data fetching in effects (load-on-mount) is the standard pattern here;
      // this new compiler-style rule flags every synchronous setState inside an
      // effect and would require a full fetch/library refactor to satisfy.
      "react-hooks/set-state-in-effect": "off",
      // Context files intentionally export a Provider component together with
      // a use* hook — splitting them is unnecessary for this project.
      "react-refresh/only-export-components": "off",
    },
  },
])
