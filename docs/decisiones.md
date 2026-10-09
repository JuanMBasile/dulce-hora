# Decisiones del proyecto

Registro de decisiones técnicas y de proceso. Las decisiones de marca están en [`marca.md`](./marca.md) y los datos sin validar, en [`datos-a-confirmar.md`](./datos-a-confirmar.md).

## M0 · Skills disponibles (verificado el 2026-10-08)

El plan nombra siete skills. Verifiqué cada una en disco; no me apoyo en ninguna que no esté realmente instalada.

| Skill | Origen | Alcance | `SKILL.md` en disco | ¿Invocable en esta sesión? | Cómo la uso |
|---|---|---|---|---|---|
| `frontend-design` | plugin `frontend-design@claude-plugins-official` (`claude plugin install … --scope project`) | Proyecto (`.claude/settings.json`) | Sí, en la caché de plugins | No hasta recargar la sesión | Leí su `SKILL.md` directamente y apliqué su guía al plan de diseño |
| `vercel-react-best-practices` | `npx skills add vercel-labs/agent-skills` | Proyecto (`.claude/skills/`) | Sí (`SKILL.md`, `AGENTS.md`, `rules/`) | No: la herramienta Skill respondió "Unknown skill" | Leo `SKILL.md` y las reglas puntuales de `rules/` |
| `web-design-guidelines` | `npx skills add vercel-labs/agent-skills` | Proyecto (`.claude/skills/`) y también global | Sí | Sí, la versión global | Revisión de UI en M9 y M10 |
| `webapp-testing` | `npx skills add anthropics/skills` | Proyecto (`.claude/skills/`) | Sí | No hasta recargar | Tomo su patrón de reconocimiento antes de actuar; las pruebas van con `@playwright/test` (Node), no con Python |
| `emil-design-eng` | Global (`~/.claude/skills/`) | Usuario | Sí | Sí | Revisión del movimiento en M9 |
| `review-animations` | Global (`~/.claude/skills/`) | Usuario | Sí | Sí | Revisión del movimiento en M9 |
| `impeccable` | plugin `impeccable@impeccable` 4.5.0 | Usuario | Sí | Sí | Auditoría de diseño en M10 |

**Notas:**
- Las skills nuevas no aparecen en la herramienta Skill hasta recargar la sesión de Claude Code. Mientras tanto leo sus archivos directamente.
- Instalé con `skills@1.7.1` usando `--copy` para evitar symlinks en Windows. Avisó que pide Node ≥ 22.20 (tenemos 22.16), pero la instalación terminó bien y los archivos están completos.
- `skills-lock.json` registra el origen y el hash de las tres skills del proyecto.

## M0 · Entorno

- Node 22.16.0 en Windows 11. Todas las dependencias se fijan con versión exacta (`.npmrc`: `save-exact=true`, `engine-strict=true`).
- `.gitattributes` fuerza LF, porque Vercel compila en Linux.
- `assets-src/` (originales de fotos) queda fuera de git; se versionan solo los masters optimizados de `app/assets/photos/`.
- Commits por hito, en español.

## M1 · Scaffold

- **Scaffold manual**, no la plantilla oficial de React Router (que trae Tailwind, Docker y `ssr: true`).
- `react-router.config.ts`: `ssr: false` y `prerender: ["/"]`. El build genera `build/client/index.html` con el HTML completo y lo hidrata en el cliente; `build/server` se borra solo. Los flags `v8_*`, incluido `v8_viteEnvironmentApi`, compilan sin problemas con Vite 8.3.1.
- **vitest 5.0.3 en lugar de 5.0.1.** Con 5.0.1, npm 10.9.2 falla con `Cannot read properties of null (reading 'edgesOut')`: el peer opcional `@vitest/browser-playwright` resuelve a 5.0.3, que exige vitest 5.0.3, y el árbol de peers de npm se rompe. Es el último parche de la misma línea (publicado el 2026-09-30) y no cambia la API.
- Las dependencias de desarrollo se instalaron en tandas por el mismo bug de npm.
- `npm audit --omit=dev`: **0 vulnerabilidades en producción.** Las 29 de desarrollo (19 moderadas y 10 altas) vienen de `lighthouse` (sentry, opentelemetry, puppeteer-core) y de `serve` (compression). Son herramientas locales que solo escuchan en 127.0.0.1 y no se publican; no hay versión de Lighthouse sin esas dependencias.
- **Marca de hidratación:** `root.tsx` agrega `data-hydrated` a `<html>` cuando React termina de hidratar. Los e2e la esperan antes de interactuar.
- **`scripts/check-budget.mjs`** lee el `index.html` prerenderizado, porque React Router borra el manifest de Vite. Mide el JS inicial (modulepreload, scripts e imports del script inline), CSS, HTML, fuentes precargadas, la foto del hero y que el chunk de features de Motion no esté entre los scripts iniciales.
- **`vercel.json`**: `framework: null` y salida `build/client`. Las redirecciones 307 de `/about`, `/products`, `/branches` y `/franchise` a anclas son **provisorias**: sirven para previews y **bloquean el deploy a producción** hasta resolver la migración de URLs (`docs/migracion-seo.md`, M10).

