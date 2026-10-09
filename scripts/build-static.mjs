// Genera los archivos estáticos de la marca desde app/components/brand/geometry/:
// favicons, íconos del manifest, SVG del sello para <img> y la página 404.
// La geometría sale de scripts/brand/generate-geometry.py; acá no se dibuja nada nuevo.
//
// Uso: npm run static            → public/ y app/assets/brand/
//      npm run static -- --sheet → además, docs/marca/svg/ para la lámina del logo
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const piece = (name) => JSON.parse(readFileSync(root(`app/components/brand/geometry/${name}.json`), "utf8"));

const seal = piece("seal");
const isotype = piece("isotype");
const monogram = piece("monogram");
const signature = piece("signature");

export const colors = { rojo: "#D50D17", rojoHorno: "#A80A12", tostado: "#22140F", harina: "#FFFFFF" };
const { rojo, tostado, harina } = colors;

const svg = (viewBox, body, attributes = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${attributes}>${body}</svg>`;

/** Sello principal. `edge` es el color de los festones: Tostado, o Rojo sobre fondos oscuros. */
export function sealSvg({ edge = tostado, title = "" } = {}) {
  return svg(
    seal.viewBox,
    (title ? `<title>${title}</title>` : "") +
      `<path fill="${edge}" d="${seal.festoon}"/>` +
      `<circle fill="${harina}" cx="${seal.disc.cx}" cy="${seal.disc.cy}" r="${seal.disc.r}"/>` +
      `<path fill="none" stroke="${rojo}" stroke-width="4.5" stroke-linecap="round" d="${seal.arc}"/>` +
      `<path fill="${rojo}" d="${seal.sprig}"/>` +
      `<path fill="none" stroke="${harina}" stroke-width="1.6" stroke-linecap="round" d="${seal.veins}"/>` +
      `<path fill="${tostado}" d="${seal.dulce}"/>` +
      `<path fill="${rojo}" d="${seal.hora}"/>` +
      `<path fill="${tostado}" d="${seal.descriptor}"/>` +
      `<path fill="${rojo}" d="${seal.ampersand}"/>`,
    title ? ' role="img"' : "",
  );
}

const isotypeBody = ({ edge = tostado } = {}) =>
  `<path fill="${edge}" d="${isotype.festoon}"/>` +
  `<circle fill="${harina}" cx="${isotype.disc.cx}" cy="${isotype.disc.cy}" r="${isotype.disc.r}"/>` +
  `<path fill="${rojo}" d="${isotype.sprig}"/>`;

export const isotypeSvg = (options) => svg(isotype.viewBox, isotypeBody(options));

export const monogramSvg = ({ edge = tostado } = {}) =>
  svg(
    monogram.viewBox,
    `<path fill="${edge}" d="${monogram.festoon}"/>` +
      `<circle fill="${harina}" cx="${monogram.disc.cx}" cy="${monogram.disc.cy}" r="${monogram.disc.r}"/>` +
      `<path fill="${tostado}" d="${monogram.d}"/>` +
      `<path fill="${rojo}" d="${monogram.h}"/>`,
  );

/** Firma horizontal. Sobre Rojo, DULCE y HORA van en Harina. */
export const signatureSvg = ({ ink = tostado, accent = rojo, edge = tostado, attributes = "" } = {}) =>
  svg(
    signature.viewBox,
    `<g transform="scale(${signature.isotypeScale})">${isotypeBody({ edge })}</g>` +
      `<path fill="${ink}" d="${signature.dulce}"/>` +
      `<path fill="${accent}" d="${signature.hora}"/>`,
    attributes,
  );

const png = (svgText, size) =>
  sharp(Buffer.from(svgText), { density: Math.max(72, (72 * size) / 100) * 2 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO con una sola imagen PNG (formato admitido desde Windows Vista). */
function ico(pngBuffer, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(1, 4); // una imagen
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10); // planos
  header.writeUInt16LE(32, 12); // bits por píxel
  header.writeUInt32LE(pngBuffer.length, 14);
  header.writeUInt32LE(22, 18); // offset de la imagen
  return Buffer.concat([header, pngBuffer]);
}

function notFoundPage() {
  const logo = signatureSvg({ attributes: ' width="150" height="60" aria-hidden="true" focusable="false"' });
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Página no encontrada | Dulce Hora</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="${rojo}">
<style>
*{box-sizing:border-box;margin:0}
html{color-scheme:light}
body{min-height:100dvh;display:grid;grid-template-rows:auto 1fr;background:${harina};color:${tostado};font:1.125rem/1.6 Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}
header{padding:1rem clamp(1rem,4vw,2.75rem)}
header a{display:inline-block;border-radius:.5rem}
main{align-self:center;width:min(100% - 2rem,40rem);margin:0 auto;padding:3rem 0 5rem}
p.code{font:700 1rem/1 "Arial Narrow",Arial,sans-serif;letter-spacing:.02em;color:${rojo}}
h1{margin:.75rem 0 1rem;font:800 clamp(2.5rem,8vw,4.5rem)/.95 "Arial Narrow",Arial,sans-serif;letter-spacing:-.01em;text-wrap:balance}
p{max-width:34em;text-wrap:pretty}
ul{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem;padding:0;list-style:none}
ul a{display:inline-flex;align-items:center;min-height:3rem;padding:0 1.5rem;border-radius:999px;border:2px solid ${tostado};font:700 1rem/1 Arial,sans-serif;letter-spacing:.01em;color:${tostado};text-decoration:none}
ul a.primary{background:${rojo};border-color:${rojo};color:${harina}}
ul a:hover{background:${tostado};border-color:${tostado};color:${harina}}
ul a.primary:hover{background:${colors.rojoHorno};border-color:${colors.rojoHorno}}
a:focus-visible{outline:3px solid ${tostado};outline-offset:3px}
</style>
</head>
<body>
<header><a href="/">${logo}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">Dulce Hora, ir al inicio</span></a></header>
<main>
<p class="code">Error 404</p>
<h1>No encontramos esta página</h1>
<p>Puede que el enlace esté mal escrito o que la página ya no exista. Desde el inicio podés ver todos los productos y buscar la sucursal más cercana.</p>
<ul>
<li><a class="primary" href="/">Ir al inicio</a></li>
<li><a href="/#productos">Ver productos</a></li>
<li><a href="/#sucursales">Encontrá tu sucursal</a></li>
</ul>
</main>
</body>
</html>
`;
}

