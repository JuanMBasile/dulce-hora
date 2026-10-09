import { animateMini, spring } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import isotype from "~/components/brand/geometry/isotype.json";
import { Picture } from "~/components/Picture/Picture";
import type { IndexedBranch } from "~/lib/branches";
import styles from "./BranchCoin.module.css";
import { standInPhoto } from "./standInPhotos";

// Media vuelta con un resorte que apenas rebota: se siente una moneda, no un cartel.
const FLIP_SPRING = { type: spring, visualDuration: 0.62, bounce: 0.22 };
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Si la foto tarda, la moneda gira igual: nunca se queda esperando más que esto.
const DECODE_WAIT_MS = 700;

type Coin = IndexedBranch | null;
type Turn = { to: 0 | 1; from: number; direction: 1 | -1 };
type CoinState = { faces: [Coin, Coin]; front: 0 | 1; angle: number; turn: Turn | null };

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Una cara de la moneda: la ramita del sello o la foto de la sucursal. */
function Face({ branch, order, back, faceRef }: { branch: Coin; order: number; back: boolean; faceRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={faceRef} className={styles.face} data-back={back || undefined} data-photo={branch ? "" : undefined}>
      {branch ? (
        <>
          <Picture
            picture={standInPhoto(order)}
            alt=""
            sizes="(min-width: 64rem) 22rem, 55vw"
            className={styles.picture}
            imgClassName={styles.photo}
            eager
          />
          <span className={styles.label} data-coin-label="">
            <span className={styles.area}>{branch.area}</span>
            <span className={styles.address}>{branch.address}</span>
            <span className={styles.tag}>Foto ilustrativa</span>
          </span>
        </>
      ) : (
        <svg data-sprig="" className={styles.sprig} viewBox="20 29 60 44" focusable="false">
          <path d={isotype.sprig} />
        </svg>
      )}
    </div>
  );
}

type BranchCoinProps = {
  /** La sucursal que se muestra, o ninguna (la ramita). */
  branch: Coin;
  /** Lugar de cada sucursal en el festón: decide hacia qué lado gira. */
  orderOf: (branch: IndexedBranch) => number;
  reduceMotion: boolean;
};

/**
 * El centro del sello es una moneda: de un lado la ramita, del otro la foto de la sucursal.
 * Cada cambio es media vuelta hacia el lado en que se mueve la elección (hacia adelante o
 * hacia atrás en el listado). La foto nueva se carga en la cara de atrás y se decodifica
 * antes de girar, así nunca da vuelta a una cara vacía. Si la elección cambia en medio de
 * un giro, al terminar gira otra vez hasta la última.
 */
export function BranchCoin({ branch, orderOf, reduceMotion }: BranchCoinProps) {
  const liftRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const faceRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;
  const [coin, setCoin] = useState<CoinState>({ faces: [null, null], front: 0, angle: 0, turn: null });

  // Lo que se quiere mostrar no es lo que está adelante: la cara de atrás recibe la sucursal
  // nueva y se pide media vuelta. Mientras gira no se pide otra; al terminar se vuelve a
  // comparar, así una elección que cambió en medio del giro también llega.
  const shown = coin.faces[coin.front];
  if (!coin.turn && (branch?.id ?? null) !== (shown?.id ?? null)) {
    const to = coin.front === 0 ? 1 : 0;
    const faces: [Coin, Coin] = [coin.faces[0], coin.faces[1]];
    faces[to] = branch;
    const direction = branch && shown && orderOf(branch) < orderOf(shown) ? -1 : 1;
    setCoin({ ...coin, faces, turn: { to, from: coin.angle, direction } });
  }

  const { turn } = coin;
  useEffect(() => {
    if (!turn) return;
    const body = bodyRef.current;
    const lift = liftRef.current;
    const face = faceRefs[turn.to].current;
    if (!body || !lift || !face) return;
    let cancelled = false;

    async function play(body: HTMLElement, lift: HTMLElement, face: HTMLElement, { to, from, direction }: Turn) {
      const image = face.querySelector("img");
      if (image) await Promise.race([image.decode().catch(() => {}), wait(DECODE_WAIT_MS)]);
      if (cancelled) return;

      const target = from + 180 * direction;
      const label = face.querySelector<HTMLElement>("[data-coin-label]");
      if (reduceMotion) {
        // Sin giro: la cara nueva aparece con un fundido corto.
        await animateMini(body, { opacity: [1, 0] }, { duration: 0.12 });
        body.style.transform = `rotateY(${target}deg)`;
        await animateMini(body, { opacity: [0, 1] }, { duration: 0.16 });
      } else {
        // La moneda se levanta un poco mientras gira y se vuelve a apoyar; el cartel de la
        // foto sube cuando la cara ya está casi de frente.
        animateMini(lift, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.6, ease: EASE_OUT });
        if (label) {
          animateMini(
            label,
            { opacity: [0, 1], transform: ["translateY(0.6rem)", "none"] },
            { duration: 0.4, ease: EASE_OUT, delay: 0.32 },
          );
        }
        await animateMini(body, { transform: [`rotateY(${from}deg)`, `rotateY(${target}deg)`] }, FLIP_SPRING);
        body.style.transform = `rotateY(${target}deg)`;
      }
      if (cancelled) return;
      setCoin((state) => ({ ...state, front: to, angle: target, turn: null }));
    }

    void play(body, lift, face, turn);
    return () => {
      cancelled = true;
    };
    // faceRefs son refs: no cambian entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, reduceMotion]);

  return (
    <div className={styles.coin} aria-hidden="true">
      <div ref={liftRef} className={styles.lift}>
        <div className={styles.tilt} data-coin-tilt="">
          <div ref={bodyRef} className={styles.body} data-coin="">
            {coin.faces.map((face, index) => (
              <Face
                key={index}
                branch={face}
                order={face ? orderOf(face) : 0}
                back={index === 1}
                faceRef={faceRefs[index]!}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
