import { describe, expect, it } from "vitest";
import { clockAngles, dayAngle, formatTime, momentForHour, nearestTurn } from "./moments";

describe("momentForHour", () => {
  it("divide el día en cuatro momentos sin huecos", () => {
    expect(momentForHour(5)).toBe("manana");
    expect(momentForHour(11)).toBe("manana");
    expect(momentForHour(12)).toBe("mediodia");
    expect(momentForHour(15)).toBe("mediodia");
    expect(momentForHour(16)).toBe("merienda");
    expect(momentForHour(19)).toBe("merienda");
    expect(momentForHour(20)).toBe("festejo");
    expect(momentForHour(0)).toBe("festejo");
    expect(momentForHour(4)).toBe("festejo");
  });
});

describe("clockAngles", () => {
  it("ubica las agujas como un reloj analógico", () => {
    expect(clockAngles(new Date(2026, 9, 8, 0, 0))).toEqual({ hour: 0, minute: 0 });
    expect(clockAngles(new Date(2026, 9, 8, 15, 30))).toEqual({ hour: 105, minute: 180 });
    expect(clockAngles(new Date(2026, 9, 8, 21, 45))).toEqual({ hour: 292.5, minute: 270 });
  });
});

describe("formatTime", () => {
  it("usa el formato de 24 h con dos dígitos", () => {
    expect(formatTime(new Date(2026, 9, 8, 9, 5))).toBe("09:05");
    expect(formatTime(new Date(2026, 9, 8, 18, 40))).toBe("18:40");
  });
});

describe("dayAngle", () => {
  it("pone el mediodía arriba, la mañana a la izquierda y la medianoche abajo", () => {
    expect(dayAngle(12)).toBe(0);
    expect(dayAngle(6)).toBe(-90);
    expect(dayAngle(18)).toBe(90);
    expect(Math.abs(dayAngle(0))).toBe(180);
  });
});

describe("nearestTurn", () => {
  it("gira por el camino más corto y conserva las vueltas acumuladas", () => {
    expect(nearestTurn(0, 75)).toBe(75);
    expect(nearestTurn(135, -60)).toBe(300);
    expect(nearestTurn(-60, 135)).toBe(-225);
    expect(nearestTurn(720 + 15, 75)).toBe(720 + 75);
  });
});
