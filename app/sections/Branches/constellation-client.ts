import { animateMini, inView, spring, type AnimationPlaybackControlsWithThen } from "motion";
import type { IndexedBranch } from "~/lib/branches";
import { layoutConstellation, type Constellation } from "~/lib/constellation";
import { CONSTELLATION, createCoin, type CoinPhoto } from "./coin";

// Curva de salida fuerte (ease-out-quint): arranca rápido y se asienta suave.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Dispersos, los puntos son sucursales y se ven grandes; en el festón son las perforaciones
// de una blonda. Aparecen desde la mitad de su tamaño, nunca desde cero.
const SCATTER_SCALE = 2;
// Las dispersas se encienden de a una, repartidas en un segundo.
const APPEAR_SPAN = 1;
const APPEAR_DURATION = 0.5;
// Pausa con todas a la vista, antes de que se ordenen.
const HOLD = 0.35;
// Se acomodan en sentido horario, como la aguja de un reloj, con un resorte que apenas rebota.
const FORM_STAGGER = 0.007;
const FORM_SPRING = { type: spring, visualDuration: 0.75, bounce: 0.18 };
// Inclinación máxima de la moneda hacia el puntero, en grados.
const TILT = 12;

const px = (value: number) => `${value.toFixed(1)}px`;

/** Coreografía de una sola vez (Motion sobre la Web Animations API). Al terminar, el CSS vuelve a mandar. */
function choreograph(stage: HTMLElement, layout: Constellation, onDone: () => void) {
  const running: AnimationPlaybackControlsWithThen[] = [];
  const ring = stage.querySelector<HTMLElement>("[data-ring]");
  const dots = [...stage.querySelectorAll<HTMLElement>("[data-dot]")];
  const labels = [...stage.querySelectorAll<HTMLElement>("[data-label]")];
  // La ramita es la cara de adelante de la moneda del centro.
  const sprig = stage.querySelector<SVGSVGElement>("[data-sprig]");
  if (!ring || !sprig || dots.length !== layout.ring.length) {
    onDone();
    return;
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
      run(element, { opacity: [0, 1], transform: ["translateY(0.3rem)", "none"] }, { duration: 0.4, ease: EASE_OUT, delay: appearAt(label.slot) + 0.12 });
    });
    await Promise.all(appear);

    // 2. Los nombres se van, las sucursales vuelan a su lugar y el festón se completa a su alrededor.
    for (const element of labels) run(element, { opacity: 0 }, { duration: 0.2, ease: EASE_OUT, delay: HOLD });
    const form = dots.map((dot, slot) => {
      const offset = offsets[slot];
      const delay = HOLD + slot * FORM_STAGGER;
      return offset
        ? run(dot, { transform: [`${offset} scale(${SCATTER_SCALE})`, "translate(0px, 0px) scale(1)"] }, { ...FORM_SPRING, delay })
        : run(dot, { opacity: [0, 1], transform: ["scale(0.4)", "none"] }, { duration: 0.45, ease: EASE_OUT, delay });
    });

    // 3. Con el festón casi cerrado, la ramita se apoya en el centro.
    const stamp = run(
      sprig!,
      { opacity: [0, 1], transform: ["scale(0.9)", "none"] },
      { duration: 0.5, ease: EASE_OUT, delay: HOLD + dots.length * FORM_STAGGER + 0.3 },
    );
    await Promise.all([...form, stamp]);
    for (const controls of running) controls.stop();
    for (const element of [...dots, ...labels, sprig!]) {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    }
    onDone();
  }
  void play();
}

type ConstellationState = {
  /** Sucursales encendidas, o ninguna. */
  lit: ReadonlySet<string> | null;
  /** Con un filtro activo, el resto del sello se apaga. */
  dim: boolean;
  /** La sucursal que muestra la moneda, o ninguna (la ramita). */
  featured: IndexedBranch | null;
};

/**
 * El sello de sucursales en el navegador: la coreografía al entrar en pantalla y, ya formado,
 * los puntos encendidos y la moneda. Con movimiento reducido se muestra formado, sin coreografía.
 */
export function createConstellation(stage: HTMLElement, branches: readonly IndexedBranch[], reduceMotion: boolean) {
  const layout = layoutConstellation({ areas: branches.map((branch) => branch.area), ...CONSTELLATION });
  const dots = [...stage.querySelectorAll<HTMLElement>("[data-dot]")];
  // Qué sucursal ocupa cada punto del festón; el resto completa el dibujo.
  const branchAt = new Array<string | undefined>(layout.ring.length);
  layout.slots.forEach((slot, index) => (branchAt[slot] = branches[index]?.id));
  const order = new Map(branches.map((branch, index) => [branch.id, index]));
  const photos = JSON.parse(stage.dataset.photos ?? "[]") as CoinPhoto[];
  const coin = createCoin(stage, {
    photoOf: (branch) => photos[(order.get(branch.id) ?? 0) % Math.max(photos.length, 1)],
    orderOf: (branch) => order.get(branch.id) ?? 0,
    reduceMotion,
  });

  let formed = false;
  let state: ConstellationState = { lit: null, dim: false, featured: null };

  const paint = () => {
    stage.toggleAttribute("data-formed", formed);
    dots.forEach((dot, slot) => {
      const id = branchAt[slot];
      const on = id !== undefined && state.lit?.has(id) === true;
      dot.toggleAttribute("data-lit", on);
      dot.toggleAttribute("data-dim", state.dim && !on);
      dot.toggleAttribute("data-on", state.featured !== null && id === state.featured.id);
    });
    coin.show(formed ? state.featured : null);
  };

  const form = () => {
    formed = true;
    paint();
  };

  if (reduceMotion) form();
  else {
    const stop = inView(
      stage,
      () => {
        stop();
        choreograph(stage, layout, form);
      },
      { amount: 0.45 },
    );
  }

  // Con mouse, la moneda se inclina hacia el puntero; con el dedo o movimiento reducido, no.
  const tilt = stage.querySelector<HTMLElement>("[data-coin-tilt]");
  stage.addEventListener("pointermove", (event) => {
    if (!tilt || event.pointerType !== "mouse" || reduceMotion) return;
    const box = tilt.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - 0.5) * 2));
    tilt.style.setProperty("--tilt-x", `${(x * TILT).toFixed(2)}deg`);
    tilt.style.setProperty("--tilt-y", `${(-y * TILT).toFixed(2)}deg`);
  });
  stage.addEventListener("pointerleave", () => {
    tilt?.style.removeProperty("--tilt-x");
    tilt?.style.removeProperty("--tilt-y");
  });

  return {
    update(next: ConstellationState) {
      state = next;
      paint();
    },
  };
}
