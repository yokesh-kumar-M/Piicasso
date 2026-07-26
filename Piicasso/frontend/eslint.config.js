import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

// This codebase is mid-migration from CRA to Vite and still authors JSX
// inside plain `.js` files (a CRA-era convention — see vite.config.js's
// esbuild `loader: 'jsx'` override for `src/**/*.js`). So `.js` files here
// are linted with the same JSX-aware rules as `.jsx`/`.tsx`, and the
// eventual TypeScript migration (see UPGRADE_PLAN.md Phase 5) can turn this
// same file into a `.ts`-only ruleset by narrowing the `files` globs below.
export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        // `process.env.REACT_APP_*` is a CRA-era convention this codebase
        // still uses; Vite statically replaces these via the `define` block
        // in vite.config.js at build time (see that file's comment). Not a
        // real Node global at runtime — declared here so ESLint doesn't
        // flag it. Migrating to `import.meta.env.VITE_*` is a Phase 5
        // TypeScript-migration task (see UPGRADE_PLAN.md), not a lint fix.
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // React 19: no `import React` needed for JSX
      ...jsxA11y.configs.recommended.rules,

      // eslint-plugin-react-hooks v7's "recommended" bundles the React
      // Compiler rule set (immutability, set-state-in-effect, purity, etc.)
      // — this project does not use React Compiler, and those rules flag
      // long-standing, working patterns (e.g. calling a `const` function
      // declared later in the component from an earlier `useEffect`, which
      // is valid JS closure behavior) as hard errors that would need real
      // refactors to clear. Keeping only the two time-tested hook rules;
      // revisit the full set if/when React Compiler is adopted (see
      // UPGRADE_PLAN.md Phase 5).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TS-recommended rules are tuned for .ts; this repo is mostly .js/.jsx
      // today, so untyped-JS-shaped code shouldn't fail the build over it.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      'react/prop-types': 'off', // no PropTypes usage in this codebase; TS migration will cover this
      'no-unused-vars': 'off', // superseded by @typescript-eslint/no-unused-vars above
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'never',
        },
      ],
      'import/no-duplicates': 'error',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', 'src/setupTests.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
  {
    files: [
      '*.config.{js,cjs,mjs,ts}',
      'scripts/**/*.{js,cjs,mjs}',
      'vite.config.js',
      'postcss.config.cjs',
      'tailwind.config.cjs',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettierConfig, // must stay last: disables ESLint formatting rules that conflict with Prettier
);
