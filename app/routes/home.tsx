import { lazy, Suspense } from "react";
import { sections, site } from "~/data/site";
import { organizationJsonLd } from "~/lib/seo";
import { Hero } from "~/sections/Hero/Hero";
import { ProductMarquee } from "~/sections/Marquee/ProductMarquee";
import { Products } from "~/sections/Products/Products";
import type { Route } from "./+types/home";
import styles from "./home.module.css";

// Historia y Sucursales están debajo del pliegue y van en chunks diferidos: el JS inicial
// queda dentro del presupuesto. El prerender los espera (app/entry.server.tsx), así que el
// HTML trae las dos secciones completas; en el navegador se hidratan cuando llega su chunk.
// Su CSS ya está en la hoja única (vite.config.ts).
const Story = lazy(() => import("~/sections/Story/Story").then((module) => ({ default: module.Story })));
const Branches = lazy(() => import("~/sections/Branches/Branches").then((module) => ({ default: module.Branches })));

export const links: Route.LinksFunction = () => [{ rel: "canonical", href: `${site.url}/` }];

export function meta(): Route.MetaDescriptors {
  return [
    { title: site.title },
    { name: "description", content: site.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:locale", content: site.locale },
    { property: "og:url", content: `${site.url}/` },
    { property: "og:title", content: site.title },
    { property: "og:description", content: site.description },
    { "script:ld+json": organizationJsonLd() },
  ];
}

export default function Home() {
  return (
    <>
      <Hero />
      <ProductMarquee />

      <Products />

      <Suspense fallback={null}>
        <Story />
      </Suspense>

      <Suspense fallback={null}>
        <Branches />
      </Suspense>

      <section
        id={sections.franquicias}
        tabIndex={-1}
        className={`surface-tostado ${styles.section} ${styles.colored}`}
        aria-labelledby="franquicias-titulo"
      >
        <div className="page-width">
          <h2 id="franquicias-titulo" className={styles.heading}>
            Abrí tu propio Dulce Hora
          </h2>
          <p className={styles.intro}>
            Sé parte de una marca en crecimiento. Nuestro modelo de franquicia te permite emprender con el respaldo de
            un equipo con experiencia y una marca reconocida.
          </p>
        </div>
      </section>
    </>
  );
}
