import { easeInOut, useScroll, useSpring, useTransform } from "motion/react";
import { Fragment, useRef, type CSSProperties } from "react";
import medialunas from "~/assets/photos/medialunas-manteca.jpg?preset=scene";
import { Picture } from "~/components/Picture/Picture";
import { sections } from "~/data/site";
import { story } from "~/data/story";
import { festoonPolygon } from "~/lib/festoon";
import { deg, num, useMotionStyle } from "~/lib/motion-style";
import styles from "./Story.module.css";

// El mismo polígono sirve para el borde rojo y para la ventana: cada uno define su `--r`.
const FESTOON_STYLE = { "--festoon": festoonPolygon() } as CSSProperties;

// Quieta (sin JS o con movimiento reducido) la foto es un sello de 30rem; en la escena, la pantalla entera.
const PHOTO_SIZES = "(scripting: none) min(90vw, 30rem), (prefers-reduced-motion: reduce) min(90vw, 30rem), 100vw";

// Resorte corto sobre el scroll: la escena acompaña con algo de peso, sin quedarse atrás.
const SCROLL_SPRING = {
  stiffness: 300,
  damping: 35,
  mass: 0.5,
  restDelta: 0.0005,
};

const WORDS = story.manifesto.split(" ");
const ACCENTS = new Set<string>(story.manifestoAccents);
const bare = (word: string) => word.replace(/[.,;:]/g, "");

/** Pinta "hora" en Rojo, como en el sello. */
function AccentHora({ text }: { text: string }) {
  const [before, after] = text.split(" hora ");
  return (
    <>
      {before} <span className={styles.accent}>hora</span> {after}
    </>
  );
}

/**
 * "Nuestra historia": la escena queda fija mientras se scrollea. El festón del sello gira
 * como un reloj y se abre hasta mostrar la foto entera; el título se corre como un telón
 * y el manifiesto se enciende palabra por palabra. Motion calcula el scroll (con resorte)
 * y escribe cuatro variables en el escenario; el CSS decide qué mueve cada una.
 * Sin JavaScript o con movimiento reducido, la misma composición queda quieta y completa.
 */
export function Story() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Llegada: mientras la escena sube hasta fijarse, el festón ya viene girando.
  const { scrollYProgress: arrival } = useScroll({
    target: sceneRef,
    offset: ["start end", "start start"],
  });
  // Escena fija: desde que se fija hasta que se suelta.
  const { scrollYProgress: pinned } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });
  const arrive = useSpring(arrival, SCROLL_SPRING);
  const progress = useSpring(pinned, SCROLL_SPRING);

  // Guion de la escena fija: se abre (0,03–0,55), se vela la foto (0,38–0,56),
  // se lee el manifiesto (0,50–0,92) y queda quieta hasta soltarse.
  const open = useTransform(progress, [0.03, 0.55], [0, 1], {
    ease: easeInOut,
  });
  const veil = useTransform(progress, [0.38, 0.56], [0, 1]);
  const read = useTransform(progress, [0.5, 0.92], [0, 1]);
  // Casi media vuelta: un poco al llegar y el resto mientras se abre, hasta quedar derecho.
  const turn = useTransform(() => -150 + 40 * arrive.get() + 110 * open.get());

  const stageStyle = {
    ...useMotionStyle(stageRef, open, "--open", num),
    ...useMotionStyle(stageRef, veil, "--veil", num),
    ...useMotionStyle(stageRef, read, "--read", num),
    ...useMotionStyle(stageRef, turn, "--turn", (angle) => deg(Math.round(angle * 100) / 100)),
  };

  return (
    <section id={sections.historia} tabIndex={-1} className={styles.section} aria-labelledby="historia-titulo">
      <div ref={sceneRef} className={styles.scene}>
        <div ref={stageRef} className={styles.stage} style={stageStyle}>
          <h2 id="historia-titulo" className={styles.title}>
            <span className={styles.titleWord} data-side="start">
              Nuestra
            </span>{" "}
            <span className={`${styles.titleWord} ${styles.accent}`} data-side="end">
              historia
            </span>
          </h2>

          <div className={styles.art}>
            <div className={styles.rim} style={FESTOON_STYLE} />
            <div className={styles.window} style={FESTOON_STYLE}>
              <div className={styles.photo}>
                <Picture
                  picture={medialunas}
                  alt="Medialunas de manteca doradas y brillantes, acomodadas en una bandeja."
                  sizes={PHOTO_SIZES}
                  className={styles.picture}
                  imgClassName={styles.img}
                />
                <div className={styles.veil} />
              </div>
            </div>
          </div>

          <div className={styles.reading}>
            <p className={styles.manifesto} style={{ "--n": WORDS.length } as CSSProperties}>
              {WORDS.map((word, index) => (
                <Fragment key={index}>
                  <span
                    className={styles.word}
                    data-accent={ACCENTS.has(bare(word)) || undefined}
                    style={{ "--i": index } as CSSProperties}
                  >
                    {word}
                  </span>
                  {index < WORDS.length - 1 ? " " : null}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>

      <div className={`festoon-top ${styles.body}`}>
        <div className={`page-width ${styles.bodyInner}`}>
          <div className={styles.origin}>
            <h3 className={styles.originTitle}>{story.originTitle}</h3>
            <p className={styles.originText}>{story.origin}</p>
          </div>

          <div className={styles.values}>
            <h3 className={styles.valuesTitle}>{story.valuesTitle}</h3>
            <ul role="list" className={styles.valueList}>
              {story.values.map((value) => (
                <li key={value.name} className={styles.value}>
                  <h4 className={styles.valueName}>
                    <span className={styles.valueNameInner}>{value.name}</span>
                  </h4>
                  <p className={styles.valueText}>{value.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.closing}>
            <AccentHora text={story.closing} />
          </p>
        </div>
      </div>
    </section>
  );
}
