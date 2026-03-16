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
        "src/lib/vin.ts",
        "src/lib/slug.ts",
        "src/lib/services/**/*.ts",
        "src/lib/actions/**/*.ts",
        "src/components/layout/**/*.tsx",
        "src/components/inspection/**/*.tsx",
        "src/components/profile/**/*.tsx",
        "src/components/vehicle/**/*.tsx",
        "src/components/review/**/*.tsx",
        "src/app/(auth)/login/**/*.tsx",
        "src/app/dashboard/template/**/*.tsx",
        "src/app/dashboard/inspect/**/*.tsx",
        "src/components/landing/**/*.tsx",
        "src/lib/actions/contact.ts",
        "src/offline/**/*.ts",
        "src/components/pwa/**/*.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/db/**",
        "src/app/dashboard/template/page.tsx",
        "src/app/(auth)/login/page.tsx",
        "src/app/dashboard/inspect/page.tsx",
        "src/app/dashboard/inspect/metadata/page.tsx",
        "src/app/dashboard/inspect/\\[id\\]/page.tsx",
        "src/app/dashboard/page.tsx",
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
