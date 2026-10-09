import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const NO_JS_SPEC = /seo-nojs\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    locale: "es-AR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "m375",
      testIgnore: NO_JS_SPEC,
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: "m390",
      testIgnore: NO_JS_SPEC,
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
    {
      name: "t768",
      testIgnore: NO_JS_SPEC,
      use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: "d1440",
      testIgnore: NO_JS_SPEC,
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      // El HTML prerenderizado tiene que funcionar sin ejecutar JavaScript.
      name: "no-js",
      testMatch: NO_JS_SPEC,
      use: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false },
    },
  ],
  // Se usa `serve` y no `vite preview`: con ssr:false, vite preview devuelve
  // index.html con 200 para cualquier URL y no permite probar el 404 real.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run preview",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
