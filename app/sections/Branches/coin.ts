// La moneda del centro del sello: de un lado la ramita, del otro la foto de la sucursal.
// El marcado se comparte con el HTML estático (BranchConstellation.astro); el giro corre en
// el navegador con Motion.
import { animateMini, spring } from "motion";
import isotype from "~/components/brand/geometry/isotype.json";
import type { IndexedBranch } from "~/lib/branches";
import { escape } from "./board";
import styles from "./BranchCoin.module.css";

/** Parámetros del dibujo del sello: los mismos en el build y en el navegador. */
export const CONSTELLATION = { maxLabels: 7, maxScattered: 36, seed: 11, aspect: 1.3 } as const;

/** Una foto de la moneda, ya recortada en cuadrado por Astro en el build. */
export type CoinPhoto = { avif: string; webp: string; src: string };

type Coin = IndexedBranch | null;

const SIZES = "(min-width: 64rem) 22rem, 55vw";

const faceInner = (branch: Coin, photo?: CoinPhoto) =>
  branch && photo
    ? `<picture class="${styles.picture}"><source type="image/avif" srcset="${photo.avif}" sizes="${SIZES}"><source type="image/webp" srcset="${photo.webp}" sizes="${SIZES}"><img class="${styles.photo}" src="${photo.src}" alt="" width="480" height="480" loading="eager" decoding="async"></picture><span class="${styles.label}" data-coin-label><span class="${styles.area}">${escape(branch.area)}</span><span class="${styles.address}">${escape(branch.address)}</span><span class="${styles.tag}">Foto ilustrativa</span></span>`
    : `<svg data-sprig class="${styles.sprig}" viewBox="20 29 60 44" focusable="false"><path d="${isotype.sprig}"/></svg>`;

/** Una cara completa: la ramita (`branch` nulo) o la foto de la sucursal. */
export const coinFaceHTML = (branch: Coin, back: boolean, photo?: CoinPhoto) =>
  `<div class="${styles.face}"${back ? " data-back" : ""}${branch ? " data-photo" : ""}>${faceInner(branch, photo)}</div>`;

// Media vuelta con un resorte que apenas rebota: se siente una moneda, no un cartel.
const FLIP_SPRING = { type: spring, visualDuration: 0.62, bounce: 0.22 };
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Si la foto tarda, la moneda gira igual: nunca espera más que esto.
const DECODE_WAIT_MS = 700;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type CoinOptions = {
  photoOf: (branch: IndexedBranch) => CoinPhoto | undefined;
  /** Lugar de cada sucursal en el festón: decide hacia qué lado gira. */
  orderOf: (branch: IndexedBranch) => number;
  reduceMotion: boolean;
};

/**
 * Cada cambio es media vuelta hacia el lado en que se mueve la elección. La foto nueva se
 * carga en la cara de atrás y se decodifica antes de girar, así nunca da vuelta a una cara
 * vacía. Si la elección cambia en medio de un giro, al terminar gira otra vez hasta la última.
 */
export function createCoin(root: HTMLElement, { photoOf, orderOf, reduceMotion }: CoinOptions) {
  const body = root.querySelector<HTMLElement>("[data-coin]");
  const lift = root.querySelector<HTMLElement>("[data-coin-lift]");
  const faces = body ? [...body.children].filter((face): face is HTMLElement => face instanceof HTMLElement) : [];
  const shownOn: [Coin, Coin] = [null, null];
  let front: 0 | 1 = 0;
  let angle = 0;
  let busy = false;
  let wanted: Coin = null;

  async function turn() {
    if (!body || !lift || faces.length !== 2) return;
    const shown = shownOn[front];
    if (busy || (wanted?.id ?? null) === (shown?.id ?? null)) return;
    busy = true;
    const next = wanted;
    const to: 0 | 1 = front === 0 ? 1 : 0;
    const face = faces[to]!;
    face.toggleAttribute("data-photo", next !== null);
    face.innerHTML = faceInner(next, next ? photoOf(next) : undefined);
    shownOn[to] = next;

    const image = face.querySelector("img");
    if (image) await Promise.race([image.decode().catch(() => {}), wait(DECODE_WAIT_MS)]);

    const direction = next && shown && orderOf(next) < orderOf(shown) ? -1 : 1;
    const target = angle + 180 * direction;
    const label = face.querySelector<HTMLElement>("[data-coin-label]");
    if (reduceMotion) {
      // Sin giro: la cara nueva aparece con un fundido corto.
      await animateMini(body, { opacity: [1, 0] }, { duration: 0.12 });
      body.style.transform = `rotateY(${target}deg)`;
      await animateMini(body, { opacity: [0, 1] }, { duration: 0.16 });
    } else {
      // La moneda se levanta un poco mientras gira; el cartel sube cuando la cara ya está casi de frente.
      animateMini(lift, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.6, ease: EASE_OUT });
      if (label) {
        animateMini(
          label,
          { opacity: [0, 1], transform: ["translateY(0.6rem)", "none"] },
          { duration: 0.4, ease: EASE_OUT, delay: 0.32 },
        );
      }
      await animateMini(body, { transform: [`rotateY(${angle}deg)`, `rotateY(${target}deg)`] }, FLIP_SPRING);
      body.style.transform = `rotateY(${target}deg)`;
    }
    angle = target;
    front = to;
    busy = false;
    void turn();
  }

  return {
    show(branch: Coin) {
      wanted = branch;
      void turn();
    },
  };
}
