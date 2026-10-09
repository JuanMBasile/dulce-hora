import { useInView, useReducedMotion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import isotype from "~/components/brand/geometry/isotype.json";
import { ButtonLink } from "~/components/ButtonLink/ButtonLink";
import { branches, regions, type RegionId } from "~/data/branches";
import { sections, site } from "~/data/site";
import {
  areasOf,
  branchMapsQuery,
  countByRegion,
  describeResults,
  groupBranches,
  highlight,
  indexBranches,
  matchesBranch,
  regionOf,
  tokenize,
} from "~/lib/branches";
import { useHydrated } from "~/lib/clock";
import { captureFlip, playFlip, type FlipSnapshot } from "~/lib/flip";
import { mapsSearchUrl } from "~/lib/urls";
import { BranchConstellation } from "./BranchConstellation";
import styles from "./Branches.module.css";

const INDEX = indexBranches(branches);
const ALL_AREAS = areasOf(branches);
// En el sello, las sucursales siguen el orden del listado: cada zona ocupa un tramo del festón.
const RING = groupBranches(INDEX).flatMap((group) => group.areas.flatMap((area) => area.branches));
// Solo las zonas que tienen sucursales en el listado.
const REGIONS = regions.filter((region) => branches.some((branch) => branch.region === region.id));
// Sin coordenadas propias, "cerca de mí" lo resuelve Maps con la ubicación del visitante.
const NEAREST_URL = mapsSearchUrl("Dulce Hora panadería");

type Filter = RegionId | "todas";

// El tambor de barrios: arranca en "tu barrio" (lo que trae el HTML) y, con la sección a la
// vista, recorre los barrios donde hay sucursales. Al buscar, muestra los que coinciden.
const DRUM_REST = "tu barrio";
const DRUM_FIRST_MS = 1400;
const DRUM_EVERY_MS = 2400;
// El estado se anuncia cuando se deja de tipear, no en cada tecla.
const ANNOUNCE_MS = 450;
// Al recorrer el listado con el mouse, la moneda espera a que se detenga en una dirección:
// pasar por encima de diez filas no la hace girar diez veces.
const POINT_MS = 140;
const UNPOINT_MS = 400;

/* ---------- Íconos (trazo de 2 px, en currentColor) ---------- */
function Icon({ name, className }: { name: "search" | "clear" | "arrow" | "pin"; className?: string }) {
  const paths = {
    search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
    clear: "M6 6l12 12M18 6 6 18",
    arrow: "M8 16 16 8M9.5 8H16v6.5",
    pin: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11ZM12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}

/** Texto con las coincidencias de la búsqueda resaltadas. */
function Highlighted({ text, tokens }: { text: string; tokens: readonly string[] }) {
  return highlight(text, tokens).map((segment, index) =>
    segment.hit ? (
      <mark key={index} className={styles.mark}>
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

/**
 * Tambor: el barrio nuevo sube detrás de una máscara mientras el anterior sale por arriba,
 * como el cartel de horarios del dial de productos.
 */
function Drum({ word }: { word: string }) {
  const [shown, setShown] = useState({ current: word, previous: null as string | null, turn: 0 });
  if (shown.current !== word) setShown({ current: word, previous: shown.current, turn: shown.turn + 1 });

  return (
    <span className={styles.drum}>
      {shown.previous !== null ? (
        <span
          key={`salida-${shown.turn}`}
          className={styles.drumOut}
          onAnimationEnd={() => setShown((state) => ({ ...state, previous: null }))}
        >
          {shown.previous}
        </span>
      ) : null}
      <span key={`entrada-${shown.turn}`} className={styles.drumIn} data-first={shown.turn === 0 || undefined}>
        {shown.current}
      </span>
    </span>
  );
}

/** Contador mecánico: cada cifra es una tira de 0 a 9 que gira hasta su valor. */
function Odometer({ value }: { value: number }) {
  const digits = String(value).split("");
  return (
    <span className={styles.odometer}>
      {digits.map((digit, index) => (
        // La clave es la posición desde la derecha: las unidades siguen siendo las unidades.
        <span key={digits.length - index} className={styles.digit} style={{ "--d": digit } as CSSProperties} />
      ))}
    </span>
  );
}

/**
 * "Panaderías cerca de casa": buscador de sucursales. Se busca por barrio, calle, altura o
 * ciudad, sin importar tildes; los filtros de zona cuentan lo que encuentra la búsqueda y
 * cada dirección abre la ficha del local en Google Maps. Arriba del listado, las sucursales
 * forman el sello y lo encienden según la búsqueda.
 *
 * Va en un chunk diferido (ver routes/home.tsx). Sin JavaScript, el listado completo queda
 * visible y agrupado; el buscador, los filtros y el tambor de barrios aparecen solo con
 * JavaScript.
 */
export function Branches() {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const drumRef = useRef<HTMLParagraphElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipSnapshot | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [typing, setTyping] = useState(false);

  const tokens = useMemo(() => tokenize(query), [query]);
  const matches = useMemo(() => INDEX.filter((branch) => matchesBranch(branch, tokens)), [tokens]);
  const counts = useMemo(() => countByRegion(matches), [matches]);
  const visible = useMemo(
    () => (filter === "todas" ? matches : matches.filter((branch) => branch.region === filter)),
    [matches, filter],
  );
  const groups = useMemo(() => groupBranches(visible), [visible]);
  const region = filter === "todas" ? null : regionOf(filter);
  const searching = tokens.length > 0;
  const status = describeResults(visible.length, region, query);
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: matches.length },
    ...REGIONS.map((item) => ({ id: item.id, label: item.chip, count: counts[item.id] })),
  ];

  /* ---------- Cambios con FLIP ---------- */
  // Antes de cambiar el filtro se toma la foto de la lista; después del render, cada
  // fila se desliza desde donde estaba.
  function update(apply: () => void) {
    if (!reduceMotion && boardRef.current) flip.current = captureFlip(boardRef.current);
    apply();
  }

  useLayoutEffect(() => {
    const snapshot = flip.current;
    flip.current = null;
    if (snapshot && boardRef.current) playFlip(boardRef.current, snapshot);
  }, [visible]);

  const onQuery = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    update(() => setQuery(next));
  };

  const clear = () => {
    update(() => setQuery(""));
    inputRef.current?.focus();
  };

  // Enter cierra el teclado del celular y, si el listado quedó abajo, lo trae a la vista.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inputRef.current?.blur();
    const board = boardRef.current;
    if (board && board.getBoundingClientRect().top > window.innerHeight * 0.6) {
      board.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  };

  /* ---------- Anuncio para lectores de pantalla ---------- */
  const [announced, setAnnounced] = useState(status);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(status), ANNOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  /* ---------- Píldora de los filtros ---------- */
  // Una sola píldora blanca se desliza hasta el filtro activo. Antes de medir (HTML
  // prerenderizado) el filtro activo se pinta solo.
  useLayoutEffect(() => {
    const group = chipsRef.current;
    if (!group) return;
    const place = () => {
      const active = group.querySelector<HTMLElement>("button[data-active]");
      if (!active) return;
      group.style.setProperty("--pill-x", `${active.offsetLeft}px`);
      group.style.setProperty("--pill-y", `${active.offsetTop}px`);
      group.style.setProperty("--pill-w", `${active.offsetWidth}px`);
      group.style.setProperty("--pill-h", `${active.offsetHeight}px`);
      if (!group.dataset.pill) {
        group.dataset.pill = "placed";
        // Recién en el frame siguiente se anima: la primera ubicación no viaja desde 0.
        requestAnimationFrame(() => {
          group.dataset.pill = "ready";
        });
      }
    };
    place();
    // Las cifras y la carga de la fuente cambian el ancho de los filtros.
    const observer = new ResizeObserver(place);
    for (const button of group.querySelectorAll("button")) observer.observe(button);
    return () => observer.disconnect();
  }, [filter, counts]);

  /* ---------- Tambor de barrios ---------- */
  // Gira mientras se ve el tambor mismo, no la columna entera.
  const inView = useInView(drumRef, { amount: 0.6 });
  // Con un filtro o una búsqueda, el tambor aterriza enseguida en lo que se está mostrando.
  const filtered = searching || filter !== "todas";
  const drumWords = filtered ? areasOf(visible) : ALL_AREAS;
  const wordsKey = drumWords.join("|");
  const [drum, setDrum] = useState({ key: wordsKey, tick: -1 });
  if (drum.key !== wordsKey) setDrum({ key: wordsKey, tick: filtered ? 0 : -1 });

  const cycling = hydrated && !reduceMotion && inView && !typing && drumWords.length > 1;
  useEffect(() => {
    if (!cycling) return;
    const timer = window.setTimeout(
      () => setDrum((state) => ({ ...state, tick: state.tick + 1 })),
      drum.tick < 0 ? DRUM_FIRST_MS : DRUM_EVERY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [cycling, drum.tick, drum.key]);

  const drumWord = drum.tick < 0 ? DRUM_REST : (drumWords[drum.tick % drumWords.length] ?? DRUM_REST);

  // En el sello: con un filtro, se encienden las sucursales que se muestran; sin filtro, las
  // del barrio que nombra el tambor.
  const lit = useMemo(() => {
    if (filtered) return new Set(visible.map((branch) => branch.id));
    if (drum.tick < 0) return null;
    return new Set(INDEX.filter((branch) => branch.area === drumWord).map((branch) => branch.id));
  }, [filtered, visible, drum.tick, drumWord]);

  /* ---------- La moneda del sello ---------- */
  // Muestra la dirección que se está mirando en el listado (mouse o teclado); si no, la
  // primera sucursal del barrio que nombra el tambor; antes de que gire, la ramita.
  const [pointed, setPointed] = useState<string | null>(null);
  const pointTimer = useRef(0);
  const point = (id: string | null, delay: number) => {
    window.clearTimeout(pointTimer.current);
    pointTimer.current = window.setTimeout(() => setPointed(id), delay);
  };
  useEffect(() => () => window.clearTimeout(pointTimer.current), []);
  const branchIn = (target: EventTarget) =>
    target instanceof Element ? (target.closest<HTMLElement>("[data-branch]")?.dataset.branch ?? null) : null;

  const featured = useMemo(() => {
    const looked = pointed ? visible.find((branch) => branch.id === pointed) : undefined;
    if (looked) return looked;
    if (drum.tick < 0) return null;
    // La primera del barrio en el orden del listado (por dirección), no en el de los datos.
    const listed = groups.flatMap((group) => group.areas.flatMap((area) => area.branches));
    return listed.find((branch) => branch.area === drumWord) ?? null;
  }, [pointed, visible, groups, drum.tick, drumWord]);

  /* ---------- Vacío ---------- */
  const elsewhere = visible.length === 0 && matches.length > 0;

  return (
    <section
      id={sections.sucursales}
      tabIndex={-1}
      className={`surface-rojo festoon-top ${styles.section}`}
      aria-labelledby="sucursales-titulo"
    >
      <div className={`page-width ${styles.layout}`}>
        <header className={styles.header}>
          <h2 id="sucursales-titulo" className={styles.title}>
            <span className={styles.titleInner}>Panaderías cerca de casa</span>
          </h2>
          <p className={styles.lead}>{site.reach}</p>
        </header>

        <BranchConstellation branches={RING} lit={lit} dim={filtered} featured={featured} hydrated={hydrated} />

        <div className={styles.aside}>
          <p
            ref={drumRef}
            className={styles.drumLine}
            aria-hidden="true"
            data-empty={visible.length === 0 || undefined}
          >
            <span className={styles.drumLead}>Estamos en</span> <Drum word={drumWord} />
          </p>

          <div className={styles.finder}>
            <form role="search" className={styles.search} onSubmit={onSubmit}>
              <label htmlFor="sucursales-busqueda" className={styles.label}>
                Buscá por barrio, calle o ciudad
              </label>
              <div className={styles.field}>
                <Icon name="search" className={styles.searchIcon} />
                <input
                  ref={inputRef}
                  id="sucursales-busqueda"
                  className={styles.input}
                  type="search"
                  value={query}
                  onChange={onQuery}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  placeholder="Caballito, Av. San Juan, Rosario…"
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  aria-describedby="sucursales-estado"
                />
                {query ? (
                  <button type="button" className={styles.clear} onClick={clear} aria-label="Borrar la búsqueda">
                    <Icon name="clear" />
                  </button>
                ) : null}
              </div>
            </form>

            <div ref={chipsRef} className={styles.chips} role="group" aria-label="Zona">
              <span className={styles.pill} aria-hidden="true" />
              {chips.map((chip) => {
                const active = chip.id === filter;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    className={styles.chip}
                    data-active={active || undefined}
                    aria-pressed={hydrated ? active : undefined}
                    onClick={() => update(() => setFilter(chip.id))}
                  >
                    {chip.label} <span className={styles.chipCount}>{chip.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className={styles.count} aria-hidden="true">
            <Odometer value={visible.length} />
            <span className={styles.countText}>
              <span className={styles.countLabel}>{visible.length === 1 ? "sucursal" : "sucursales"}</span>
              <span className={styles.countContext}>
                {[region?.where, searching ? `para «${query.trim()}»` : null].filter(Boolean).join(" · ")}
              </span>
            </span>
          </p>
          <p id="sucursales-estado" className="visually-hidden" role="status">
            {announced}
          </p>

          <ButtonLink href={NEAREST_URL} variant="inverse" rel="noopener" className={styles.nearest}>
            <Icon name="pin" className={styles.nearestIcon} />
            Cerca de mí, en Google Maps
          </ButtonLink>
        </div>

        <div className={`festoon-top ${styles.board}`}>
          <div
            ref={boardRef}
            className={styles.boardBody}
            onPointerOver={(event) => {
              // Entre una dirección y otra (el nombre del barrio, un margen) la moneda se queda.
              const id = branchIn(event.target);
              if (id && event.pointerType === "mouse") point(id, POINT_MS);
            }}
            onPointerLeave={() => point(null, UNPOINT_MS)}
            onFocus={(event) => {
              const id = branchIn(event.target);
              if (id) point(id, 0);
            }}
            onBlur={() => point(null, UNPOINT_MS)}
          >
            {groups.map((group) => (
              <section key={group.region.id} className={styles.region} aria-labelledby={`zona-${group.region.id}`}>
                <h3 id={`zona-${group.region.id}`} className={styles.regionTitle} data-flip={`zona-${group.region.id}`}>
                  {group.region.label}{" "}
                  <span className={styles.regionCount}>
                    {group.count}
                    <span className="visually-hidden"> {group.count === 1 ? "sucursal" : "sucursales"}</span>
                  </span>
                </h3>
                <ul role="list">
                  {group.areas.map((area) => {
                    // Una ciudad sin barrios en el listado (Rosario) no repite su nombre como barrio.
                    const solo = area.area === group.region.label;
                    return (
                      <li key={area.id} className={styles.row} data-flip={area.id} data-solo={solo || undefined}>
                        <h4 className={solo ? "visually-hidden" : styles.area}>
                          <Highlighted text={area.area} tokens={tokens} />
                        </h4>
                        <ul role="list" className={styles.addresses}>
                          {area.branches.map((branch) => (
                            <li key={branch.id}>
                              <a
                                className={styles.address}
                                data-branch={branch.id}
                                href={mapsSearchUrl(branchMapsQuery(branch))}
                                rel="noopener"
                                aria-label={`${branch.address}, ${area.area}: cómo llegar (Google Maps)`}
                              >
                                <Highlighted text={branch.address} tokens={tokens} />
                                <Icon name="arrow" className={styles.arrow} />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {visible.length === 0 ? (
              <div className={styles.empty} data-flip="vacio">
                <svg className={styles.emptySprig} viewBox="20 29 60 44" aria-hidden="true" focusable="false">
                  <path d={isotype.sprig} />
                </svg>
                <p className={styles.emptyTitle}>
                  {elsewhere && region ? `No hay resultados ${region.where}` : `No encontramos «${query.trim()}»`}
                </p>
                <p className={styles.emptyText}>
                  {elsewhere
                    ? `Hay ${matches.length === 1 ? "una sucursal" : `${matches.length} sucursales`} para «${query.trim()}» en otras zonas.`
                    : "Probá con otro barrio, una calle o la ciudad, o buscá las más cercanas en Google Maps."}
                </p>
                <div className={styles.emptyActions}>
                  {elsewhere ? (
                    <button
                      type="button"
                      className={styles.emptyButton}
                      onClick={() => update(() => setFilter("todas"))}
                    >
                      Ver todas las zonas
                    </button>
                  ) : (
                    <button type="button" className={styles.emptyButton} onClick={clear}>
                      Borrar la búsqueda
                    </button>
                  )}
                </div>
                <p className={styles.emptyFranchise}>
                  ¿No hay un Dulce Hora en tu barrio? <a href={`#${sections.franquicias}`}>Abrí el tuyo</a>.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
