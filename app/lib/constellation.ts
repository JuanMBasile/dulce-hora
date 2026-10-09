import { festoonPoints } from "./festoon";

// Constelación de sucursales: las sucursales aparecen dispersas y después se acomodan en el
// festón del sello, como la V de la red de Vremont. El resto del festón se completa a su
// alrededor. Todo es determinista: el HTML prerenderizado y el cliente calculan lo mismo.

export type Point = { x: number; y: number };

/** Generador pseudoaleatorio con semilla (mulberry32): el mismo dibujo en cada build. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Puntos del festón: la misma cantidad en cada una de las 12 ondas y al menos 8 por onda,
 *  para que se lea el borde del sello. Con más sucursales, el festón suma puntos. */
export const ringCount = (branches: number) => 12 * Math.max(8, Math.ceil(branches / 12));

/** Lugar de cada sucursal en el festón: repartidas en orden, la primera arriba, en sentido horario. */
export const ringSlots = (branches: number, points: number) =>
  Array.from({ length: branches }, (_, index) => Math.round((index * points) / branches));

// En puntos, las ondas del sello real casi no se ven: el dibujo punteado las hace más hondas.
const SCALLOP_DEPTH = 2.2;

/** Posición de cada punto del festón en % de un cuadrado: la cresta queda al 47 % del centro. */
export const ringLayout = (points: number): Point[] =>
  festoonPoints(points / 12).map(([x, y]) => {
    const radius = Math.hypot(x, y);
    const deeper = (1 - (1 - radius) * SCALLOP_DEPTH) / radius;
    return { x: 50 + x * deeper * 47, y: 50 + y * deeper * 47 };
  });

type ScatterOptions = {
  /** Ancho / alto del escenario: las distancias se miden en proporción real. */
  aspect: number;
  /** Dónde puede caer cada punto, en fracciones del escenario. */
  region: (random: () => number) => Point;
  /** Distancia mínima entre puntos, en fracciones del alto. */
  spacing: number;
  /** Lugares prohibidos, como el texto de un rótulo. */
  blocked?: (point: Point) => boolean;
};

const distance = (a: Point, b: Point, aspect: number) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);

/**
 * Dispersa puntos sin que se amontonen (muestreo por dardos). Si un punto no encuentra lugar
 * después de muchos intentos, acepta uno más cerca: nunca falla y siempre devuelve `count`.
 */
export function scatterPoints(count: number, random: () => number, options: ScatterOptions, taken: Point[] = []) {
  const placed: Point[] = [];
  const crowded = (point: Point, spacing: number) =>
    options.blocked?.(point) === true ||
    [...taken, ...placed].some((other) => distance(point, other, options.aspect) < spacing);
  for (let index = 0; index < count; index++) {
    let spacing = options.spacing;
    let point = options.region(random);
    for (let attempt = 1; crowded(point, spacing) && attempt < 2000; attempt++) {
      point = options.region(random);
      if (attempt % 40 === 0) spacing *= 0.85;
    }
    placed.push(point);
  }
  return placed;
}

export type ConstellationLabel = {
  /** Punto del festón al que acompaña. */
  slot: number;
  text: string;
  /** Lado del punto donde va el texto: siempre hacia el centro, así nunca se sale del escenario. */
  side: "start" | "end";
  /** Orden de importancia: en escenarios angostos se muestran solo los primeros. */
  rank: number;
};

export type Constellation = {
  /** Posición final de cada punto en el festón, en % del cuadrado del sello. */
  ring: Point[];
  /** Punto del festón de cada sucursal, en el orden recibido. */
  slots: number[];
  /** Posición dispersa de cada punto, en % del escenario; `null` si aparece directo en el festón. */
  scatter: (Point | null)[];
  /** Turno de aparición de cada punto disperso (0 = primero); -1 para el resto. */
  order: number[];
  labels: ConstellationLabel[];
};

