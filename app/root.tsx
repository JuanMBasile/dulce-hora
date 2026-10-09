import { useEffect, type ReactNode } from "react";
import { Links, Meta, Outlet, Scripts } from "react-router";
import bricolageUrl from "~/assets/fonts/bricolage-grotesque-dh.woff2?url";
import { SiteFooter } from "~/components/SiteFooter/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader/SiteHeader";
import type { Route } from "./+types/root";
import "./styles/tokens.css";
import "./styles/fonts.css";
import "./styles/global.css";

export const links: Route.LinksFunction = () => [
  // Única fuente precargada: la de titulares, que dibuja el H1.
  { rel: "preload", href: bricolageUrl, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#d50d17" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {/* Sin <ScrollRestoration>: la Home navega solo con anclas nativas y el
            navegador ya restaura el scroll del historial (ver docs/decisiones.md). */}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Marca de hidratación: los tests e2e la esperan antes de interactuar.
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
  }, []);

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
