import { describe, expect, it } from "vitest";
import { FESTOON_VALLEY, festoonPoints, festoonPolygon } from "./festoon";

const radius = ([x, y]: readonly [number, number]) => Math.hypot(x, y);

describe("festoonPoints", () => {
  it("recorre las 12 ondas del sello entre el valle y la cresta", () => {
    const points = festoonPoints(8);
    expect(points).toHaveLength(96);
    for (const point of points) {
      expect(radius(point)).toBeGreaterThanOrEqual(FESTOON_VALLEY - 1e-9);
      expect(radius(point)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("coincide con la geometría del sello: valle a 182 de 196,5 y cresta arriba", () => {
    expect(FESTOON_VALLEY).toBeCloseTo(182 / 196.5, 2);
    const [first] = festoonPoints(8);
    // El primer punto es el valle de −15°.
    expect(radius(first!)).toBeCloseTo(FESTOON_VALLEY, 6);
    expect((Math.atan2(first![0], -first![1]) * 180) / Math.PI).toBeCloseTo(-15, 6);
    // La cresta de la primera onda queda arriba, sobre el eje vertical.
    const crest = festoonPoints(2)[1]!;
    expect(crest[0]).toBeCloseTo(0, 6);
    expect(crest[1]).toBeCloseTo(-1, 6);
  });
});

describe("festoonPolygon", () => {
  it("arma un polygon() válido que escala con var(--r)", () => {
    const polygon = festoonPolygon(4);
    expect(polygon.startsWith("polygon(calc(50% ")).toBe(true);
    expect(polygon.match(/calc\(/g)).toHaveLength(48 * 2);
    expect(polygon).not.toMatch(/e-\d|NaN|\+ -/);
  });
});
