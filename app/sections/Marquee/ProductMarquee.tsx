import {
  cancelFrame,
  frame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";
import { useEffect, useRef } from "react";
import isotype from "~/components/brand/geometry/isotype.json";
import { deg, useMotionStyle } from "~/lib/motion-style";
import styles from "./ProductMarquee.module.css";

// Productos reales del catálogo oficial, como en la marquesina de un local.
const PRODUCTS = [
  "Medialunas de manteca",
  "Vigilantes",
  "Sacramentos",
  "Chipá",
  "Pan de campo",
  "Alfajores de maicena",
  "Budín marmolado",
  "Pastafrola de membrillo",
  "Mini Rogel",
  "Sándwiches de miga",
  "Tartas",
  "Chocotorta en pote",
  "Medialunas de grasa",
  "Tortitas negras",
  "Scones de queso",
  "Mini Red Velvet",
];

// En reposo recorre una copia de la lista (media pista) cada 55 s.
const BASE_SPEED = 50 / 55; // % de la pista por segundo
// El scroll suma hasta 6 veces esa velocidad y lo inclina hasta 7°.
const MAX_BOOST = 6;
const MAX_TILT = 7;
const VELOCITY_RANGE = [-2600, 0, 2600];

/** Ramita del sello como separador. */
function Sprig() {
  return (
    <svg className={styles.sprig} viewBox="20 29 60 44" aria-hidden="true">
      <path d={isotype.sprig} />
    </svg>
  );
}

/**
 * Marquesina roja con los productos. Corre sola y responde al scroll: acelera con la
 * velocidad, cambia de sentido cuando se sube y se inclina como un cartel que toma
 * envión. Con el cursor encima frena suave, para poder leer.
 * Es decorativa (los productos se presentan, accesibles, en la sección siguiente),
 * así que queda fuera del árbol de accesibilidad. Sin JS corre con una animación CSS.
 */
export function ProductMarquee() {
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(bandRef);

  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 400, damping: 50 });
  const boost = useTransform(velocity, VELOCITY_RANGE, [-MAX_BOOST, 0, MAX_BOOST]);
  // Se inclina hacia atrás, como si el envión la arrastrara.
  const tilt = useTransform(velocity, VELOCITY_RANGE, [MAX_TILT, 0, -MAX_TILT]);
  // 1 en reposo, 0 con el cursor encima: frena y arranca con resorte, nunca de golpe.
  const cruise = useSpring(1, { stiffness: 120, damping: 20 });

  const offset = useMotionValue(0);
  const direction = useRef(-1);

  const trackStyle = {
    ...useMotionStyle(trackRef, offset, "translate", (x) => `${x}% 0`),
    ...useMotionStyle(trackRef, tilt, "transform", (angle) => `skewX(${deg(angle)})`),
  };

  // El loop corre solo mientras la banda está en pantalla.
  useEffect(() => {
    if (!inView || reduceMotion) return;
    const step = ({ delta }: { delta: number }) => {
      const push = boost.get();
      if (push > 0.05) direction.current = -1;
      else if (push < -0.05) direction.current = 1;
      const speed = BASE_SPEED * (cruise.get() + Math.abs(push));
      offset.set(wrap(-50, 0, offset.get() + (direction.current * speed * delta) / 1000));
    };
    frame.update(step, true);
    return () => cancelFrame(step);
  }, [inView, reduceMotion, boost, cruise, offset]);

  const onPointer = (hovering: boolean) => (event: { pointerType: string }) => {
    if (event.pointerType === "mouse") cruise.set(hovering ? 0 : 1);
  };

  return (
    <div
      ref={bandRef}
      className={`surface-rojo festoon-top ${styles.band}`}
      aria-hidden="true"
      onPointerEnter={onPointer(true)}
      onPointerLeave={onPointer(false)}
    >
      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track} style={trackStyle}>
          {[0, 1].map((copy) => (
            <ul key={copy} role="list" className={styles.group}>
              {PRODUCTS.map((product) => (
                <li key={product} className={styles.item}>
                  {product}
                  <Sprig />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
