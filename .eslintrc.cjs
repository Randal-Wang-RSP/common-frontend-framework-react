/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "boundaries", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
    "boundaries/elements": [
      // mode: "folder" groups all files under a folder as one element — required for slice-level grouping
      { type: "app",      pattern: "src/app/**",      mode: "folder" },
      { type: "pages",    pattern: "src/pages/*",     mode: "folder", capture: ["slice"] },
      { type: "widgets",  pattern: "src/widgets/*",   mode: "folder", capture: ["slice"] },
      { type: "features", pattern: "src/features/*",  mode: "folder", capture: ["slice"] },
      { type: "entities", pattern: "src/entities/*",  mode: "folder", capture: ["slice"] },
      { type: "shared",   pattern: "src/shared/**",   mode: "folder" },
    ],
    "boundaries/ignore": ["src/main.tsx"],
  },
  rules: {
    // FSD layer direction + same-layer slice isolation
    // Capture syntax: ${from.slice} references the slice captured from the importing file's path
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: ["app"], allow: ["pages", "widgets", "features", "entities", "shared"] },
          {
            // pages can import from other slices in pages (only same slice), and lower layers
            from: [["pages", { slice: "*" }]],
            allow: [
              ["pages", { slice: "${from.slice}" }],
              "widgets", "features", "entities", "shared",
            ],
          },
          {
            // widgets can import from other slices in widgets (only same slice), and lower layers
            from: [["widgets", { slice: "*" }]],
            allow: [
              ["widgets", { slice: "${from.slice}" }],
              "features", "entities", "shared",
            ],
          },
          {
            // features can import from other slices in features (only same slice), and lower layers
            from: [["features", { slice: "*" }]],
            allow: [
              ["features", { slice: "${from.slice}" }],
              "entities", "shared",
            ],
          },
          {
            // entities can import from other slices in entities (only same slice), and shared
            from: [["entities", { slice: "*" }]],
            allow: [
              ["entities", { slice: "${from.slice}" }],
              "shared",
            ],
          },
          { from: ["shared"], allow: [] },
        ],
      },
    ],
    "boundaries/no-unknown": ["error"],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.cjs"],
}
