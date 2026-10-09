import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Config separada de vite.config.ts: los tests no necesitan el plugin de
// React Router ni procesar fotos con sharp.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: /^.+\.(?:jpe?g|png|webp|avif)\?preset=\w+$/,
        replacement: fileURLToPath(new URL("./tests/unit/image-stub.ts", import.meta.url)),
      },
    ],
  },
  oxc: { jsx: { runtime: "automatic" } },
  define: { __BUILD_YEAR__: "2026" },
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/unit/setup.ts"],
  },
});