type ConstellationInput = {
  /** Barrio o localidad de cada sucursal, en el orden en que ocupan el festón. */
  areas: readonly string[];
  /** Cuántos barrios se nombran mientras los puntos están dispersos. */
  maxLabels: number;
  /** Cuántas sucursales se dispersan como mucho: más, y el escenario se vuelve una trama. */
  maxScattered: number;
  seed: number;
  aspect: number;
};

// Lo que ocupa un rótulo, en fracciones del escenario, hacia el lado del texto.
const LABEL_WIDTH = 0.2;
const LABEL_HEIGHT = 0.05;

/** Arma la constelación completa: festón, dispersión, orden de aparición y rótulos. */
export function layoutConstellation({
  areas,
  maxLabels,
  maxScattered,
  seed,
  aspect,
}: ConstellationInput): Constellation {
  const random = seededRandom(seed);
  const points = ringCount(areas.length);
  const slots = ringSlots(areas.length, points);

  // Rótulos: los barrios con más sucursales primero; cada uno nombra a su primera sucursal.
  const counts = new Map<string, number>();
  for (const area of areas) counts.set(area, (counts.get(area) ?? 0) + 1);
  const named = [...counts.keys()]
    .toSorted((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b, "es"))
    .slice(0, maxLabels);
  const labelSlots = named.map((area) => slots[areas.indexOf(area)]!);

  // Se dispersan las sucursales con rótulo y, repartidas, otras hasta completar el máximo.
  const labelSet = new Set(labelSlots);
  const others = slots.filter((slot) => !labelSet.has(slot));
  const room = Math.max(0, Math.min(maxScattered, slots.length) - labelSlots.length);
  const picked =
    room >= others.length
      ? others
      : Array.from({ length: room }, (_, index) => others[Math.floor((index * others.length) / room)]!);

  // Los puntos con rótulo caen en franjas laterales y bien separados: el texto, que va hacia
  // el centro, tiene lugar. El resto no cae encima de ningún texto.
  const labelPoints = scatterPoints(labelSlots.length, random, {
    aspect,
    spacing: 0.17,
    region: (next) => {
      const left = next() < 0.5;
      return { x: left ? 0.08 + next() * 0.3 : 0.62 + next() * 0.3, y: 0.1 + next() * 0.8 };
    },
  });
  const onLabel = (point: Point) =>
    labelPoints.some(
      (label) =>
        Math.abs(point.y - label.y) < LABEL_HEIGHT &&
        (label.x < 0.5
          ? point.x > label.x && point.x < label.x + LABEL_WIDTH
          : point.x < label.x && point.x > label.x - LABEL_WIDTH),
    );
  const otherPoints = scatterPoints(
    picked.length,
    random,
    {
      aspect,
      spacing: 0.11,
      region: (next) => ({ x: 0.05 + next() * 0.9, y: 0.06 + next() * 0.88 }),
      blocked: onLabel,
    },
    labelPoints,
  );

  const scatter: (Point | null)[] = new Array(points).fill(null);
  labelSlots.forEach((slot, index) => (scatter[slot] = labelPoints[index]!));
  picked.forEach((slot, index) => (scatter[slot] = otherPoints[index]!));

  // Las dispersas aparecen en un orden al azar, como luces que se encienden en la ciudad.
  const sequence = [...labelSlots, ...picked];
  for (let index = sequence.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [sequence[index], sequence[swap]] = [sequence[swap]!, sequence[index]!];
  }
  const order = new Array<number>(points).fill(-1);
  sequence.forEach((slot, turn) => (order[slot] = turn));

  return {
    ring: ringLayout(points),
    slots,
    scatter: scatter.map((point) => (point ? { x: point.x * 100, y: point.y * 100 } : null)),
    order,
    labels: named.map((text, rank) => ({
      slot: labelSlots[rank]!,
      text,
      side: labelPoints[rank]!.x < 0.5 ? "end" : "start",
      rank,
    })),
  };
}
