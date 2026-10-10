import Lenis from "lenis";
import { gsap, reduceMotion, ScrollTrigger } from "./gsap";
import { smoothScroll } from "./scroll";

// Movimiento de todo el sitio (skill landing-page-design, B7): scroll suave, entradas al
// hacer scroll y la marca de que el JavaScript ya tomó el control. Este script va último en
// la página: las secciones ya armaron sus ScrollTrigger.

// Scroll suave sincronizado con ScrollTrigger, como en la referencia (Lenis + GSAP).
if (!reduceMotion()) {
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  smoothScroll.lenis = lenis;
}

// Entradas: suben, se enfocan y aparecen al entrar en pantalla. IntersectionObserver,
// nunca un listener de scroll.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      reveal.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -10% 0px" },
);
document.querySelectorAll("[data-reveal]").forEach((element) => reveal.observe(element));

// Las fuentes y las fotos cambian alturas: los ScrollTrigger se recalculan cuando terminan.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

// Marca de que el JavaScript tomó el control: los tests e2e la esperan antes de interactuar.
document.documentElement.dataset.hydrated = "";
