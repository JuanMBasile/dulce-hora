import { describe, expect, it } from "vitest";
import { layoutConstellation, ringCount, ringLayout, ringSlots, scatterPoints, seededRandom } from "./constellation";

const AREAS = [
  ...Array(2).fill("Almagro"),
  "Barracas",
  "Boedo",
  ...Array(5).fill("Caballito"),
  ...Array(2).fill("Flores"),
  "Palermo",
  ...Array(12).fill("Rosario"),
];

const layout = (maxScattered = 36) =>
  layoutConstellation({ areas: AREAS, maxLabels: 5, maxScattered, seed: 7, aspect: 1.6 });

describe("seededRandom", () => {
  it("repite la misma serie con la misma semilla y queda en [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const values = Array.from({ length: 50 }, () => a());
    expect(values).toEqual(Array.from({ length: 50 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe("festón", () => {
  it("usa al menos 8 puntos por onda y crece con las sucursales", () => {
    expect(ringCount(0)).toBe(96);
    expect(ringCount(31)).toBe(96);
    expect(ringCount(108)).toBe(108);
    expect(ringCount(121)).toBe(132);
  });

  it("reparte las sucursales en lugares distintos, desde arriba", () => {
    const slots = ringSlots(31, 72);
    expect(slots[0]).toBe(0);
    expect(new Set(slots).size).toBe(31);
    expect(slots.every((slot, index) => index === 0 || slot > slots[index - 1]!)).toBe(true);
    expect(slots.at(-1)).toBeLessThan(72);
  });

  it("dibuja el festón centrado, dentro del cuadrado y con ondas marcadas", () => {
    const ring = ringLayout(96);
    expect(ring).toHaveLength(96);
    const radii = ring.map(({ x, y }) => Math.hypot(x - 50, y - 50));
    expect(Math.max(...radii)).toBeCloseTo(47, 1);
    // Las ondas punteadas son más hondas que las del sello (valle al 92,6 % de la cresta).
    expect(Math.min(...radii) / Math.max(...radii)).toBeLessThan(0.86);
    expect(Math.min(...radii)).toBeGreaterThan(35);
  });
});

describe("dispersión", () => {
  it("separa los puntos y siempre devuelve la cantidad pedida", () => {
    const random = seededRandom(3);
    const points = scatterPoints(30, random, {
      aspect: 1,
      spacing: 0.12,
      region: (next) => ({ x: next(), y: next() }),
    });
    expect(points).toHaveLength(30);
    // Aunque no entren con esa distancia, los acepta más cerca en lugar de colgarse.
    const crowded = scatterPoints(200, seededRandom(3), {
      aspect: 1,
      spacing: 0.2,
      region: (next) => ({ x: next(), y: next() }),
    });
    expect(crowded).toHaveLength(200);
  });
});

describe("layoutConstellation", () => {
  it("es determinista", () => {
    expect(layout()).toEqual(layout());
  });

  it("dispersa solo las sucursales, dentro del escenario, y cada una aparece una vez", () => {
    const { ring, scatter, slots, order } = layout();
    expect(ring).toHaveLength(96);
    expect(scatter).toHaveLength(96);
    expect(slots).toHaveLength(AREAS.length);
    // Con menos sucursales que el máximo, se dispersan todas y solo ellas.
    const scattered = scatter.flatMap((point, slot) => (point ? [slot] : []));
    expect(scattered.toSorted((a, b) => a - b)).toEqual(slots.toSorted((a, b) => a - b));
    for (const point of scatter) {
      if (!point) continue;
      expect(point.x).toBeGreaterThanOrEqual(5);
      expect(point.x).toBeLessThanOrEqual(95);
      expect(point.y).toBeGreaterThanOrEqual(6);
      expect(point.y).toBeLessThanOrEqual(94);
    }
    const turns = scattered.map((slot) => order[slot]!);
    expect(turns.toSorted((a, b) => a - b)).toEqual(Array.from({ length: AREAS.length }, (_, index) => index));
    expect(order.filter((turn) => turn === -1)).toHaveLength(96 - AREAS.length);
  });

  it("con más sucursales que el máximo, dispersa las nombradas y reparte el resto", () => {
    const { scatter, labels } = layout(10);
    const scattered = scatter.flatMap((point, slot) => (point ? [slot] : []));
    expect(scattered).toHaveLength(10);
    for (const label of labels) expect(scattered).toContain(label.slot);
  });

  it("nombra los barrios con más sucursales, con el texto hacia el centro", () => {
    const { labels, scatter, slots } = layout();
    expect(labels.map((label) => label.text)).toEqual(["Rosario", "Caballito", "Almagro", "Flores", "Barracas"]);
    for (const label of labels) {
      expect(label.slot).toBe(slots[AREAS.indexOf(label.text)]);
      const { x } = scatter[label.slot]!;
      expect(label.side).toBe(x < 50 ? "end" : "start");
      // Los puntos con rótulo quedan en las franjas laterales.
      expect(x < 40 || x > 60).toBe(true);
    }
  });
});
