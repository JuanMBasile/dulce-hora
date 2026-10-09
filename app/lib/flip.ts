// FLIP (First, Last, Invert, Play) para listas que cambian al filtrar: cada elemento
// marcado con `data-flip` sale de donde se veía y se desliza hasta su lugar nuevo; los que
// aparecen suben con un fundido. Usa la Web Animations API sobre `transform`, así que se
// combina con las animaciones de CSS que usan `translate` u `opacity`.

export type FlipSnapshot = {
  rects: Map<string, DOMRect>;
  height: number;
};

const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const MOVE_MS = 560;
const ENTER_MS = 420;
const STAGGER_MS = 28;
const MAX_STAGGER = 8;
const ANIMATION_ID = "flip";

const items = (container: HTMLElement) => container.querySelectorAll<HTMLElement>("[data-flip]");

/** First: dónde se ve cada elemento ahora mismo, con las animaciones en curso incluidas. */
export function captureFlip(container: HTMLElement): FlipSnapshot {
  const rects = new Map<string, DOMRect>();
  for (const element of items(container)) rects.set(element.dataset.flip!, element.getBoundingClientRect());
  return { rects, height: container.getBoundingClientRect().height };
}

const nearViewport = (rect: DOMRect) => rect.bottom > -200 && rect.top < window.innerHeight + 200;

/** Last, Invert, Play: se llama después de que React actualizó el DOM. */
export function playFlip(container: HTMLElement, snapshot: FlipSnapshot) {
  const elements = [...items(container)];
  // Sin las animaciones anteriores, cada rect es la posición final real.
  for (const target of [container, ...elements]) {
    for (const animation of target.getAnimations()) if (animation.id === ANIMATION_ID) animation.cancel();
  }

  // El contenedor acompaña el cambio de alto, para que la lista no salte de golpe.
  // Mientras tanto recorta lo que asoma: lo que sale de la lista desaparece debajo del borde.
  const height = container.getBoundingClientRect().height;
  if (Math.abs(height - snapshot.height) > 1) {
    const resize = container.animate([{ height: `${snapshot.height}px` }, { height: `${height}px` }], {
      duration: MOVE_MS,
      easing: EASE_OUT_EXPO,
      id: ANIMATION_ID,
    });
    container.style.overflow = "clip";
    const release = () => {
      const running = container.getAnimations().some((animation) => animation.id === ANIMATION_ID);
      if (!running) container.style.removeProperty("overflow");
    };
    resize.finished.then(release, release);
  }

  let entering = 0;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    const before = snapshot.rects.get(element.dataset.flip!);
    if (before) {
      const dx = before.left - rect.left;
      const dy = before.top - rect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      if (!nearViewport(before) && !nearViewport(rect)) continue;
      element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
        duration: MOVE_MS,
        easing: EASE_OUT_EXPO,
        id: ANIMATION_ID,
      });
    } else if (nearViewport(rect)) {
      element.animate(
        [
          { opacity: 0, transform: "translateY(0.75rem)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: ENTER_MS,
          delay: Math.min(entering++, MAX_STAGGER) * STAGGER_MS,
          easing: EASE_OUT_EXPO,
          fill: "backwards",
          id: ANIMATION_ID,
        },
      );
    }
  }
}
