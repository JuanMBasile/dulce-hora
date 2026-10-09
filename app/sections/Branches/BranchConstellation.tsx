import { animateMini, spring, useInView, useReducedMotion, type AnimationPlaybackControlsWithThen } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import isotype from "~/components/brand/geometry/isotype.json";
import type { IndexedBranch } from "~/lib/branches";
import { layoutConstellation, type Constellation } from "~/lib/constellation";
import styles from "./BranchConstellation.module.css";

// Curva de salida fuerte (ease-out-quint): arranca rápido y se asienta suave. Nada entra
// con ease-in, que se siente lento.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Dispersos, los puntos son sucursales y se ven grandes; en el festón son las perforaciones
// de una blonda. Aparecen desde la mitad de su tamaño, nunca desde cero.
const SCATTER_SCALE = 2;
// Las dispersas se encienden de a una, repartidas en un segundo.
const APPEAR_SPAN = 1;
const APPEAR_DURATION = 0.5;
// Pausa con todas a la vista, antes de que se ordenen.
const HOLD = 0.35;
// Se acomodan en sentido horario, como la aguja de un reloj: un resorte con un rebote apenas
// visible. Los puntos que no estaban dispersos se encienden en su lugar con el mismo barrido.
const FORM_STAGGER = 0.007;
const FORM_SPRING = { type: spring, visualDuration: 0.75, bounce: 0.18 };

const px = (value: number) => `${value.toFixed(1)}px`;

/**
 * Coreografía de una sola vez, escrita con Motion sobre la Web Animations API (corre fuera
 * del hilo principal). Devuelve la función que la detiene; al detenerse borra los estilos
 * en línea y el CSS vuelve a mandar.
 */
function choreograph(stage: HTMLElement, layout: Constellation, onDone: () => void) {
  const running: AnimationPlaybackControlsWithThen[] = [];
  let stopped = false;
  const ring = stage.querySelector<HTMLElement>("[data-ring]");
  const dots = [...stage.querySelectorAll<HTMLElement>("[data-dot]")];
  const labels = [...stage.querySelectorAll<HTMLElement>("[data-label]")];
  const sprig = stage.querySelector<SVGSVGElement>("[data-sprig]");
  // Si el marcado no coincide con el dibujo, el sello se muestra formado, sin coreografía.
  if (!ring || !sprig || dots.length !== layout.ring.length) {
    onDone();
    return () => {};
  }

  const run: typeof animateMini = (target, keyframes, options) => {
    const controls = animateMini(target, keyframes, options);
    running.push(controls);
    return controls;
  };

  // Desde dónde sale cada punto disperso: su lugar en el escenario, medido desde su lugar en el festón.
  const stageBox = stage.getBoundingClientRect();
  const ringBox = ring.getBoundingClientRect();
  const offsets = layout.ring.map((point, slot) => {
    const from = layout.scatter[slot];
    if (!from) return null;
    const x = (from.x / 100) * stageBox.width - (ringBox.left - stageBox.left + (point.x / 100) * ringBox.width);
    const y = (from.y / 100) * stageBox.height - (ringBox.top - stageBox.top + (point.y / 100) * ringBox.height);
    return `translate(${px(x)}, ${px(y)})`;
  });
  const scattered = offsets.filter(Boolean).length;
  const appearAt = (slot: number) => 0.1 + (layout.order[slot]! * APPEAR_SPAN) / scattered;

  async function play() {
    // 1. Las sucursales aparecen dispersas, de a una, y algunos barrios se nombran.
    const appear = dots.flatMap((dot, slot) => {
      const offset = offsets[slot];
      if (!offset) return [];
      return run(
        dot,
        { opacity: [0, 1], transform: [`${offset} scale(${SCATTER_SCALE / 2})`, `${offset} scale(${SCATTER_SCALE})`] },
        { duration: APPEAR_DURATION, ease: EASE_OUT, delay: appearAt(slot) },
      );
    });
    layout.labels.forEach((label, index) => {
      const element = labels[index];
      if (!element) return;
      run(
        element,
        { opacity: [0, 1], transform: ["translateY(0.3rem)", "none"] },
        { duration: 0.4, ease: EASE_OUT, delay: appearAt(label.slot) + 0.12 },
      );
    });
    await Promise.all(appear);
    if (stopped) return;

    // 2. Los nombres se van, las sucursales vuelan a su lugar y el festón se completa a su alrededor.
    for (const element of labels) run(element, { opacity: 0 }, { duration: 0.2, ease: EASE_OUT, delay: HOLD });
    const form = dots.map((dot, slot) => {
      const offset = offsets[slot];
      const delay = HOLD + slot * FORM_STAGGER;
      return offset
        ? run(
            dot,
            { transform: [`${offset} scale(${SCATTER_SCALE})`, "translate(0px, 0px) scale(1)"] },
            { ...FORM_SPRING, delay },
          )
        : run(dot, { opacity: [0, 1], transform: ["scale(0.4)", "none"] }, { duration: 0.45, ease: EASE_OUT, delay });
    });

    // 3. Con el festón casi cerrado, la ramita se apoya en el centro.
    const stamp = run(
      sprig,
      { opacity: [0, 1], transform: ["scale(0.9)", "none"] },
      { duration: 0.5, ease: EASE_OUT, delay: HOLD + dots.length * FORM_STAGGER + 0.3 },
    );
    await Promise.all([...form, stamp]);
    if (!stopped) onDone();
  }

  void play();
  return () => {
    stopped = true;
    for (const controls of running) controls.stop();
    for (const element of [...dots, ...labels, sprig]) {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    }
  };
}

