// Header flotante: estado compacto al scrollear, sección actual en la navegación y menú
// de pantalla completa en el celular. Todo con IntersectionObserver: ningún listener de scroll.

import { smoothScroll } from "~/scripts/scroll";

const DESKTOP = "(min-width: 64rem)";

export function initHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  if (!header || !menu || !toggle) return;

  /* ---------- Compacto ---------- */
  // Un centinela en los primeros píxeles: cuando sale de vista, la isla toma sombra.
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;inset:0 0 auto;height:1.5rem;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.toggleAttribute("data-compact", entry ? !entry.isIntersecting : false)).observe(
    sentinel,
  );

  /* ---------- Sección actual ---------- */
  const links = [...header.querySelectorAll<HTMLAnchorElement>("[data-nav-link]")];
  const indicator = header.querySelector<HTMLElement>("[data-nav-indicator]");
  let current: HTMLAnchorElement | null = null;

  // La píldora se desliza hasta el enlace que se señala o, si no, hasta la sección actual.
  const place = (link: HTMLAnchorElement | null) => {
    if (!indicator) return;
    if (!link) {
      indicator.style.opacity = "0";
      return;
    }
    indicator.style.opacity = "1";
    indicator.style.translate = `${link.offsetLeft}px 0`;
    indicator.style.width = `${link.offsetWidth}px`;
  };

  const setCurrent = (id: string | null) => {
    current = links.find((link) => link.hash === `#${id}`) ?? null;
    for (const link of links) {
      if (link === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    place(current);
  };

  const targets = links
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((target): target is HTMLElement => target !== null);
  const visible = new Set<string>();
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      // La última sección de la página que cruza la franja del medio es la actual.
      const active = [...targets].reverse().find((target) => visible.has(target.id));
      setCurrent(active?.id ?? null);
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  for (const target of targets) spy.observe(target);

  for (const link of links) {
    link.addEventListener("pointerenter", () => place(link));
    link.addEventListener("focus", () => place(link));
    link.addEventListener("pointerleave", () => place(current));
    link.addEventListener("blur", () => place(current));
  }

  /* ---------- Menú del celular ---------- */
  const outside = () =>
    [...document.body.children].filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== header && element !== menu,
    );

  const setOpen = (open: boolean, { restoreFocus = true } = {}) => {
    if (open === (toggle.getAttribute("aria-expanded") === "true")) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar el menú" : "Abrir el menú");
    document.documentElement.toggleAttribute("data-menu-open", open);
    menu.inert = !open;
    // Con el menú abierto, el resto de la página queda inerte: el foco no se escapa.
    for (const element of outside()) element.inert = open;
    header.querySelectorAll<HTMLElement>("a").forEach((link) => (link.inert = open));
    if (open) {
      smoothScroll.lenis?.stop();
      menu.querySelector<HTMLElement>("[data-menu-link]")?.focus({ preventScroll: true });
    } else {
      smoothScroll.lenis?.start();
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  // Los enlaces son anclas nativas: el menú se cierra y el navegador hace el scroll.
  for (const link of menu.querySelectorAll<HTMLAnchorElement>("[data-menu-link]")) {
    link.addEventListener("click", () => setOpen(false, { restoreFocus: false }));
  }
  // Si la ventana pasa al layout de escritorio con el menú abierto, se cierra.
  window.matchMedia(DESKTOP).addEventListener("change", (query) => {
    if (query.matches) setOpen(false, { restoreFocus: false });
  });
}
