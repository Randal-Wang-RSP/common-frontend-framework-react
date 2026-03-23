/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      // "ci" intentionally omitted — this template has no CI pipeline.
      // Downstream consumers can add it to their own commitlint.config.cjs.
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "revert"],
    ],
  },
}
