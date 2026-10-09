import { lazy, Suspense } from "react";
import { sections, site } from "~/data/site";
import styles from "./Branches.module.css";

// El buscador (datos, búsqueda y movimiento) va en un chunk diferido: está debajo del
// pliegue y el JS inicial ya está al límite del presupuesto. El prerender lo espera
// (app/entry.server.tsx), así que el HTML trae el listado completo; en el navegador se
// hidrata cuando llega el chunk.
// La sección y el título quedan acá, en el chunk de la Home, para que su CSS Module se
// enlace en el HTML: React Router solo enlaza el CSS de los módulos que la ruta importa de
// forma estática. Sin eso, el listado se vería sin estilos hasta que llegue el chunk (y
// sin JavaScript, nunca).
const BranchFinder = lazy(() => import("./BranchFinder").then((module) => ({ default: module.BranchFinder })));

/** "Panaderías cerca de casa": el buscador de sucursales sobre el bloque Rojo. */
export function Branches() {
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

        <Suspense fallback={null}>
          <BranchFinder />
        </Suspense>
      </div>
    </section>
  );
}