## M2 · Marca y estructura

**Fuentes**
- **Subsets propios** en `app/assets/fonts/`, generados con `scripts/brand/subset-fonts.py` desde los archivos de fontsource.
- Bricolage Grotesque pasa de **131,5 KB** (el archivo `standard`, con opsz, peso y ancho completos) a **62,5 KB**:
  - El tamaño óptico queda fijo en 96, el corte de display.
  - El peso queda en 500–800 y el ancho en 75–100.
  - Es la única fuente precargada y entra en el presupuesto de 80 KB.
  - El archivo `wght` de fontsource (41 KB) no sirve: no tiene el eje de ancho y sin él no hay condensada.
- Newsreader pasa de **132 KB** a **76,5 KB** (opsz 16–72, peso 400–600) y no se precarga.
- Los fallbacks tienen `size-adjust` y overrides de ascent/descent medidos contra Arial y Georgia. El test de layout mide **CLS = 0** al cargar y al recorrer la página en los cuatro viewports.

**Logo**
- La geometría del logo se genera una sola vez con Python (fonttools y HarfBuzz) y queda en `app/components/brand/geometry/*.json`.
  - Los componentes React y `scripts/build-static.mjs` (favicons, íconos, 404) leen esos mismos JSON.
  - Detalle en [`marca.md`](./marca.md).
- Los SVG grandes que no se animan (el sello del pie y del menú) van como `<img>` y no inflan el HTML ni el JS. El sello del hero va en línea porque su arco se anima (M3).

**Header y navegación**
- **Header `sticky`, no `fixed`:** ocupa su lugar en el flujo, así que no hace falta compensar el contenido con padding.
  - Se compacta con un IntersectionObserver sobre un centinela, que escribe `data-compact` en el DOM: sin re-render y sin listeners de scroll.
  - Compactar solo cambia la sombra y `scale` en la firma. La altura no cambia, así que no mueve el layout.
- **Anclas nativas** (`<a href="#productos">`) y `scroll-padding-top` en `html` para que el destino quede debajo del header. El scroll suave solo se aplica con `prefers-reduced-motion: no-preference`.
- **`ScrollRestoration` fuera de `root.tsx`.**
  - Con una sola página y anclas nativas, el navegador ya restaura el scroll y los hashes en el historial.
  - El componente de React Router guarda posiciones por `location.key` y puede pisar el salto al hash en un POP.
  - Se vuelve a agregar, con `getKey`, cuando haya rutas reales.
- **Menú móvil** con `<dialog>` nativo y `showModal()`. Atrapa el foco, cierra con Escape, deja el fondo inerte y devuelve el foco al botón.
  - Se cierra solo si el viewport cruza los 64 rem.
  - Al elegir un enlace, cierra y pasa el foco a la sección de destino, que tiene `tabIndex={-1}`, con `preventScroll`.
- **Sin JavaScript**, `@media (scripting: none)` oculta el botón "Menú" y muestra la navegación como lista debajo de la firma. Está probado en el proyecto `no-js`: los enlaces son visibles y llevan a su sección.
- **Especificidad:** el CSS de `ButtonLink` llega en otro chunk y su `display` pisaba el `display: none` del CTA del header en móvil. Los selectores del header usan `.bar > .x` para ganar sin `!important`.

