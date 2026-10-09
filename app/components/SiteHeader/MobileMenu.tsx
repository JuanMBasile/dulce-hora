import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Signature } from "~/components/brand/Signature";
import { ButtonLink } from "~/components/ButtonLink/ButtonLink";
import { nav, primaryCta, site } from "~/data/site";
import sealUrl from "~/assets/brand/sello.svg";
import styles from "./MobileMenu.module.css";

const DESKTOP_QUERY = "(min-width: 64rem)";

type MobileMenuProps = {
  toggleClassName?: string;
};

/**
 * Menú móvil sobre un <dialog> nativo con showModal(): atrapa el foco, deja el
 * fondo inerte, cierra con Escape y devuelve el foco al botón que lo abrió.
 */
export function MobileMenu({ toggleClassName }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Si el viewport pasa al layout de escritorio con el menú abierto, se cierra.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = () => {
      if (query.matches) dialogRef.current?.close();
    };
    closeOnDesktop();
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, [open]);

  const openMenu = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setOpen(true);
  };

  const closeMenu = () => dialogRef.current?.close();

  // Los enlaces son anclas nativas: el navegador hace el scroll y agrega la entrada
  // al historial. Solo cerramos el diálogo antes y, después, llevamos el foco a la
  // sección de destino para que el teclado siga desde ahí.
  const followLink = (event: MouseEvent<HTMLAnchorElement>) => {
    const hash = event.currentTarget.hash;
    closeMenu();
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.focus({ preventScroll: true });
    });
  };

  // Un clic fuera del contenido (en el propio <dialog>) también cierra.
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeMenu();
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.toggle} ${toggleClassName ?? ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={openMenu}
      >
        Menú
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M4 8.5h16M4 15.5h16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        id="menu-movil"
        ref={dialogRef}
        className={`surface-rojo ${styles.menu}`}
        aria-labelledby="menu-movil-titulo"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
      >
        <div className={`page-width ${styles.inner}`}>
          <div className={styles.top}>
            <Signature tone="inverse" className={styles.signature} />
            <h2 id="menu-movil-titulo" className="visually-hidden">
              Menú
            </h2>
            <button type="button" className={styles.close} onClick={closeMenu}>
              Cerrar
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Menú">
            <ul role="list" className={styles.links}>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={styles.link} onClick={followLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.footer}>
            <ButtonLink href={primaryCta.href} variant="inverse" onClick={followLink}>
              {primaryCta.label}
            </ButtonLink>
            <p className={styles.note}>{site.reach}</p>
          </div>
        </div>

        <img className={styles.seal} src={sealUrl} alt="" width={400} height={400} loading="lazy" decoding="async" />
      </dialog>
    </>
  );
}
