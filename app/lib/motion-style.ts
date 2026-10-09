import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useState, type CSSProperties, type RefObject } from "react";

/** Propiedades que se pueden escribir en cada frame sin tocar el layout. */
type MotionProperty = "rotate" | "translate" | "scale" | "transform" | "opacity" | `--${string}`;

export const deg = (value: number) => `${value}deg`;

/** Número para variables CSS: sin notación exponencial (1e-7) y con 4 decimales. */
export const num = (value: number) => value.toFixed(4);

/**
 * Enlaza un MotionValue (resorte, scroll, transform) con una propiedad del elemento,
 * escribiendo directo en el DOM en cada frame.
 *
 * Motion calcula el movimiento; no hace falta su renderer (`m.*` + LazyMotion), que suma
 * un chunk y, si llega después de hidratar, vuelve los valores a su estado inicial.
 * Devuelve el estilo inicial: se calcula una sola vez y coincide con el HTML prerenderizado;
 * como no cambia entre renders, React no pisa lo que escribe Motion.
 *
 * Con una variable CSS (`--algo`), el CSS decide cómo usarla: así una sola escritura mueve
 * varias piezas y, sin JavaScript, la variable simplemente no se usa.
 */
export function useMotionStyle(
  ref: RefObject<HTMLElement | null>,
  value: MotionValue<number>,
  property: MotionProperty,
  format: (value: number) => string,
): CSSProperties {
  const [style] = useState<CSSProperties>(() => ({ [property]: format(value.get()) }));

  useMotionValueEvent(value, "change", (latest) => {
    ref.current?.style.setProperty(property, format(latest));
  });

  return style;
}
