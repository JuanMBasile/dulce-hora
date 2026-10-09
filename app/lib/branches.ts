import { regions, type Branch, type Region, type RegionId } from "~/data/branches";

// Búsqueda y agrupado de sucursales. Todo es puro: el componente solo decide qué mostrar.

/* ---------- Texto comparable ---------- */

/**
 * Pliega un texto para compararlo: minúsculas, sin tildes ni diéresis (la ñ cuenta como n)
 * y con la puntuación como espacio. Devuelve además, para cada caracter plegado, su índice
 * en el original: así una coincidencia se puede resaltar sobre el texto con tildes.
 */
export function foldWithIndex(text: string): { folded: string; index: number[] } {
  let folded = "";
  const index: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const base = text[i]!.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    for (const char of base) {
      if (/[a-z0-9]/.test(char)) {
        folded += char;
        index.push(i);
      } else if (folded !== "" && !folded.endsWith(" ")) {
        folded += " ";
        index.push(i);
      }
    }
  }
  if (folded.endsWith(" ")) {
    folded = folded.slice(0, -1);
    index.pop();
  }
  return { folded, index };
}

/** "Av. Güemes 3.792" → "av guemes 3 792". */
export const fold = (text: string) => foldWithIndex(text).folded;

/** Palabras de la búsqueda, plegadas. Todas tienen que aparecer en la sucursal. */
export const tokenize = (query: string) => fold(query).split(" ").filter(Boolean);

// Abreviaturas de las direcciones: quien busca "avenida san juan" también la encuentra.
const EXPANSIONS: Partial<Record<string, string>> = {
  av: "avenida",
  bv: "bulevar boulevard",
  pje: "pasaje",
  pte: "presidente",
  gral: "general",
};

/* ---------- Índice ---------- */

export type IndexedBranch = Branch & {
  /** Identificador estable: "almagro-gascon-645". */
  id: string;
  /** Todo lo que se puede buscar de la sucursal, plegado. */
  haystack: string;
};

const regionById = new Map<RegionId, Region>(regions.map((region) => [region.id, region]));

export function regionOf(id: RegionId): Region {
  const region = regionById.get(id);
  if (!region) throw new Error(`Zona desconocida: ${id}`);
  return region;
}

export const slug = (text: string) => fold(text).replaceAll(" ", "-");

export function indexBranches(list: readonly Branch[]): IndexedBranch[] {
  return list.map((branch) => {
    const region = regionOf(branch.region);
    const names = [branch.area, ...(branch.aliases ?? [])].map(fold);
    const address = fold(branch.address);
    const expansions = address
      .split(" ")
      .map((word) => EXPANSIONS[word])
      .filter(Boolean);
    const haystack = [
      ...names,
      // "villaurquiza" también encuentra "Villa Urquiza".
      ...names.map((name) => name.replaceAll(" ", "")),
      address,
      ...expansions,
      ...[region.label, region.chip, ...region.aliases].map(fold),
    ].join(" | ");
    return { ...branch, id: slug(`${branch.area} ${branch.address}`), haystack };
  });
}

export function matchesBranch(branch: IndexedBranch, tokens: readonly string[]) {
  return tokens.every((token) => branch.haystack.includes(token));
}

/* ---------- Agrupado ---------- */

export type AreaGroup = { id: string; area: string; branches: IndexedBranch[] };
export type RegionGroup = { region: Region; areas: AreaGroup[]; count: number };

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Agrupa por zona (en el orden de `regions`) y por barrio o localidad, en orden alfabético. */
export function groupBranches(list: readonly IndexedBranch[]): RegionGroup[] {
  return regions.flatMap((region) => {
    const inRegion = list.filter((branch) => branch.region === region.id);
    if (inRegion.length === 0) return [];
    const areas = new Map<string, IndexedBranch[]>();
    for (const branch of inRegion) {
      const items = areas.get(branch.area);
      if (items) items.push(branch);
      else areas.set(branch.area, [branch]);
    }
    return [
      {
        region,
        count: inRegion.length,
        areas: [...areas]
          .map(([area, items]) => ({
            id: slug(`${region.id} ${area}`),
            area,
            branches: items.toSorted((a, b) => collator.compare(a.address, b.address)),
          }))
          .toSorted((a, b) => collator.compare(a.area, b.area)),
      },
    ];
  });
}

export function countByRegion(list: readonly IndexedBranch[]): Record<RegionId, number> {
  const counts: Record<RegionId, number> = { caba: 0, provincia: 0, rosario: 0 };
  for (const branch of list) counts[branch.region]++;
  return counts;
}

/** Barrios y localidades sin repetir, en el orden del listado. */
export const areasOf = (list: readonly Branch[]) => [...new Set(list.map((branch) => branch.area))];

/* ---------- Presentación ---------- */

export type Segment = { text: string; hit: boolean };

/** Parte un texto en tramos, marcando los que coinciden con alguna palabra de la búsqueda. */
export function highlight(text: string, tokens: readonly string[]): Segment[] {
  if (tokens.length === 0) return [{ text, hit: false }];
  const { folded, index } = foldWithIndex(text);
  const marked = new Array<boolean>(text.length).fill(false);
  for (const token of tokens) {
    for (let at = folded.indexOf(token); at !== -1; at = folded.indexOf(token, at + 1)) {
      const start = index[at]!;
      const end = index[at + token.length - 1]!;
      marked.fill(true, start, end + 1);
    }
  }
  // Un espacio entre dos coincidencias también se marca: "San Juan" se lee como un tramo.
  for (let i = 1; i < text.length - 1; i++) {
    if (/\s/.test(text[i]!) && marked[i - 1] && marked[i + 1]) marked[i] = true;
  }
  const segments: Segment[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = segments.at(-1);
    if (last && last.hit === marked[i]) last.text += text[i];
    else segments.push({ text: text[i]!, hit: marked[i]! });
  }
  return segments;
}

/** Búsqueda para Google Maps: con la marca adelante, Maps abre la ficha del local (horarios, fotos). */
export function branchMapsQuery(branch: Branch) {
  const region = regionOf(branch.region);
  const place = region.postal.startsWith(branch.area) ? region.postal : `${branch.area}, ${region.postal}`;
  return `Dulce Hora, ${branch.address}, ${place}`;
}

const plural = (count: number) => (count === 1 ? "1 sucursal" : `${count} sucursales`);

/** Estado de la búsqueda, para leer y para anunciar: "12 sucursales en Rosario para «san juan»". */
export function describeResults(count: number, region: Region | null, query: string) {
  const where = region ? ` ${region.where}` : "";
  const what = query.trim() ? ` para «${query.trim()}»` : "";
  return count === 0 ? `No hay sucursales${where}${what}` : `${plural(count)}${where}${what}`;
}
