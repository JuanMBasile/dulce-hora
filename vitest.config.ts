import { defineConfig } from "vitest/config";

// Los tests unitarios cubren la lógica pura de app/lib: no necesitan Astro ni las fotos.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.ts"],
    setupFiles: ["./tests/unit/setup.ts"],
  },
});
