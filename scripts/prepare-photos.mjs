// Prepara los masters de fotos a partir de los originales de la web oficial.
//
// Los originales (hasta 6000×4000 y 2,6 MB) van en assets-src/photos/, fuera de git.
// Los masters salen a app/assets/photos/ con nombre en kebab-case ASCII, el lado
// largo en 2400 px como máximo y sin metadatos. vite-imagetools genera las variantes
// AVIF, WebP y JPG en el build a partir de estos masters.
//
// Uso: npm run photos
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const SOURCE = root("assets-src/photos");
const OUTPUT = root("app/assets/photos");
const MAX_EDGE = 2400;

// master ← original de https://www.dulcehora.com.ar/<original>
const PHOTOS = {
  "facturas-cenital": "producto_medialunas-facturas.jpg",
  "medialunas-manteca": "producto_medialunas-manteca.jpg",
  "medialunas-grasa": "producto_medialunas-grasa.jpg",
  panificado: "producto_panificado.jpeg",
  vigilante: "producto_facturas_Vigi-corto.jpg",
  trenzas: "producto_facturas_Trenzas.jpg",
  chipa: "producto_bizcocheria_Chipa.jpg",
  baguette: "producto_panificado_Baguette.jpg",
  "sandwich-miga": "producto_sandwich-miga.jpg",
  "sandwich-arabe": "producto_sandwich-arabe.jpg",
  tarta: "producto_tartas_1.jpg",
  "wrap-carne": "producto_wrap_carne.jpg",
  "pizza-muzzarella": "producto_pizza_muzzarella_1.jpg",
  "surtido-pasteleria": "producto_cuarto_SURTIDO.jpg",
  "alfajor-chocolate": "producto_alfajor_chocolate.jpg",
  "budin-marmolado": "producto_budin_Budin-marmolado.jpg",
  "mini-rogel": "producto_mini-torta_Mini-Rogel.jpg",
  "mini-red-velvet": "producto_mini-torta_Mini-Red-Velvet.jpg",
  "pote-chocotorta": "producto_pote_chocotorta.jpg",
  "pote-frutos-rojos": "producto_pote_frutos-rojos.jpg",
};

mkdirSync(OUTPUT, { recursive: true });

for (const [name, original] of Object.entries(PHOTOS)) {
  const input = `${SOURCE}/${original}`;
  if (!existsSync(input)) {
    console.warn(`Falta el original ${original}: se mantiene el master existente.`);
    continue;
  }
  const info = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${OUTPUT}/${name}.jpg`);
  console.log(`${name}.jpg  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
