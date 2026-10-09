import { contact, instagram, site } from "~/data/site";

/** JSON-LD de la marca. Bakery/LocalBusiness queda para las páginas de cada sucursal,
 *  cuando haya direcciones verificadas (docs/decisiones.md). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/icon-512.png`,
    sameAs: [instagram.url],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "franquicias",
        email: contact.email,
        telephone: `+${contact.whatsapp}`,
        areaServed: "AR",
        availableLanguage: "es",
      },
    ],
  };
}
