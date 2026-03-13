import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/helpers/setup.ts"],
    include: [
      "__tests__/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/validators.ts",
        "src/lib/services/**/*.ts",
        "src/lib/actions/**/*.ts",
        "src/components/layout/**/*.tsx",
        "src/app/(auth)/login/**/*.tsx",
        "src/app/dashboard/template/**/*.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/db/**",
        "src/app/dashboard/template/page.tsx",
        "src/app/(auth)/login/page.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
