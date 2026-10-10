// Controla los presupuestos de peso del build (plan, sección 7).
// Los recursos iniciales salen del index.html que genera Astro: los scripts de cada
// sección y, siguiendo sus imports, los módulos compartidos (GSAP, Lenis, Motion).
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const CLIENT = fileURLToPath(new URL("../dist/", import.meta.url));
const KB = 1024;

const BUDGETS = {
  // Sin React, el JS inicial bajó de 138 KB a ~67 KB: el presupuesto lo deja fijo con margen.
  initialJs: 90 * KB,
  css: 25 * KB,
  html: 40 * KB,
  preloadedFonts: 1,
  preloadedFontBytes: 80 * KB,
  // Primera foto del paseo (la del LCP), en AVIF de 960 px.
  heroAvif960: 100 * KB,
};

const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
const fmt = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
const readAsset = (href) => readFileSync(join(CLIENT, decodeURI(href.replace(/^\//, ""))));

const indexPath = join(CLIENT, "index.html");
if (!existsSync(indexPath)) {
  console.error("No existe dist/index.html. Corré `npm run build` primero.");
  process.exit(1);
}
const html = readFileSync(indexPath, "utf8");

// JS inicial: los scripts con src y, recursivamente, los módulos que importan.
const jsHrefs = new Set();
const follow = (href) => {
  if (jsHrefs.has(href)) return;
  jsHrefs.add(href);
  const code = readAsset(href).toString("utf8");
  for (const [, spec] of code.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    follow(new URL(spec, `https://x${href}`).pathname);
  }
};
for (const [, href] of html.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)) follow(href);
for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) follow(src);

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

// La primera foto del paseo es la del LCP: su AVIF de 960 px tiene presupuesto propio.
const firstAvif = html.match(/<source[^>]*type="image\/avif"[^>]*>/)?.[0].match(/srcset="([^"]+)"/)?.[1];
const avif960 = firstAvif?.split(",").map((entry) => entry.trim().split(/\s+/)).find(([, width]) => width === "960w")?.[0];
if (avif960) check(`Paseo ${avif960.split("/").pop()}`, readAsset(avif960).length, BUDGETS.heroAvif960);

console.table(rows);
console.log("Scripts iniciales:");
for (const f of jsFiles.toSorted((a, b) => b.bytes - a.bytes)) console.log(`  ${fmt(f.bytes).padStart(9)}  ${f.href}`);

if (failed) {
  console.error("\nHay presupuestos excedidos.");
  process.exit(1);
}
console.log("\nPresupuestos dentro de los límites.");