type BranchConstellationProps = {
  /** Sucursales en el orden en que ocupan el festón (el del listado: zona, barrio, dirección). */
  branches: readonly IndexedBranch[];
  /** Sucursales encendidas, o ninguna. */
  lit: ReadonlySet<string> | null;
  /** Con un filtro activo, el resto del sello se apaga. */
  dim: boolean;
  hydrated: boolean;
};

/**
 * "Las sucursales forman el sello", como la V de Vremont: sobre una grilla de puntos tenue,
 * las sucursales aparecen dispersas (algunas con su barrio) y vuelan al festón, que se
 * completa a su alrededor con la ramita en el centro. Ya formado, el sello acompaña al buscador: se encienden las sucursales que
 * se muestran y, sin filtro, las del barrio que nombra el tambor.
 *
 * Es decorativo: el listado y el estado de la búsqueda tienen su propio texto accesible.
 * Sin JavaScript o con movimiento reducido, el sello aparece ya formado.
 */
export function BranchConstellation({ branches, lit, dim, hydrated }: BranchConstellationProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(stageRef, { once: true, amount: 0.45 });
  const [played, setPlayed] = useState(false);
  const layout = useMemo(
    () =>
      layoutConstellation({
        areas: branches.map((branch) => branch.area),
        maxLabels: 7,
        maxScattered: 36,
        seed: 11,
        aspect: 1.3,
      }),
    [branches],
  );
  // Qué sucursal ocupa cada punto del festón; el resto completa el dibujo.
  const branchAt = useMemo(() => {
    const ids = new Array<string | undefined>(layout.ring.length);
    layout.slots.forEach((slot, index) => (ids[slot] = branches[index]?.id));
    return ids;
  }, [layout, branches]);

  // Con movimiento reducido no hay coreografía: el sello ya está formado (también lo sabe
  // el HTML prerenderizado, que no conoce la preferencia; por eso se espera a hidratar).
  const formed = played || (hydrated && reduceMotion === true);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !inView || reduceMotion || played) return;
    return choreograph(stage, layout, () => setPlayed(true));
  }, [inView, reduceMotion, played, layout]);

  return (
    <div ref={stageRef} className={styles.stage} aria-hidden="true" data-formed={formed || undefined}>
      {layout.labels.map((label) => {
        const point = layout.scatter[label.slot]!;
        return (
          <span
            key={label.text}
            data-label=""
            className={styles.label}
            data-side={label.side}
            data-minor={label.rank >= 4 || undefined}
            style={{ left: `${point.x.toFixed(2)}%`, top: `${point.y.toFixed(2)}%` }}
          >
            {label.text}
          </span>
        );
      })}
      <div data-ring="" className={styles.ring}>
        {layout.ring.map((point, slot) => {
          const id = branchAt[slot];
          const on = id !== undefined && lit?.has(id) === true;
          return (
            <span
              key={slot}
              data-dot=""
              className={styles.dot}
              data-lit={on || undefined}
              data-dim={(dim && !on) || undefined}
              style={{ left: `${point.x.toFixed(2)}%`, top: `${point.y.toFixed(2)}%` }}
            />
          );
        })}
        <svg data-sprig="" className={styles.sprig} viewBox="20 29 60 44" focusable="false">
          <path d={isotype.sprig} />
        </svg>
      </div>
    </div>
  );
}