**Festón**
- El borde de los bloques Rojo y del pie es un `::before` con un `radial-gradient` repetido: una fila de semicírculos del color de la sección.
  - No necesita imágenes ni máscaras SVG.
  - El tamaño es fluido y el color sale de `--superficie`, así que sirve para cualquier bloque.

**404**
- `public/404.html` es estático y usa fuentes del sistema, la firma en línea y `noindex`.
  - En local, `serve` lo devuelve con status 404 real y el spec `seo-nojs` lo verifica.
  - Vercel sirve `404.html` de la misma forma en sitios estáticos. Queda a confirmar con curl en el primer preview.

## M3 y M6 · Hero y dial de productos

**Fotos**
- Los masters salen de la web oficial: `npm run photos` lee `assets-src/photos/` (no se versiona), limita a 2400 px y comprime con mozjpeg a calidad 86.
- Presets de `vite-imagetools`: `hero` (480–2400 px), `feature`, `thumb` y `plate`. `plate` es un recorte cuadrado de 320–960 px para la esfera del dial: un AVIF de 960 px pesa unos 28 KB.

**Motion sin renderer**
- Los componentes `m.*` necesitan `LazyMotion` para escribir en el DOM. Sin él, el sello del hero, el parallax y las agujas del reloj quedaban quietos.
- Con las features cargadas en diferido, Motion crea el renderer después de hidratar y **devuelve los MotionValues a su valor del primer render**: las agujas, que ya iban hacia la hora real, volvían a las 12. Está medido con un MutationObserver.
- Decisión: Motion calcula resortes (`useSpring`), scroll (`useScroll`, `useTransform`), `useInView` y `useReducedMotion`. `app/lib/motion-style.ts` escribe el valor directo en `rotate` o `translate` del elemento, sin re-renders.
  - El estilo inicial se calcula una sola vez y coincide con el HTML prerenderizado.
  - El JS inicial bajó de unos 153 KB a 136 KB gz y no hay chunk de features.

**Dial "Un día en Dulce Hora"**
- Es un dial de 24 h con el mediodía arriba: la mañana queda a la izquierda, la noche abajo y los cuatro momentos aparecen en orden horario, como el recorrido del sol.
  - El festón es el del sello (12 ondas, una cada 2 h), en Rojo y fino, como una blonda.
  - La aguja es una perla que recorre el festón con un resorte. La primera vez que el dial entra en pantalla da la vuelta completa al día; después toma el camino corto (`nearestTurn`).
- **Momento inicial:** el actual del visitante, marcado como "ahora". Se calcula con `useSyncExternalStore` y `getServerSnapshot = null`, así que el HTML prerenderizado muestra la mañana y no depende de la hora del build.
- **Pestañas ARIA** (flechas, Inicio y Fin, foco móvil) con roles agregados recién al hidratar. Antes de eso los botones no hacen nada y por eso no se anuncian como pestañas.
- **Sin JavaScript**, `@media (scripting: none)` oculta el dial y los cuatro paneles quedan apilados y completos. El HTML no usa `hidden`.
- **Con JavaScript**, el panel activo ocupa lugar y el saliente queda encima mientras se desvanece (200 ms). Los inactivos pasan a `visibility: hidden` y salen del árbol de accesibilidad.
- **Cambio de momento:**
  - El título sale por arriba y el nuevo entra desde abajo, como un cartel de horarios.
  - Las categorías entran escalonadas cada 55 ms.
  - La foto entra girando (−16° → 0°) con un blur que funde las dos imágenes.
  - Con movimiento reducido, todo eso se reemplaza por un fundido corto y la aguja salta.
- **Fotos del dial:** tomas cenitales sobre plato blanco (trenzas, tarta y masas secas) y el mini Rogel para festejar. El plato se lee como la esfera de un reloj.

## M7 (parcial) · Escena de Historia y marquesina con scroll

