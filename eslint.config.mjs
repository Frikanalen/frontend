import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";

// eslint-config-next 16 ships flat config directly, so FlatCompat/@eslint/eslintrc
// (removed in ESLint 10) is no longer needed.
const eslintConfig = [
  { ignores: ["src/generated/**", ".next/**"] },
  ...coreWebVitals,
  ...nextTypescript,
  ...pluginQuery.configs["flat/recommended"],
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
