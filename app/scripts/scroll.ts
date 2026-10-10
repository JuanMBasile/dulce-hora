import type Lenis from "lenis";

/** Scroll suave del sitio (lo crea app/scripts/motion.ts), si está activo. */
export const smoothScroll: { lenis: Lenis | null } = { lenis: null };
