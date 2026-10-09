import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";

// Presets de fotos: se importan como `foto.jpg?preset=hero` y devuelven un objeto <picture>.
const FORMATS = "avif;webp;jpg";
const PRESETS: Record<string, Record<string, string>> = {
  hero: { w: "480;640;828;1080;1440;1920;2400", format: FORMATS, as: "picture" },
  feature: { w: "480;640;828;1080;1440", format: FORMATS, as: "picture" },
  thumb: { w: "320;480;640", format: FORMATS, as: "picture" },
  // Recorte cuadrado para la esfera del dial de productos (los originales tienen 1080 px de alto).
  plate: { w: "320;480;720;960", aspect: "1:1", fit: "cover", format: FORMATS, as: "picture" },
  // Foto de la escena de Historia, a pantalla completa: llega al ancho del original (1616 px).
  scene: { w: "640;960;1280;1616", format: FORMATS, as: "picture" },
};

export default defineConfig({
  resolve: { tsconfigPaths: true },
  define: {
    // El año del © se fija en el build para no generar diferencias de hidratación.
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
  plugins: [
    imagetools({
      defaultDirectives: (url) => {
        const preset = url.searchParams.get("preset");
        if (preset && !PRESETS[preset]) {
          throw new Error(`Preset de imagen desconocido: "${preset}"`);
        }
        return new URLSearchParams(preset ? PRESETS[preset] : undefined);
      },
    }),
    reactRouter(),
  ],
});
