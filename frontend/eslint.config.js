import js from '@eslint/js'
import { configs, plugins } from 'eslint-config-airbnb-extended'
import styledComponentsA11y from 'eslint-plugin-styled-components-a11y'
import globals from 'globals'

export default [
  // src/api/schema.d.ts is generated from ../backend/openapi.json (npm run generate:api)
  { ignores: ['dist/', 'src/api/schema.d.ts'] },
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  ...configs.react.recommended,
  plugins.typescriptEslint,
  ...configs.base.typescript,
  ...configs.react.typescript,
  {
    plugins: { 'styled-components-a11y': styledComponentsA11y },
    rules: {
      'styled-components-a11y/alt-text': 'warn',
      'styled-components-a11y/anchor-is-valid': 'warn',
      'styled-components-a11y/aria-role': 'warn',
    },
  },
  // Deviations from Airbnb, each one technically required or a project decision (DND-32).
  {
    rules: {
      // Project style: no semicolons, also not as delimiters in interfaces and type literals.
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/member-delimiter-style': [
        'error',
        { multiline: { delimiter: 'none' }, singleline: { delimiter: 'comma', requireLast: false } },
      ],
      // New JSX transform (react-jsx): React does not need to be in scope.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Icons are served by Vite from public/ under /assets/… and cannot be resolved as modules.
      'import-x/no-absolute-path': ['error', { ignore: ['^/assets/'] }],
      'import-x/no-unresolved': ['error', { commonjs: true, caseSensitive: true, ignore: ['^/assets/'] }],
      // Function components in TypeScript: optional props get default arguments, defaultProps is deprecated.
      'react/require-default-props': [
        'error',
        { forbidDefaultForRequired: true, classes: 'defaultProps', functions: 'defaultArguments' },
      ],
      // console.error stays for error reports in the browser console.
      'no-console': ['warn', { allow: ['error'] }],
    },
  },
]
