import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Un solo registro de ScrollTrigger para todas las secciones.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
