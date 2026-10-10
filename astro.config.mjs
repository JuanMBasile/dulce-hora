// @ts-check
import { defineConfig } from "astro/config";

// Sitio estático: Astro genera el HTML de cada página en el build y el JavaScript que
// queda es solo el de las secciones que lo necesitan (scripts vanilla, sin framework).
export default defineConfig({
  // Dominio canónico asumido hasta que la marca lo confirme (docs/datos-a-confirmar.md).
  site: "https://www.dulcehora.com.ar",
  // El código vive en app/, como antes de la migración.
  srcDir: "./app",
  trailingSlash: "never",
  build: {
    // /404.html y /index.html, como espera Vercel.
    format: "file",
    // Todo el CSS en una sola hoja enlazada: las secciones no dependen de cuándo llega su script.
    inlineStylesheets: "never",
  },
  // Sin enrutador del lado del cliente: la Home navega con anclas nativas.
  prefetch: false,
  devToolbar: { enabled: false },
  image: {
    // Calidad pareja con los presets que tenía vite-imagetools.
    service: { entrypoint: "astro/assets/services/sharp" },
  },
  vite: {
    build: { cssCodeSplit: false },
  },
});
