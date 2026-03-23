import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/app/test-setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        exclude: ["src/app/test-setup.ts", "src/main.tsx"],
      },
    },
  })
)
