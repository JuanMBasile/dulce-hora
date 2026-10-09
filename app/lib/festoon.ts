// Festón del sello como `clip-path: polygon()`. Es la misma geometría de seal.json
// (12 ondas de radio 64 sobre un círculo de 400, con los valles a r = 182), muestreada
// en segmentos rectos y normalizada para que la cresta valga 1.

const WAVES = 12;
const VALLEY_RADIUS = 182;
const WAVE_RADIUS = 64;
const HALF_WAVE = Math.PI / WAVES; // 15°: de un valle a la cresta

const halfChord = VALLEY_RADIUS * Math.sin(HALF_WAVE);
const waveCenter = VALLEY_RADIUS * Math.cos(HALF_WAVE) - Math.sqrt(WAVE_RADIUS ** 2 - halfChord ** 2);
const CREST_RADIUS = waveCenter + WAVE_RADIUS;
// Ángulo de cada onda vista desde su propio centro, de valle a valle.
const WAVE_SPAN = Math.asin(halfChord / WAVE_RADIUS);

/** Relación valle / cresta: el radio mínimo del festón respecto del máximo. */
export const FESTOON_VALLEY = VALLEY_RADIUS / CREST_RADIUS;

type Point = readonly [x: number, y: number];

/**
 * Puntos del festón en un círculo de radio 1 con centro en el origen (y hacia abajo,
 * como en CSS). Empieza en el valle de −15° y recorre las ondas en sentido horario;
 * la cresta de la primera onda queda arriba, como en el sello.
 */
export function festoonPoints(stepsPerWave = 8): Point[] {
  const points: Point[] = [];
  for (let wave = 0; wave < WAVES; wave++) {
    const crest = wave * 2 * HALF_WAVE;
    const cx = (waveCenter * Math.sin(crest)) / CREST_RADIUS;
    const cy = (-waveCenter * Math.cos(crest)) / CREST_RADIUS;
    // Cada onda aporta sus puntos menos el último, que es el primero de la siguiente.
    for (let step = 0; step < stepsPerWave; step++) {
      const angle = crest - WAVE_SPAN + (2 * WAVE_SPAN * step) / stepsPerWave;
      points.push([
        cx + (WAVE_RADIUS / CREST_RADIUS) * Math.sin(angle),
        cy - (WAVE_RADIUS / CREST_RADIUS) * Math.cos(angle),
      ]);
    }
  }
  return points;
}

const coordinate = (value: number) => {
  const rounded = Number(value.toFixed(4));
  return rounded < 0 ? `50% - ${-rounded} * var(--r)` : `50% + ${rounded} * var(--r)`;
};

/**
 * `polygon()` del festón centrado en la caja del elemento, con radio `var(--r)`.
 * El CSS define `--r` (un largo, o un porcentaje si la caja es cuadrada), así que el
 * mismo polígono sirve para el festón fijo y para el que crece con el scroll.
 */
export function festoonPolygon(stepsPerWave = 8) {
  const points = festoonPoints(stepsPerWave).map(([x, y]) => `calc(${coordinate(x)}) calc(${coordinate(y)})`);
  return `polygon(${points.join(",")})`;
}
