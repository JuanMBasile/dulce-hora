import { useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type CSSProperties } from "react";
import facturas from "~/assets/photos/facturas-cenital.jpg?preset=hero";
import { Seal } from "~/components/brand/Seal";
import { ButtonLink } from "~/components/ButtonLink/ButtonLink";
import { Picture } from "~/components/Picture/Picture";
import { heroCopy, primaryCta, sections, site } from "~/data/site";
import { deg, useMotionStyle } from "~/lib/motion-style";
import { HeroClock } from "./HeroClock";
import styles from "./Hero.module.css";

// Palabras del título que van en Rojo, como HORA en el sello.
const ACCENT_WORDS = new Set(["hora"]);

/** El título sube palabra por palabra (CSS puro: corre antes de hidratar). */
function RisingTitle({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, index) => (
    <span key={index}>
      <span className={styles.word}>
        <span
          className={styles.wordInner}
          data-accent={ACCENT_WORDS.has(word.toLowerCase()) || undefined}
          style={{ "--i": index } as CSSProperties}
        >
          {word}
        </span>
      </span>
      {index < words.length - 1 ? " " : null}
    </span>
  ));
}

/**
 * "Abrimos": la foto se asienta, el título sube, el sello se estampa sobre la costura
 * y su arco se dibuja como una aguja. La entrada es CSS; Motion solo suma el scroll
 * (el sello gira como un reloj y la foto se desplaza más lento que la página).
 */
export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const sealRotate = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 150]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 16]);
  const sealRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const sealStyle = useMotionStyle(sealRef, sealRotate, "rotate", deg);
  const photoStyle = useMotionStyle(photoRef, photoY, "translate", (y) => `0 ${y}%`);

  return (
    <section ref={heroRef} id={sections.inicio} className={styles.hero} aria-labelledby="inicio-titulo">
      <div className={styles.copy}>
        <h1 id="inicio-titulo" className={styles.title}>
          <RisingTitle text={heroCopy.title} />
        </h1>
        <p className={styles.lead}>{heroCopy.lead}</p>
        <div className={styles.actions}>
          <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
          <ButtonLink href={`#${sections.productos}`} variant="secondary">
            Ver productos
          </ButtonLink>
        </div>
        <p className={styles.reach}>{site.reach}</p>
      </div>

      <div className={styles.visual}>
        <div className={styles.photoFrame}>
          <div ref={photoRef} className={styles.photoTrack} style={photoStyle}>
            <Picture
              picture={facturas}
              alt="Medialunas y facturas con crema pastelera, dulce de leche y membrillo, servidas en platos sobre una mesa de madera."
              sizes="(min-width: 64rem) 52vw, 100vw"
              className={styles.photo}
              imgClassName={styles.photoImg}
              priority
            />
          </div>
        </div>

        <div className={styles.stamp}>
          <div ref={sealRef} className={styles.stampTurn} style={sealStyle}>
            <Seal className={styles.seal} arcClassName={styles.arc} />
          </div>
        </div>

        <HeroClock className={styles.clock} />
      </div>
    </section>
  );
}
