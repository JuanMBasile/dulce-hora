import { everyMinute } from "~/lib/clock";
import { clockAngles, formatTime, momentForHour, momentPhrases } from "~/lib/moments";
import { gsap, reduceMotion, ScrollTrigger } from "~/scripts/gsap";

type Key = { y: number; v: number };

// Interpola un valor por tramos según la posición de scroll.
const piecewise = (y: number, keys: Key[]) => {
  const first = keys[0];
  if (!first) return 0;
  if (y <= first.y) return first.v;
  for (let index = 1; index < keys.length; index++) {
    const a = keys[index - 1]!;
    const b = keys[index]!;
    if (y <= b.y) return a.v + (b.v - a.v) * ((y - a.y) / (b.y - a.y || 1));
  }
  return keys[keys.length - 1]!.v;
};

const clamp = gsap.utils.clamp(0, 1);

/**
 * El paseo (adaptado del "scroll world" de la referencia): `w` es la posición en el día, 0 en
 * la entrada, 1 en la mañana, 1,5 a mitad de camino hacia el mediodía. Cada foto aparece en la
 * segunda mitad del tramo anterior y se acerca mientras se avanza, como una cámara que entra;
 * si una parada tiene clip, se scrubea encima y la foto queda de póster.
 */
export function initPaseo() {
  const world = document.querySelector<HTMLElement>("[data-world]");
  const stage = world?.querySelector<HTMLElement>("[data-stage]");
  if (!world || !stage) return;
  const reduce = reduceMotion();
  const stops = [...world.querySelectorAll<HTMLElement>("[data-stop]")];
  const frames = [...stage.querySelectorAll<HTMLElement>("[data-frame]")];
  const links = [...stage.querySelectorAll<HTMLAnchorElement>("[data-goto]")];
  const fill = stage.querySelector<HTMLElement>("[data-rail-fill]");
  const hint = stage.querySelector<HTMLElement>("[data-hint]");
  const seal = stage.querySelector<HTMLElement>("[data-day-seal]");
  const clips = [...stage.querySelectorAll<HTMLVideoElement>("[data-clip]")];
  const last = stops.length - 1;
  const focus = stops.map((stop) => Number(stop.dataset.focus ?? 50));

  // Cada parada llega cuando su artículo toca el borde superior; el paseo termina al acabar la sección.
  const marks = stops.map((stop) => ScrollTrigger.create({ trigger: stop, start: "top top" }));
  const ready = clips.map(() => false);
  let current = -1;
  let w = 0;
  let active = 0;
  let shown = -1;
  let time = 0;

  const setCurrent = (index: number) => {
    if (index === current) return;
    current = index;
    stops.forEach((stop, i) => stop.toggleAttribute("data-current", i === index));
    links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  // Clips (scroll-world): el del tramo entra en cuanto busca su fotograma; si no cargó, se ven las fotos.
  const usable = clips.map((clip) => Boolean(clip.dataset.src));
  const show = () => {
    if (shown !== active) {
      shown = active;
      clips.forEach((clip, i) => clip.toggleAttribute("data-shown", i === active));
    }
    stage.dataset.mode = "video";
  };
  const sync = () => {
    const clip = clips[active];
    if (!clip || !ready[active]) {
      delete stage.dataset.mode;
      return;
    }
    if (clip.seeking) return;
    if (Math.abs(clip.currentTime - time) > 0.01) clip.currentTime = time;
    else show();
  };
  clips.forEach((clip, i) =>
    clip.addEventListener("seeked", () => {
      if (i !== active) return;
      show();
      sync();
    }),
  );

  const render = (self: ScrollTrigger) => {
    const y = self.scroll();
    w = piecewise(y, [...marks.map((mark, i) => ({ y: mark.start, v: i })), { y: self.end, v: stops.length }]);
    const at = Math.min(w, last);

    setCurrent(Math.round(at));
    stage.style.setProperty("--focus-x", `${piecewise(y, marks.map((mark, i) => ({ y: mark.start, v: focus[i] ?? 50 })))}%`);
    if (fill) fill.style.transform = `scaleY(${at / last})`;
    if (hint) hint.style.opacity = String(clamp(1 - w * 4));
    // El sello gira con el día, como la aguja de un reloj.
    if (seal && !reduce) seal.style.rotate = `${(at / last) * 300}deg`;

    frames.forEach((frame, i) => {
      frame.style.opacity = String(i === 0 ? 1 : clamp((w - i + 0.5) / 0.5));
      if (!reduce) frame.style.transform = `scale(${1 + 0.08 * clamp(w - i + 0.5)})`;
    });

    if (!clips.length) return;
    active = Math.min(clips.length - 1, Math.floor(w));
    const clip = clips[active];
    if (clip && ready[active]) time = Math.min((w - active) * clip.duration, clip.duration - 0.05);
    sync();
  };

  const span = ScrollTrigger.create({
    trigger: world,
    start: "top top",
    end: "bottom bottom",
    onUpdate: render,
    onRefresh: render,
  });
  render(span);

  startClock(stage);

  // Con movimiento reducido o ahorro de datos, se quedan las fotos.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (!usable.some(Boolean) || reduce || saveData) return;

  // Los clips se cargan de a uno: primero el del tramo actual y después el más cercano.
  const distance = (i: number) => {
    if (i === active) return -1;
    if (i > w) return i - w;
    return w - (i + 1) + 0.5;
  };
  const queue = clips.map((_, i) => i).filter((i) => usable[i]);
  const loadNext = async () => {
    queue.sort((a, b) => distance(a) - distance(b));
    const i = queue.shift();
    if (i === undefined) return;
    const clip = clips[i]!;
    const src = clip.dataset.src ?? "";
    clip.preload = "auto";
    // Cada clip se baja entero (blob): el scrub no depende de la red ni de los byte ranges.
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(response.statusText);
      clip.src = URL.createObjectURL(await response.blob());
    } catch {
      clip.src = src;
    }
    const loaded = await new Promise<boolean>((resolve) => {
      clip.addEventListener("loadeddata", () => resolve(true), { once: true });
      clip.addEventListener("error", () => resolve(false), { once: true });
    });
    if (loaded) {
      // iOS no pinta los fotogramas buscados hasta que el video se reprodujo una vez.
      await clip.play().catch(() => {});
      clip.pause();
      ready[i] = true;
      render(span);
    }
    void loadNext();
  };
  if (document.readyState === "complete") void loadNext();
  else window.addEventListener("load", () => void loadNext(), { once: true });
}

