// Common
import globals from "globals";

// Typescript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import reactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
// React
import reactRecommended from "eslint-plugin-react/configs/recommended.js";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactRecommended,
  reactJsxRuntime,
  {
    // Global ignores
    ignores: [
      "node_modules/",
      "dist/",
      "src-tauri/",
      "tools/",
      "vitest-setup.ts",
      "*.config.js",
      "*.config.ts",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "react/no-unescaped-entities": "off", // Results in unreadable literals
      "react/prop-types": "off", // We use TypeScript, so this is not needed
    },
    settings: {
      react: {
        // "createClass": "createReactClass", // Regex for Component Factory to use,
        //                                    // default to "createReactClass"
        // "pragma": "React",  // Pragma to use, default to "React"
        // "fragment": "Fragment",  // Fragment to use (may be a property of <pragma>), default to "Fragment"
        version: "detect", // React version. "detect" automatically picks the version you have installed.
        // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
        // It will default to "latest" and warn if missing, and to "detect" in the future
        // "flowVersion": "0.53" // Flow version
      },
    },
  },
);
