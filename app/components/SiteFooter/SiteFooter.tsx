import sealUrl from "~/assets/brand/sello.svg";
import { contact, instagram, nav, sections } from "~/data/site";
import { mailtoUrl, whatsappUrl } from "~/lib/urls";
import styles from "./SiteFooter.module.css";

const franchiseMessage = "Hola, quiero información sobre las franquicias de Dulce Hora.";

export function SiteFooter() {
  return (
    <footer className={`surface-rojo festoon-top ${styles.footer}`}>
      <div className={`page-width ${styles.grid}`}>
        <div className={styles.brand}>
          <img
            className={styles.seal}
            src={sealUrl}
            alt="Dulce Hora, panadería y pastelería"
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
          />
          <p className={styles.tagline}>Panaderías cerca de casa en CABA, provincia de Buenos Aires y Rosario.</p>
        </div>

        <nav aria-labelledby="pie-secciones" className={styles.column}>
          <h2 id="pie-secciones" className={styles.heading}>
            Secciones
          </h2>
          <ul role="list" className={styles.list}>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="pie-franquicias" className={styles.column}>
          <h2 id="pie-franquicias" className={styles.heading}>
            Franquicias
          </h2>
          <ul role="list" className={styles.list}>
            <li>
              <a href={whatsappUrl(contact.whatsapp, franchiseMessage)} rel="noopener">
                WhatsApp {contact.whatsappLabel}
              </a>
            </li>
            <li>
              <a href={mailtoUrl(contact.email, "Franquicias Dulce Hora")}>{contact.email}</a>
            </li>
            <li className={styles.muted}>{contact.hours}</li>
          </ul>
        </section>

        <section aria-labelledby="pie-redes" className={styles.column}>
          <h2 id="pie-redes" className={styles.heading}>
            Seguinos
          </h2>
          <ul role="list" className={styles.list}>
            <li>
              <a href={instagram.url} rel="noopener">
                Instagram @{instagram.handle}
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className={`page-width ${styles.legal}`}>
        <p>© {__BUILD_YEAR__} Dulce Hora</p>
        <a href={`#${sections.inicio}`}>Volver al inicio</a>
      </div>
    </footer>
  );
}
