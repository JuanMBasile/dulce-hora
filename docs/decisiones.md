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
