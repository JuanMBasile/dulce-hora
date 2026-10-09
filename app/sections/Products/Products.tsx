import { useInView, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Picture as ImagePicture } from "vite-imagetools";
import miniRogel from "~/assets/photos/mini-rogel.jpg?preset=plate";
import surtido from "~/assets/photos/surtido-pasteleria.jpg?preset=plate";
import tarta from "~/assets/photos/tarta.jpg?preset=plate";
import trenzas from "~/assets/photos/trenzas.jpg?preset=plate";
import { ButtonLink } from "~/components/ButtonLink/ButtonLink";
import { Picture } from "~/components/Picture/Picture";
import { moments, type Moment } from "~/data/products";
import { primaryCta, sections } from "~/data/site";
import { useHydrated, useMinute } from "~/lib/clock";
import { dayAngle, momentForHour, nearestTurn, type MomentId } from "~/lib/moments";
import { deg, useMotionStyle } from "~/lib/motion-style";
import styles from "./Products.module.css";

const PHOTOS: Record<Moment["photo"], ImagePicture> = {
  trenzas,
  tarta,
  "surtido-pasteleria": surtido,
  "mini-rogel": miniRogel,
};

// La foto ocupa el 73 % del dial (ver .plates en el CSS).
const PLATE_SIZES = "(min-width: 64rem) 20rem, (min-width: 48rem) 14rem, 72vw";

/* ---------- Geometría del dial (viewBox 400 × 400, centro en 200) ---------- */
const point = (radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return `${(200 + radius * Math.sin(radians)).toFixed(1)} ${(200 - radius * Math.cos(radians)).toFixed(1)}`;
};

// Festón de 12 ondas, el borde del sello en versión fina (una blonda): cada onda abarca
// dos horas del día. Valles a r = 188 y crestas a r = 200.
const FESTOON = `M${point(188, -15)}${Array.from({ length: 12 }, (_, i) => `A73.5 73.5 0 0 1 ${point(188, i * 30 + 15)}`).join("")}Z`;

// Una marca por hora; las de las 0, 6, 12 y 18 h son más largas.
const ticks = (major: boolean) =>
  Array.from({ length: 24 }, (_, hour) => hour)
    .filter((hour) => (hour % 6 === 0) === major)
    .map((hour) => `M${point(major ? 150 : 155, hour * 15)}L${point(162, hour * 15)}`)
    .join("");
const TICKS_MINOR = ticks(false);
const TICKS_MAJOR = ticks(true);

// La aguja se acomoda con un resorte firme: llega rápido y apenas se pasa.
const BEAD_SPRING = { stiffness: 110, damping: 17, mass: 1 };

const KEY_STEP: Partial<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Pinta en Rojo la última palabra, como HORA en el sello. */
function AccentLast({ text }: { text: string }) {
  const cut = text.lastIndexOf(" ") + 1;
  return (
    <>
      {text.slice(0, cut)}
      <span className={styles.accent}>{text.slice(cut)}</span>
    </>
  );
}

/**
 * "Un día en Dulce Hora": un dial de 24 h con el mediodía arriba. Cada momento es una
 * pestaña ubicada en su hora; la aguja (una perla de azúcar) recorre el festón y la foto
 * gira como un plato al cambiar. Sin JavaScript, el dial se oculta y los cuatro
 * momentos quedan apilados y completos.
 */