async function main() {
  const isotypeFile = isotypeSvg();
  writeFileSync(root("public/favicon.svg"), isotypeFile);
  writeFileSync(root("public/favicon.ico"), ico(await png(isotypeFile, 32), 32));
  // iOS no admite transparencia en el apple-touch-icon: va sobre Harina con aire.
  const padded = svg("-12 -12 124 124", `<rect x="-12" y="-12" width="124" height="124" fill="${harina}"/>${isotypeBody()}`);
  writeFileSync(root("public/apple-touch-icon.png"), await png(padded, 180));
  writeFileSync(root("public/icon-192.png"), await png(isotypeFile, 192));
  writeFileSync(root("public/icon-512.png"), await png(isotypeFile, 512));
  // "maskable": el sello dentro de la zona segura (80 % central), sobre Rojo.
  const maskable = svg("-25 -25 150 150", `<rect x="-25" y="-25" width="150" height="150" fill="${rojo}"/>${isotypeBody()}`);
  writeFileSync(root("public/icon-maskable-512.png"), await png(maskable, 512));
  writeFileSync(root("public/404.html"), notFoundPage());

  // SVG para usar como <img> (footer y OG): se cachean y no suman JS.
  mkdirSync(root("app/assets/brand"), { recursive: true });
  writeFileSync(root("app/assets/brand/sello.svg"), sealSvg());
  writeFileSync(root("app/assets/brand/sello-sobre-oscuro.svg"), sealSvg({ edge: rojo }));

  if (process.argv.includes("--sheet")) {
    const dir = root("docs/marca/svg");
    mkdirSync(dir, { recursive: true });
    const files = {
      "sello.svg": sealSvg(),
      "sello-sobre-oscuro.svg": sealSvg({ edge: rojo }),
      "isotipo.svg": isotypeFile,
      "monograma.svg": monogramSvg(),
      "firma.svg": signatureSvg(),
      "firma-sobre-rojo.svg": signatureSvg({ ink: harina, accent: harina }),
      "firma-sobre-tostado.svg": signatureSvg({ ink: harina, accent: rojo, edge: rojo }),
    };
    for (const [name, content] of Object.entries(files)) writeFileSync(`${dir}/${name}`, content);
    console.log(`Lámina: ${Object.keys(files).length} SVG en docs/marca/svg/.`);
  }
  console.log("Estáticos generados: favicons, íconos, 404 y sellos para <img>.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