/** "Son las 21:40 · Buena hora para algo dulce", con un reloj de agujas y la parada de ese momento. */
function startClock(stage: HTMLElement) {
  const world = stage.closest<HTMLElement>("[data-world]");
  const clock = world?.querySelector<HTMLAnchorElement>("[data-clock]");
  const text = clock?.querySelector<HTMLElement>("[data-clock-text]");
  const hourHand = clock?.querySelector<HTMLElement>('[data-hand="hour"]');
  const minuteHand = clock?.querySelector<HTMLElement>('[data-hand="minute"]');
  if (!world || !clock || !text || !hourHand || !minuteHand) return;
  let minuteTurn = 0;

  everyMinute((now) => {
    const date = new Date(now);
    const moment = momentForHour(date.getHours());
    const article = date.getHours() === 1 ? "Es la" : "Son las";
    text.textContent = `${article} ${formatTime(date)} · ${momentPhrases[moment]}`;
    const link = stage.querySelector<HTMLAnchorElement>(`[data-goto][data-moment="${moment}"]`);
    if (link) clock.href = link.hash;
    stage.querySelectorAll("[data-goto]").forEach((goto) => goto.toggleAttribute("data-now", goto === link));
    world.querySelectorAll<HTMLElement>("[data-now]").forEach((badge) => {
      if (badge.matches("[data-goto]")) return;
      badge.hidden = badge.dataset.now !== moment;
    });

    // Las agujas arrancan en las 12 y se acomodan; el minutero siempre avanza.
    const angles = clockAngles(date);
    const minute = angles.minute + Math.floor(minuteTurn / 360) * 360;
    minuteTurn = minute < minuteTurn ? minute + 360 : minute;
    clock.hidden = false;
    requestAnimationFrame(() => {
      hourHand.style.rotate = `${angles.hour}deg`;
      minuteHand.style.rotate = `${minuteTurn}deg`;
    });
  });
}
