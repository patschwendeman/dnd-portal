import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";
import styledComponentsA11y from "eslint-plugin-styled-components-a11y";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      react: pluginReact,
      import: importPlugin,
      "styled-components-a11y": styledComponentsA11y,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      quotes: ["error", "single"],
      semi: ["error", "never"],
      curly: ["error", "all"],
      "prefer-const": [
        "error",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: true,
        },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "no-console": ["warn"],
      "no-var": "error",
      camelcase: ["error", { properties: "always" }],
      "no-unused-vars": ["error", { args: "none", ignoreRestSiblings: true }],
      "arrow-body-style": ["error", "as-needed"],
      strict: ["error", "global"],
      "styled-components-a11y/alt-text": "warn",
      "styled-components-a11y/anchor-is-valid": "warn",
      "styled-components-a11y/aria-role": "warn",
    },
  },
];
