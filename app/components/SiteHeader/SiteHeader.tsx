import { useEffect, useRef } from "react";
import { Signature } from "~/components/brand/Signature";
import { ButtonLink } from "~/components/ButtonLink/ButtonLink";
import { nav, primaryCta, sections } from "~/data/site";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Compacta el header cuando la página se desplaza. Escribe un atributo en el DOM
  // en lugar de usar estado: no hay re-render ni listeners de scroll.
  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      header.toggleAttribute("data-compact", entry ? !entry.isIntersecting : false);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header ref={headerRef} className={styles.header}>
        <div className={`page-width ${styles.bar}`}>
          <a href={`#${sections.inicio}`} className={styles.brand}>
            <Signature className={styles.signature} />
            <span className="visually-hidden">Dulce Hora, ir al inicio</span>
          </a>

          <nav aria-label="Principal" className={styles.nav}>
            <ul role="list" className={styles.links}>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={styles.link}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ButtonLink href={primaryCta.href} className={styles.cta}>
            {primaryCta.label}
          </ButtonLink>

          <MobileMenu toggleClassName={styles.toggle} />
        </div>
      </header>
    </>
  );
}
