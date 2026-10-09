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