export function Products() {
  const hydrated = useHydrated();
  const now = useMinute();
  const nowMoment = now === null ? null : momentForHour(new Date(now).getHours());
  const [selected, setSelected] = useState<MomentId | null>(null);
  const activeId = selected ?? nowMoment ?? "manana";
  const active = moments.find((moment) => moment.id === activeId) ?? moments[0]!;

  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(stageRef, { once: true, amount: 0.45 });

  // El festón gira despacio mientras el dial atraviesa la pantalla.
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start end", "end start"] });
  const ringRotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-40, 40]);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringStyle = useMotionStyle(ringRef, ringRotate, "rotate", deg);

  // La aguja arranca una vuelta atrás (mismo lugar a la vista): al entrar en pantalla
  // recorre el día completo hasta el momento activo. Después, toma el camino corto.
  const activeAngle = dayAngle(active.hour);
  const bead = useSpring(activeAngle - 360, BEAD_SPRING);
  const wound = useRef(false);
  const orbitRef = useRef<HTMLDivElement>(null);
  const orbitStyle = useMotionStyle(orbitRef, bead, "rotate", deg);

  useEffect(() => {
    if (!inView) {
      bead.jump(activeAngle - 360);
      return;
    }
    const target = wound.current ? nearestTurn(bead.get(), activeAngle) : activeAngle;
    wound.current = true;
    if (reduceMotion) bead.jump(target);
    else bead.set(target);
  }, [activeAngle, inView, reduceMotion, bead]);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = KEY_STEP[event.key];
    let next: number;
    if (step !== undefined) next = (index + step + moments.length) % moments.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = moments.length - 1;
    else return;

    event.preventDefault();
    const moment = moments[next];
    if (!moment) return;
    setSelected(moment.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id={sections.productos} tabIndex={-1} className={styles.section} aria-labelledby="productos-titulo">
      <div className={`page-width ${styles.layout}`}>
        <header className={styles.header}>
          <h2 id="productos-titulo" className={styles.title}>
            Un día en Dulce <span className={styles.accent}>Hora</span>
          </h2>
          <p className={styles.intro}>
            De la medialuna de la mañana a la torta del festejo: panadería, pastelería y salados elaborados cada día.
          </p>
        </header>

        <div ref={stageRef} className={styles.stage}>
          <div className={styles.dial}>
            <div ref={ringRef} className={styles.ring} style={ringStyle} aria-hidden="true">
              <svg viewBox="0 0 400 400" focusable="false">
                <path className={styles.festoon} d={FESTOON} />
                <circle className={styles.disc} cx="200" cy="200" r="170" />
              </svg>
            </div>
            <svg className={styles.ticks} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
              <path className={styles.tickMinor} d={TICKS_MINOR} />
              <path className={styles.tickMajor} d={TICKS_MAJOR} />
            </svg>

            <div className={styles.plates}>
              {moments.map((moment) => (
                <div key={moment.id} className={styles.plate} data-active={moment.id === active.id || undefined}>
                  <Picture
                    picture={PHOTOS[moment.photo]}
                    alt={moment.photoAlt}
                    sizes={PLATE_SIZES}
                    className={styles.platePicture}
                    imgClassName={styles.plateImg}
                  />
                </div>
              ))}
            </div>

            <div ref={orbitRef} className={styles.orbit} style={orbitStyle} aria-hidden="true">
              <span className={styles.bead} />
            </div>
          </div>

          <div className={styles.tabs} role={hydrated ? "tablist" : undefined} aria-label="Momentos del día">
            {moments.map((moment, index) => {
              const isActive = moment.id === active.id;
              return (
                <button
                  key={moment.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  id={`${moment.id}-tab`}
                  className={styles.tab}
                  style={{ "--a": `${dayAngle(moment.hour)}deg` } as CSSProperties}
                  data-active={isActive || undefined}
                  onClick={() => setSelected(moment.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  {...(hydrated
                    ? {
                        role: "tab",
                        "aria-selected": isActive,
                        "aria-controls": `momento-${moment.id}`,
                        tabIndex: isActive ? 0 : -1,
                      }
                    : {})}
                >
                  {moment.label}
                  {moment.id === nowMoment ? <span className={styles.now}>ahora</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.panels}>
          {moments.map((moment) => {
            const isActive = moment.id === active.id;
            const titleId = `momento-${moment.id}-titulo`;
            return (
              <section
                key={moment.id}
                id={`momento-${moment.id}`}
                className={styles.panel}
                data-active={isActive || undefined}
                role={hydrated ? "tabpanel" : undefined}
                aria-labelledby={hydrated ? `${moment.id}-tab` : titleId}
                tabIndex={hydrated && isActive ? 0 : undefined}
              >
                <h3 id={titleId} className={styles.panelTitle}>
                  <span className={styles.titleMask}>
                    <span className={styles.titleInner}>
                      <AccentLast text={moment.heading} />
                    </span>
                  </span>
                </h3>
                <div className={styles.menu}>
                  {moment.categories.map((category, index) => (
                    <div key={category.name} className={styles.category} style={{ "--i": index } as CSSProperties}>
                      <h4 className={styles.categoryName}>{category.name}</h4>
                      <ul role="list" className={styles.items}>
                        {category.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className={styles.where}>
          <span className={styles.whereText}>¿Se te antojó algo?</span>
          <ButtonLink href={primaryCta.href} variant="secondary">
            {primaryCta.label}
          </ButtonLink>
        </p>
      </div>
    </section>
  );
}
