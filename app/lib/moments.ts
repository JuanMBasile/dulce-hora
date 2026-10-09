// Los cuatro momentos del día que organizan la Home: el reloj del hero y el dial
// de productos usan la misma división horaria.

export type MomentId = "manana" | "mediodia" | "merienda" | "festejo";

/** Frase del reloj del hero para cada momento. */
export const momentPhrases: Record<MomentId, string> = {
  manana: "Buena hora para unas medialunas.",
  mediodia: "Buena hora para algo salado.",
  merienda: "Buena hora para la merienda.",
  festejo: "Buena hora para algo dulce.",
};

/** Momento que corresponde a una hora local (0–23). */
export function momentForHour(hour: number): MomentId {
  if (hour >= 5 && hour < 12) return "manana";
  if (hour >= 12 && hour < 16) return "mediodia";
  if (hour >= 16 && hour < 20) return "merienda";
  return "festejo";
}

/** Ángulos de las agujas de un reloj analógico, en grados desde las 12. */
export function clockAngles(date: Date) {
  const minutes = date.getMinutes();
  return {
    hour: (date.getHours() % 12) * 30 + minutes * 0.5,
    minute: minutes * 6,
  };
}

const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** "09:05", en formato de 24 h. */
export const formatTime = (date: Date) => timeFormat.format(date);

/** Ángulo de una hora en el dial de 24 h del día: el mediodía arriba, la mañana a la
 *  izquierda y la noche abajo, como el recorrido del sol. */
export const dayAngle = (hour: number) => (hour - 12) * 15;

/** Ángulo absoluto más cercano a `current` que equivale a `target`: la aguja toma el camino corto. */
export function nearestTurn(current: number, target: number) {
  const delta = ((((target - current) % 360) + 540) % 360) - 180;
  return current + delta;
}
