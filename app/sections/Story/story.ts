import { gsap, reduceMotion } from "~/scripts/gsap";

// Un poco de arrastre sobre el scroll: la escena acompaña con algo de peso, sin quedarse atrás.
const SCRUB = 0.5;

/** Escribe en el escenario las variables que mueven la escena de "Nuestra historia". */
export function initStory() {
  const scene = document.querySelector<HTMLElement>("[data-story-scene]");
  const stage = scene?.querySelector<HTMLElement>("[data-story-stage]");
  if (!scene || !stage || reduceMotion()) return;

  const state = { arrive: 0, open: 0, veil: 0, read: 0 };
  const write = () => {
    stage.style.setProperty("--open", state.open.toFixed(4));
    stage.style.setProperty("--veil", state.veil.toFixed(4));
    stage.style.setProperty("--read", state.read.toFixed(4));
    // Casi media vuelta: un poco al llegar y el resto mientras se abre, hasta quedar derecho.
    stage.style.setProperty("--turn", `${(-150 + 40 * state.arrive + 110 * state.open).toFixed(2)}deg`);
  };

  // Llegada: mientras la escena sube hasta fijarse, el festón ya viene girando.
  gsap.to(state, {
    arrive: 1,
    ease: "none",
    onUpdate: write,
    scrollTrigger: { trigger: scene, start: "top bottom", end: "top top", scrub: SCRUB },
  });

  // Guion de la escena fija: se abre (0,03–0,55), se vela la foto (0,38–0,56), se lee el
  // manifiesto (0,50–0,92) y queda quieta hasta soltarse.
  gsap
    .timeline({
      onUpdate: write,
      scrollTrigger: { trigger: scene, start: "top top", end: "bottom bottom", scrub: SCRUB },
    })
    .to(state, { open: 1, ease: "power1.inOut", duration: 0.52 }, 0.03)
    .to(state, { veil: 1, ease: "none", duration: 0.18 }, 0.38)
    .to(state, { read: 1, ease: "none", duration: 0.42 }, 0.5)
    .set({}, {}, 1);
}
