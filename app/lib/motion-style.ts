import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useState, type CSSProperties, type RefObject } from "react";

type IndividualTransform = "rotate" | "translate" | "scale";

export const deg = (value: number) => `${value}deg`;

/**
 * Enlaza un MotionValue (resorte, scroll, transform) con una propiedad de transformación
 * individual, escribiendo directo en el elemento en cada frame.
 *
 * Motion calcula el movimiento; no hace falta su renderer (`m.*` + LazyMotion), que suma
 * un chunk y, si llega después de hidratar, vuelve los valores a su estado inicial.
 * Devuelve el estilo inicial: se calcula una sola vez y coincide con el HTML prerenderizado;
 * como no cambia entre renders, React no pisa lo que escribe Motion.
 */
export function useMotionStyle(
  ref: RefObject<HTMLElement | null>,
  value: MotionValue<number>,
  property: IndividualTransform,
  format: (value: number) => string,
): CSSProperties {
  const [style] = useState<CSSProperties>(() => ({ [property]: format(value.get()) }));

  useMotionValueEvent(value, "change", (latest) => {
    ref.current?.style.setProperty(property, format(latest));
  });

  return style;
}
