// Marcado del listado de sucursales, compartido por el HTML estático (Branches.astro) y el
// buscador del navegador (branches-client.ts): los dos dibujan exactamente lo mismo.
import isotype from "~/components/brand/geometry/isotype.json";
import { sections } from "~/data/site";
import { branchMapsQuery, highlight, type RegionGroup } from "~/lib/branches";
import { mapsSearchUrl } from "~/lib/urls";
import styles from "./Branches.module.css";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ESCAPES[char]!);

/* ---------- Íconos (trazo de 2 px, en currentColor) ---------- */
const PATHS = {
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  clear: "M6 6l12 12M18 6 6 18",
  arrow: "M8 16 16 8M9.5 8H16v6.5",
  pin: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11ZM12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z",
} as const;

export const icon = (name: keyof typeof PATHS, className = "") =>
  `<svg${className ? ` class="${className}"` : ""} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${PATHS[name]}"/></svg>`;

/** Texto con las coincidencias de la búsqueda resaltadas. */
const highlighted = (text: string, tokens: readonly string[]) =>
  highlight(text, tokens)
    .map((segment) => (segment.hit ? `<mark class="${styles.mark}">${escape(segment.text)}</mark>` : escape(segment.text)))
    .join("");

const plural = (count: number) => (count === 1 ? "sucursal" : "sucursales");

type BoardState = {
  groups: readonly RegionGroup[];
  tokens: readonly string[];
  query: string;
  /** Sin resultados en la zona, pero sí en otras: cuántas. */
  elsewhere: number;
  /** "en Rosario", si hay una zona elegida. */
  where: string | null;
};

/** Listado agrupado por zona y barrio; sin resultados, el vacío con sus salidas. */
export function boardHTML({ groups, tokens, query, elsewhere, where }: BoardState) {
  const regions = groups
    .map((group) => {
      const id = `zona-${group.region.id}`;
      const rows = group.areas
        .map((area) => {
          // Una ciudad sin barrios en el listado (Rosario) no repite su nombre como barrio.
          const solo = area.area === group.region.label;
          const addresses = area.branches
            .map(
              (branch) =>
                `<li><a class="${styles.address}" data-branch="${branch.id}" href="${escape(mapsSearchUrl(branchMapsQuery(branch)))}" rel="noopener" aria-label="${escape(`${branch.address}, ${area.area}: cómo llegar (Google Maps)`)}">${highlighted(branch.address, tokens)}${icon("arrow", styles.arrow)}</a></li>`,
            )
            .join("");
          return `<li class="${styles.row}" data-flip="${area.id}"${solo ? " data-solo" : ""}><h4 class="${solo ? "visually-hidden" : styles.area}">${highlighted(area.area, tokens)}</h4><ul role="list" class="${styles.addresses}">${addresses}</ul></li>`;
        })
        .join("");
      return `<section class="${styles.region}" aria-labelledby="${id}"><h3 id="${id}" class="${styles.regionTitle}" data-flip="${id}">${escape(group.region.label)} <span class="${styles.regionCount}">${group.count}<span class="visually-hidden"> ${plural(group.count)}</span></span></h3><ul role="list">${rows}</ul></section>`;
    })
    .join("");

  if (groups.length > 0) return regions;

  const term = escape(query.trim());
  const title = elsewhere && where ? `No hay resultados ${escape(where)}` : `No encontramos «${term}»`;
  const text = elsewhere
    ? `Hay ${elsewhere === 1 ? "una sucursal" : `${elsewhere} sucursales`} para «${term}» en otras zonas.`
    : "Probá con otro barrio, una calle o la ciudad, o buscá las más cercanas en Google Maps.";
  const action = elsewhere
    ? `<button type="button" class="${styles.emptyButton}" data-action="all-zones">Ver todas las zonas</button>`
    : `<button type="button" class="${styles.emptyButton}" data-action="clear">Borrar la búsqueda</button>`;
  return `<div class="${styles.empty}" data-flip="vacio"><svg class="${styles.emptySprig}" viewBox="20 29 60 44" aria-hidden="true" focusable="false"><path d="${isotype.sprig}"/></svg><p class="${styles.emptyTitle}">${title}</p><p class="${styles.emptyText}">${text}</p><div class="${styles.emptyActions}">${action}</div><p class="${styles.emptyFranchise}">¿No hay un Dulce Hora en tu barrio? <a href="#${sections.franquicias}">Abrí el tuyo</a>.</p></div>`;
}

/** Contador mecánico: cada cifra es una tira de 0 a 9 que gira hasta su valor (CSS). */
export const odometerHTML = (value: number) =>
  String(value)
    .split("")
    .map((digit) => `<span class="${styles.digit}" style="--d: ${digit}"></span>`)
    .join("");
