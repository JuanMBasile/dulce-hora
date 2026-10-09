import { sections, site } from "~/data/site";
import { organizationJsonLd } from "~/lib/seo";
import { Hero } from "~/sections/Hero/Hero";
import { ProductMarquee } from "~/sections/Marquee/ProductMarquee";
import { Products } from "~/sections/Products/Products";
import type { Route } from "./+types/home";
import styles from "./home.module.css";

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

      <section id={sections.historia} tabIndex={-1} className={styles.section} aria-labelledby="historia-titulo">
        <div className="page-width">
          <h2 id="historia-titulo" className={styles.heading}>
            Nuestra historia
          </h2>
          <p className={styles.intro}>
            Dulce Hora nació con el objetivo claro de innovar con el sabor de las medialunas y en productos de
            pastelería. El foco está puesto en que los consumidores de cercanía puedan contar con un producto fresco,
            de calidad, con precio accesible y excelente atención.
          </p>
        </div>
      </section>

      <section
        id={sections.sucursales}
        tabIndex={-1}
        className={`surface-rojo festoon-top ${styles.section} ${styles.colored}`}
        aria-labelledby="sucursales-titulo"
      >
        <div className="page-width">
          <h2 id="sucursales-titulo" className={styles.heading}>
            Panaderías cerca de casa
          </h2>
          <p className={styles.intro}>{site.reach}</p>
        </div>
      </section>

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
