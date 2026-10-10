import { gsap, reduceMotion, ScrollTrigger } from "~/scripts/gsap";

// En reposo recorre una copia de la lista (media pista) cada 55 s.
const BASE_SPEED = 50 / 55; // % de la pista por segundo
// El scroll suma hasta 6 veces esa velocidad y la inclina hasta 7°.
const MAX_BOOST = 6;
const MAX_TILT = 7;
const VELOCITY_RANGE = 2600; // px/s
// Suavizado por segundo: la velocidad y el freno siguen al scroll con algo de peso.
const FOLLOW = 8;
const CRUISE_FOLLOW = 5;

const wrap = gsap.utils.wrap(-50, 0);
const clampUnit = gsap.utils.clamp(-1, 1);

export function initMarquee() {
  const band = document.querySelector<HTMLElement>("[data-marquee]");
  const track = band?.querySelector<HTMLElement>("[data-marquee-track]");
  if (!band || !track || reduceMotion()) return;

  let offset = 0;
  let direction = -1;
  let velocity = 0; // suavizada, en -1…1
  let cruise = 1; // 1 en reposo, 0 con el cursor encima
  let cruiseTarget = 1;
  let running = false;

  const scroll = ScrollTrigger.create({ start: 0, end: "max" });

  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    const target = clampUnit(scroll.getVelocity() / VELOCITY_RANGE);
    velocity += (target - velocity) * Math.min(1, FOLLOW * dt);
    cruise += (cruiseTarget - cruise) * Math.min(1, CRUISE_FOLLOW * dt);
    const push = velocity * MAX_BOOST;
    if (push > 0.05) direction = -1;
    else if (push < -0.05) direction = 1;
    const speed = BASE_SPEED * (cruise + Math.abs(push));
    offset = wrap(offset + direction * speed * dt);
    track.style.translate = `${offset.toFixed(3)}% 0`;
    // Se inclina hacia atrás, como si el envión la arrastrara.
    track.style.transform = `skewX(${(-velocity * MAX_TILT).toFixed(2)}deg)`;
  };

  // El loop corre solo mientras la banda está en pantalla.
  new IntersectionObserver(([entry]) => {
    const visible = entry?.isIntersecting ?? false;
    if (visible === running) return;
    running = visible;
    if (visible) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  }).observe(band);

  band.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") cruiseTarget = 0;
  });
  band.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") cruiseTarget = 1;
  });
}
