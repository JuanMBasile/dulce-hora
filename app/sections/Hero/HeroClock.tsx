import { useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { sections } from "~/data/site";
import { useMinute } from "~/lib/clock";
import { deg, useMotionStyle } from "~/lib/motion-style";
import { clockAngles, formatTime, momentForHour, momentPhrases } from "~/lib/moments";
import styles from "./Hero.module.css";

// Las agujas arrancan en las 12 y se acomodan con un resorte, como un reloj que se pone en hora.
const HAND_SPRING = { stiffness: 70, damping: 13, mass: 1 };

export function HeroClock({ className }: { className?: string }) {
  const time = useMinute();
  const reduceMotion = useReducedMotion();
  const hourRotate = useSpring(0, HAND_SPRING);
  const minuteRotate = useSpring(0, HAND_SPRING);
  const hourRef = useRef<HTMLSpanElement>(null);
  const minuteRef = useRef<HTMLSpanElement>(null);
  const hourStyle = useMotionStyle(hourRef, hourRotate, "rotate", deg);
  const minuteStyle = useMotionStyle(minuteRef, minuteRotate, "rotate", deg);

  useEffect(() => {
    if (time === null) return;
    const angles = clockAngles(new Date(time));
    // La aguja siempre avanza: si el minuto vuelve a 0, suma una vuelta en lugar de girar hacia atrás.
    const minuteTarget = angles.minute + Math.floor(minuteRotate.get() / 360) * 360;
    const nextMinute = minuteTarget < minuteRotate.get() ? minuteTarget + 360 : minuteTarget;
    if (reduceMotion) {
      hourRotate.jump(angles.hour);
      minuteRotate.jump(nextMinute);
    } else {
      hourRotate.set(angles.hour);
      minuteRotate.set(nextMinute);
    }
  }, [time, reduceMotion, hourRotate, minuteRotate]);

  if (time === null) return null;

  const date = new Date(time);
  const clock = formatTime(date);
  const article = date.getHours() === 1 ? "Es la" : "Son las";

  return (
    <a href={`#${sections.productos}`} className={`${styles.clockTag} ${className ?? ""}`}>
      <span className={styles.dial} aria-hidden="true">
        <span ref={hourRef} className={`${styles.hand} ${styles.hourHand}`} style={hourStyle} />
        <span ref={minuteRef} className={`${styles.hand} ${styles.minuteHand}`} style={minuteStyle} />
      </span>
      <span className={styles.clockText}>
        <span className={styles.clockTime}>
          {article} {clock}
        </span>
        <span className={styles.clockPhrase}>{momentPhrases[momentForHour(date.getHours())]}</span>
      </span>
    </a>
  );
}