**Escena "Nuestra historia"**
- **Qué hace:**
  - La sección queda fija mientras se scrollea (340svh de recorrido).
  - El festón del sello, con un borde rojo, gira como un reloj y se abre desde un sello chico hasta cubrir toda la pantalla.
  - "Nuestra" e "historia" flanquean el sello y el festón los empuja fuera de cuadro.
  - Sobre la foto velada, el manifiesto oficial ("Creemos que disfrutar de una buena medialuna…") se enciende palabra por palabra.
  - Al soltarse, el bloque siguiente sube con el festón blanco mordiendo el borde de la foto.
- **Cómo:**
  - Motion calcula dos `useScroll`, la llegada y el tramo fijo, suavizados con `useSpring`, y cuatro `useTransform`.
  - `useMotionStyle` escribe solo cuatro variables CSS en el escenario (`--open`, `--veil`, `--read` y `--turn`). El CSS decide qué mueve cada una.
  - No hay re-renders ni estilos por elemento desde JS.
- **El festón** es un `clip-path: polygon()` de 96 puntos generado desde la geometría de seal.json (`app/lib/festoon.ts`, con tests).
  - El radio es `var(--r)`, así que el mismo polígono sirve para el sello quieto (en %) y para la ventana que crece (en largos).
  - El giro se hace con `rotate` en el contenedor y la foto gira al revés, así que queda casi quieta. El polígono no se recalcula en cada frame.
- **Mejora progresiva:**
  - La escena existe solo con `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`.
  - Sin JS o con movimiento reducido, la misma pieza queda quieta: título, foto en el sello y manifiesto en Tostado, completo.
  - Las variables iniciales se prerenderizan con el estado de arranque, así que no hay salto al hidratar.
- **Medido:** en m390 y d1440, 60 fps (frames de 16,7 ms) recorriendo la escena con la CPU 4× más lenta y ninguno de más de 50 ms. CLS 0 al cargar.
- **Foto:** `medialunas-manteca.jpg` con el preset `scene` (hasta 1616 px, el ancho del original). En pantallas de 2× se ve algo blanda, porque no hay un original más grande; el velo lo disimula.

**Valores:** filete y nombre se revelan con CSS scroll-driven (`view-timeline`), sin JS. Sin soporte, quedan quietos y completos.

**Marquesina**
- Motion la mueve con un loop de `frame.update` que corre solo mientras la banda está en pantalla.
- La velocidad del scroll (`useVelocity` + `useSpring`) la acelera hasta 7× y la inclina hasta 7°. Al subir, cambia de sentido.
- Con el cursor encima frena con resorte, en lugar de cortar de golpe.
- Sin JS sigue la animación CSS anterior. Con movimiento reducido queda quieta.

**Presupuesto:** el JS inicial pasó de 136,4 a 138,6 KB gz, con un límite de 140. Si la próxima sección lo excede, la escena se puede pasar a un chunk diferido (`React.lazy`), porque está debajo del pliegue.

## Sucursales · buscador

Referencia: cómo muestra Vremont sus oficinas ([`referencia-vremont.md`](./referencia-vremont.md)). Los datos son un listado parcial a confirmar ([`datos-a-confirmar.md`](./datos-a-confirmar.md)).

**Qué hace**
- **Datos:** `app/data/branches.ts` arma el listado, los filtros por zona, los contadores y el tambor. Una zona sin sucursales no muestra filtro.
- **Búsqueda** (`app/lib/branches.ts`, con tests):
  - Busca por barrio, calle, altura o ciudad, sin tildes ni mayúsculas. Todas las palabras tienen que aparecer.
  - Entiende alias ("recoleta" encuentra Barrio Norte), abreviaturas ("avenida" encuentra "Av.") y nombres pegados ("montecastro").
  - La coincidencia se resalta sobre el texto original, con tildes.
- **Filtros por zona:**
  - Botones con `aria-pressed`, que se agregan recién al hidratar, como los roles del dial.
  - Cada filtro cuenta lo que encuentra la búsqueda. Una píldora blanca se desliza hasta el filtro activo.
- **Estado:** el contador mecánico muestra cuántas hay, con el contexto ("en Rosario · para «san juan»"). Un `role="status"` lo anuncia cuando se deja de tipear (450 ms).
- **Listado:** papel blanco con el festón del sello, agrupado por zona y por barrio.
  - Cada dirección abre la ficha del local en Google Maps ("Dulce Hora, <dirección>, <barrio>, <ciudad>").
  - "Cerca de mí, en Google Maps" deja que Maps ubique al visitante: no hacen falta coordenadas propias ni permisos.
