// Controla los presupuestos de peso del build (plan, sección 7).
// React Router borra el manifest de Vite con ssr:false, así que los recursos
// iniciales se obtienen leyendo el index.html prerenderizado.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const CLIENT = fileURLToPath(new URL("../build/client/", import.meta.url));
const KB = 1024;

const BUDGETS = {
  initialJs: 140 * KB,
  css: 25 * KB,
  html: 40 * KB,
  preloadedFonts: 1,
  preloadedFontBytes: 80 * KB,
  heroAvif828: 100 * KB,
};

const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
const fmt = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
const readAsset = (href) => readFileSync(join(CLIENT, decodeURI(href.replace(/^\//, ""))));

const indexPath = join(CLIENT, "index.html");
if (!existsSync(indexPath)) {
  console.error("No existe build/client/index.html. Corré `npm run build` primero.");
  process.exit(1);
}
const html = readFileSync(indexPath, "utf8");

// JS inicial: módulos precargados, scripts con src e imports del script inline.
const jsHrefs = new Set();
for (const [, href] of html.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)) jsHrefs.add(href);
for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) jsHrefs.add(src);
for (const [, spec] of html.matchAll(/import\s*(?:[^"']*from\s*)?["'](\/assets\/[^"']+\.js)["']/g)) jsHrefs.add(spec);

const cssHrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const fontPreloads = [...html.matchAll(/<link rel="preload"[^>]+as="font"[^>]*>/g)].map((m) => m[0]);

const rows = [];
let failed = false;
const check = (label, value, limit, format = fmt) => {
  const ok = value <= limit;
  if (!ok) failed = true;
  rows.push({ recurso: label, medido: format(value), limite: format(limit), estado: ok ? "ok" : "EXCEDE" });
};

const jsFiles = [...jsHrefs].map((href) => ({ href, bytes: gz(readAsset(href)) }));
check("JS inicial (gzip)", jsFiles.reduce((sum, f) => sum + f.bytes, 0), BUDGETS.initialJs);
check("CSS (gzip)", cssHrefs.reduce((sum, href) => sum + gz(readAsset(href)), 0), BUDGETS.css);
check("HTML (gzip)", gz(Buffer.from(html)), BUDGETS.html);
check("Fuentes precargadas", fontPreloads.length, BUDGETS.preloadedFonts, String);

for (const tag of fontPreloads) {
  const href = tag.match(/href="([^"]+)"/)?.[1];
  if (href) check(`Fuente ${href.split("/").pop()}`, statSync(join(CLIENT, href)).size, BUDGETS.preloadedFontBytes);
}

// La foto del hero (avif 828w), cuando exista.
const assetsDir = join(CLIENT, "assets");
const heroAvif = readdirSync(assetsDir).find((name) => /^hero[-.].*828.*\.avif$/i.test(name) || /hero.*w828.*\.avif$/i.test(name));
if (heroAvif) check(`Hero ${heroAvif}`, statSync(join(assetsDir, heroAvif)).size, BUDGETS.heroAvif828);

// El chunk de las features de Motion nunca debe estar entre los scripts iniciales.
const motionInitial = jsFiles.filter((f) => /motion-features/i.test(f.href));
if (motionInitial.length > 0) {
  failed = true;
  rows.push({ recurso: "Chunk de Motion en el JS inicial", medido: motionInitial.map((f) => f.href).join(", "), limite: "ninguno", estado: "EXCEDE" });
}

console.table(rows);
console.log("Scripts iniciales:");
for (const f of jsFiles.toSorted((a, b) => b.bytes - a.bytes)) console.log(`  ${fmt(f.bytes).padStart(9)}  ${f.href}`);

if (failed) {
  console.error("\nHay presupuestos excedidos.");
  process.exit(1);
}
console.log("\nPresupuestos dentro de los límites.");
