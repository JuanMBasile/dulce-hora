import { inView } from "motion";
import { branches, type RegionId } from "~/data/branches";
import {
  areasOf,
  countByRegion,
  describeResults,
  groupBranches,
  indexBranches,
  matchesBranch,
  regionOf,
  tokenize,
  type IndexedBranch,
} from "~/lib/branches";
import { captureFlip, playFlip } from "~/lib/flip";
import { reduceMotion } from "~/scripts/gsap";
import { boardHTML, odometerHTML } from "./board";
import styles from "./Branches.module.css";
import { createConstellation } from "./constellation-client";

const INDEX = indexBranches(branches);
const ALL_AREAS = areasOf(branches);
// En el sello, las sucursales siguen el orden del listado: cada zona ocupa un tramo del festón.
const RING = groupBranches(INDEX).flatMap((group) => group.areas.flatMap((area) => area.branches));

type Filter = RegionId | "todas";

// El tambor de barrios: arranca en "tu barrio" (lo que trae el HTML) y, con la línea a la
// vista, recorre los barrios donde hay sucursales. Al buscar, muestra los que coinciden.
const DRUM_REST = "tu barrio";
const DRUM_FIRST_MS = 1400;
const DRUM_EVERY_MS = 2400;
// El estado se anuncia cuando se deja de tipear, no en cada tecla.
const ANNOUNCE_MS = 450;
// Al recorrer el listado con el mouse, la moneda espera a que se detenga en una dirección.
const POINT_MS = 140;
const UNPOINT_MS = 400;