- **Sin resultados:** si la búsqueda aparece en otra zona, lo dice y ofrece verlas todas. Si no aparece en ninguna, ofrece borrarla y abrir una franquicia ("¿No hay un Dulce Hora en tu barrio?").
- **Movimiento:**
  - "Estamos en <barrio>": el tambor sube como el cartel de horarios del dial. Arranca en "tu barrio" (lo que trae el HTML) y, con la columna a la vista, recorre los barrios cada 2,4 s. Se detiene mientras se escribe y, con un filtro o una búsqueda, aterriza en lo que se muestra.
  - Las cifras del contador son tiras de 0 a 9 dibujadas por CSS (`content`), así que no queda texto suelto en el HTML.
  - Al filtrar, las filas se deslizan desde donde estaban (FLIP con la Web Animations API sobre `transform`, `app/lib/flip.ts`) y el papel acompaña el cambio de alto.
  - Las filas aparecen con CSS scroll-driven (`view()`), como los valores de Historia.
  - Con movimiento reducido, no hay tambor, FLIP ni revelado: los cambios son instantáneos.
- **Sin JavaScript:** el listado completo queda visible y agrupado. El buscador, los filtros y el tambor se ocultan con `@media (scripting: none)`.

**Chunk diferido**
- El JS inicial estaba en 138,6 KB de 140. El buscador (datos, búsqueda y movimiento, 5,7 KB gz) va en un chunk diferido con `React.lazy`.
  - En la Home quedan solo la sección y su título (`Branches.tsx`).
  - El buscador (`BranchFinder.tsx`) se hidrata cuando llega su chunk.
- **`app/entry.server.tsx` propio.** El prerender no manda user-agent y la entrada por defecto usaba `onShellReady`. Además, React manda aparte todo límite de Suspense de más de 12 800 bytes (`progressiveChunkSize`), en un `<div hidden>` que solo JavaScript ubica. Sin JS, la sección no se veía.
  - Ahora el prerender espera todo (`onAllReady`) y no separa nada (`progressiveChunkSize: Infinity`).
  - `seo-nojs` verifica que el listado esté dentro de `<main>` y que no haya `<div hidden id="S:…">`.
  - Esto también sirve para diferir Historia si la próxima sección lo necesita.
- **`build.cssCodeSplit: false`.** Con el CSS partido por chunk, React Router solo enlaza el de los módulos que la ruta importa de forma estática. El CSS del buscador llegaba con su chunk: sin estilos hasta entonces, y sin JS, nunca.
  - Tampoco alcanzaba con importar el CSS Module desde la Home: Vite marca los CSS Modules sin efectos secundarios y descarta ese import. Además, `?url` no está soportado con CSS Modules.
  - Ahora hay una sola hoja enlazada en el HTML. Comprime mejor: 9,3 KB gz con la sección nueva incluida, contra 8,6 KB antes sin ella.
  - El orden de las reglas cambió. No hay conflictos: el CSS global va en `@layer` y ningún módulo redefine tokens de superficie sobre el mismo elemento que `.surface-*`.
  - Efecto lateral: React Router copia a `build/client/assets` el `style-*.css` del build del servidor, que no se enlaza. Es un archivo de más en el deploy, inofensivo.
- **Probado y descartado:** agrupar los módulos compartidos con `codeSplitting.groups` de Rolldown subió el JS inicial a 140,2 KB.

**Presupuesto:** JS inicial 139,4 KB de 140 (antes 138,6), CSS 9,3 KB, HTML 19,8 KB. Rolldown crea chunks compartidos chicos (`clock`, `urls`) para lo que usan la Home y el buscador; eso explica los 0,8 KB. Para la próxima sección conviene diferir la escena de Historia (unos 2 KB).

**Validación:** tsc y eslint limpios; Vitest 32/32; build y presupuesto ok; Playwright 133 pasados y 5 omitidos a propósito, en m375, m390, t768, d1440 y no-js (`branches` nuevo; `seo-nojs` ampliado).
