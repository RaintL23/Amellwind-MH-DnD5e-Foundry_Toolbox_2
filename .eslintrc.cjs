/* eslint-env node */
// Flat-config postdates this project's ESLint 8 toolchain, so we use the classic
// `.eslintrc` format expected by `eslint . --ext ts,tsx` (see package.json → lint).
//
// The lint script runs with `--max-warnings 0`, so every enabled rule must be
// clean across the repo. Two rules are intentionally disabled below because the
// codebase's architecture deliberately works against them (details inline).
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: [
    "dist",
    "node_modules",
    "backup-jsons",
    "public",
    "scripts",
    "*.config.js",
    "*.config.ts",
    ".eslintrc.cjs",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react-refresh"],
  rules: {
    // Guard against dynamic code execution; the single controlled use of
    // `new Function` (spell-scaling formula eval) opts out with an inline
    // disable, so keeping this on keeps that directive meaningful.
    "no-new-func": "error",

    // Respect the `_`-prefix convention for intentionally unused
    // args/vars/catch bindings used throughout the codebase.
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],

    // Off by design: the builder curates effect/memo dependency arrays by hand
    // (e.g. depending on `speciesRef?.id` instead of the object to avoid refetch
    // loops, and listing slice objects rather than each callback). Enforcing
    // exhaustive-deps here would fight that intent and add render regressions.
    // `react-hooks/rules-of-hooks` stays on to catch genuine hook misuse.
    "react-hooks/exhaustive-deps": "off",

    // Off by design: a dev-only Fast Refresh hint. The app colocates providers,
    // hooks and helper exports with components on purpose, which this rule flags
    // without any correctness impact.
    "react-refresh/only-export-components": "off",
  },
};