/** Buscador de sucursales en el navegador. El HTML estático trae el listado completo. */
export function initBranches() {
  const section = document.querySelector<HTMLElement>("[data-branches]");
  if (!section) return;
  const $ = <T extends Element>(selector: string) => section.querySelector<T>(selector);
  const input = $<HTMLInputElement>("[data-query]");
  const clearButton = $<HTMLButtonElement>("[data-clear]");
  const form = $<HTMLFormElement>("[data-search]");
  const chipsGroup = $<HTMLElement>("[data-chips]");
  const board = $<HTMLElement>("[data-board]");
  const odometer = $<HTMLElement>("[data-odometer]");
  const countLabel = $<HTMLElement>("[data-count-label]");
  const countContext = $<HTMLElement>("[data-count-context]");
  const statusLine = $<HTMLElement>("[data-status]");
  const drumLine = $<HTMLElement>("[data-drum-line]");
  const drum = $<HTMLElement>("[data-drum]");
  const stage = $<HTMLElement>("[data-constellation]");
  if (!input || !clearButton || !form || !chipsGroup || !board || !odometer || !drumLine || !drum || !stage) return;

  const reduce = reduceMotion();
  const chips = [...chipsGroup.querySelectorAll<HTMLButtonElement>("[data-chip]")];
  const constellation = createConstellation(stage, RING, reduce);

  let query = "";
  let filter: Filter = "todas";
  let typing = false;
  let pointed: string | null = null;
  let drumWords: string[] = ALL_AREAS;
  let drumTick = -1;
  let drumWord = DRUM_REST;
  let drumInView = false;
  let visible: IndexedBranch[] = INDEX;
  let groups = groupBranches(INDEX);
  let announceTimer = 0;
  let drumTimer = 0;
  let pointTimer = 0;

  // Los filtros reciben aria-pressed recién ahora: sin JavaScript no son botones que hagan algo.
  chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.chip === filter)));

  /* ---------- Estado derivado y dibujo ---------- */
  function render({ flip = false } = {}) {
    const tokens = tokenize(query);
    const matches = INDEX.filter((branch) => matchesBranch(branch, tokens));
    const counts = countByRegion(matches);
    visible = filter === "todas" ? matches : matches.filter((branch) => branch.region === filter);
    groups = groupBranches(visible);
    const region = filter === "todas" ? null : regionOf(filter);
    const searching = tokens.length > 0;

    // FLIP: antes de cambiar el listado se toma la foto; después, cada fila se desliza desde donde estaba.
    const snapshot = flip && !reduce ? captureFlip(board!) : null;
    board!.innerHTML = boardHTML({
      groups,
      tokens,
      query,
      elsewhere: visible.length === 0 ? matches.length : 0,
      where: region?.where ?? null,
    });
    if (snapshot) playFlip(board!, snapshot);

    // Filtros: cada uno cuenta lo que encuentra la búsqueda.
    for (const chip of chips) {
      const id = chip.dataset.chip as Filter;
      const active = id === filter;
      chip.toggleAttribute("data-active", active);
      chip.setAttribute("aria-pressed", String(active));
      const count = chip.querySelector<HTMLElement>(`.${styles.chipCount}`);
      if (count) count.textContent = String(id === "todas" ? matches.length : counts[id]);
    }
    placePill();

    // Contador mecánico: si cambia la cantidad de cifras se rearma; si no, cada tira gira.
    const digits = String(visible.length).split("");
    const strips = [...odometer!.children] as HTMLElement[];
    if (strips.length === digits.length) strips.forEach((strip, index) => strip.style.setProperty("--d", digits[index]!));
    else odometer!.innerHTML = odometerHTML(visible.length);
    if (countLabel) countLabel.textContent = visible.length === 1 ? "sucursal" : "sucursales";
    if (countContext) countContext.textContent = [region?.where, searching ? `para «${query.trim()}»` : null].filter(Boolean).join(" · ");
    drumLine!.toggleAttribute("data-empty", visible.length === 0);

    window.clearTimeout(announceTimer);
    const status = describeResults(visible.length, region, query);
    announceTimer = window.setTimeout(() => {
      if (statusLine) statusLine.textContent = status;
    }, ANNOUNCE_MS);

    // Con un filtro o una búsqueda, el tambor aterriza enseguida en lo que se está mostrando.
    const filtered = searching || filter !== "todas";
    const words = filtered ? areasOf(visible) : ALL_AREAS;
    if (words.join("|") !== drumWords.join("|")) {
      drumWords = words;
      drumTick = filtered ? 0 : -1;
    }
    paintDrum();
    scheduleDrum();
    paintSeal(filtered);
  }

  /* ---------- Sello y moneda ---------- */
  function paintSeal(filtered = isFiltered()) {
    // Con un filtro, se encienden las sucursales que se muestran; sin filtro, las del barrio del tambor.
    const lit = filtered
      ? new Set(visible.map((branch) => branch.id))
      : drumTick < 0
        ? null
        : new Set(INDEX.filter((branch) => branch.area === drumWord).map((branch) => branch.id));
    // La moneda muestra la dirección que se mira en el listado; si no, la primera del barrio del tambor.
    const listed = groups.flatMap((group) => group.areas.flatMap((area) => area.branches));
    const featured =
      (pointed ? visible.find((branch) => branch.id === pointed) : undefined) ??
      (drumTick < 0 ? null : (listed.find((branch) => branch.area === drumWord) ?? null));
    constellation.update({ lit, dim: filtered, featured });
  }

  const isFiltered = () => tokenize(query).length > 0 || filter !== "todas";

  /* ---------- Píldora de los filtros ---------- */
  // Una sola píldora blanca se desliza hasta el filtro activo.
  function placePill() {
    const active = chipsGroup!.querySelector<HTMLElement>("button[data-active]");
    if (!active) return;
    chipsGroup!.style.setProperty("--pill-x", `${active.offsetLeft}px`);
    chipsGroup!.style.setProperty("--pill-y", `${active.offsetTop}px`);
    chipsGroup!.style.setProperty("--pill-w", `${active.offsetWidth}px`);
    chipsGroup!.style.setProperty("--pill-h", `${active.offsetHeight}px`);
    if (!chipsGroup!.dataset.pill) {
      chipsGroup!.dataset.pill = "placed";
      // Recién en el frame siguiente se anima: la primera ubicación no viaja desde 0.
      requestAnimationFrame(() => (chipsGroup!.dataset.pill = "ready"));
    }
  }
  new ResizeObserver(placePill).observe(chipsGroup);

  /* ---------- Tambor ---------- */
  // El barrio nuevo sube detrás de una máscara mientras el anterior sale por arriba.
  function paintDrum() {
    const word = drumTick < 0 ? DRUM_REST : (drumWords[drumTick % drumWords.length] ?? DRUM_REST);
    if (word === drumWord) return;
    drumWord = word;
    const current = drum!.querySelector<HTMLElement>(`.${styles.drumIn}`);
    if (current) {
      current.className = styles.drumOut!;
      current.removeAttribute("data-first");
      current.addEventListener("animationend", () => current.remove(), { once: true });
      if (reduce) current.remove();
    }
    const next = document.createElement("span");
    next.className = styles.drumIn!;
    next.textContent = word;
    drum!.append(next);
  }

  function scheduleDrum() {
    window.clearTimeout(drumTimer);
    const cycling = !reduce && drumInView && !typing && drumWords.length > 1;
    if (!cycling) return;
    drumTimer = window.setTimeout(
      () => {
        drumTick += 1;
        paintDrum();
        paintSeal();
        scheduleDrum();
      },
      drumTick < 0 ? DRUM_FIRST_MS : DRUM_EVERY_MS,
    );
  }

  // Gira mientras se ve la línea del tambor misma, no la columna entera.
  inView(
    drumLine,
    () => {
      drumInView = true;
      scheduleDrum();
      return () => {
        drumInView = false;
        scheduleDrum();
      };
    },
    { amount: 0.6 },
  );

  /* ---------- Eventos ---------- */
  input.addEventListener("input", () => {
    query = input.value;
    clearButton.hidden = query === "";
    render({ flip: true });
  });
  input.addEventListener("focus", () => {
    typing = true;
    scheduleDrum();
  });
  input.addEventListener("blur", () => {
    typing = false;
    scheduleDrum();
  });
  const clear = () => {
    input.value = "";
    query = "";
    clearButton.hidden = true;
    render({ flip: true });
    input.focus();
  };
  clearButton.addEventListener("click", clear);

  // Enter cierra el teclado del celular y, si el listado quedó abajo, lo trae a la vista.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.blur();
    if (board.getBoundingClientRect().top > window.innerHeight * 0.6) {
      board.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  });

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      filter = chip.dataset.chip as Filter;
      render({ flip: true });
    });
  }

  // Salidas del vacío.
  board.addEventListener("click", (event) => {
    const action = (event.target as Element).closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "all-zones") {
      filter = "todas";
      render({ flip: true });
    } else if (action === "clear") clear();
  });

  // La moneda sigue la dirección que se mira en el listado (mouse con espera, o foco del teclado).
  const point = (id: string | null, delay: number) => {
    window.clearTimeout(pointTimer);
    pointTimer = window.setTimeout(() => {
      pointed = id;
      paintSeal();
    }, delay);
  };
  const branchIn = (target: EventTarget | null) =>
    target instanceof Element ? (target.closest<HTMLElement>("[data-branch]")?.dataset.branch ?? null) : null;
  board.addEventListener("pointerover", (event) => {
    // Entre una dirección y otra (el nombre del barrio, un margen) la moneda se queda.
    const id = branchIn(event.target);
    if (id && event.pointerType === "mouse") point(id, POINT_MS);
  });
  board.addEventListener("pointerleave", () => point(null, UNPOINT_MS));
  board.addEventListener("focusin", (event) => {
    const id = branchIn(event.target);
    if (id) point(id, 0);
  });
  board.addEventListener("focusout", () => point(null, UNPOINT_MS));

  render();
}
