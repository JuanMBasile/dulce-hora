// Datos globales del sitio. Todo el copy comercial sale de la web oficial;
// lo que todavía no está confirmado se lista en docs/datos-a-confirmar.md.

export const site = {
  name: "Dulce Hora",
  // Dominio canónico asumido hasta que la marca lo confirme.
  url: "https://www.dulcehora.com.ar",
  locale: "es_AR",
  title: "Dulce Hora | Panadería y pastelería",
  description:
    "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece. Más de 100 sucursales en CABA, provincia de Buenos Aires y Rosario.",
  reach: "Más de 100 sucursales en CABA, provincia de Buenos Aires y Rosario.",
} as const;

// Alternativas de copy del hero (plan, sección 2). Cambiar `heroCopy` alcanza para probar otra.
export const heroOptions = {
  a: {
    title: "Siempre es buena hora para algo rico.",
    lead: "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece.",
  },
  b: {
    title: "Una dulce hora para compartir.",
    lead: "Medialunas, facturas y pastelería hechas cada día para la mesa de tu casa, la oficina o la merienda con amigos.",
  },
  c: {
    title: "Hecho cada día, a la vuelta de casa.",
    lead: "Más de 100 sucursales con medialunas, facturas y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece.",
  },
} as const;

export const heroCopy = heroOptions.a;

// Navegación de la Home: anclas nativas a las secciones. Son la navegación
// provisional hasta que existan las páginas propias (docs/migracion-seo.md).
export const sections = {
  inicio: "inicio",
  productos: "productos",
  historia: "historia",
  sucursales: "sucursales",
  franquicias: "franquicias",
} as const;

export const nav = [
  { href: `#${sections.productos}`, label: "Productos" },
  { href: `#${sections.historia}`, label: "Nosotros" },
  { href: `#${sections.sucursales}`, label: "Sucursales" },
  { href: `#${sections.franquicias}`, label: "Franquicias" },
] as const;

export const primaryCta = { href: `#${sections.sucursales}`, label: "Encontrá tu sucursal" } as const;

// Contacto publicado en la sección de franquicias del sitio oficial.
export const contact = {
  email: "dulcehoraf@gmail.com",
  whatsapp: "5491150027657",
  whatsappLabel: "+54 9 11 5002-7657",
  hours: "Lunes a viernes de 9 a 18 h",
} as const;

// Cuenta citada en el sitio oficial de 2024; queda a confirmar con la marca.
export const instagram = {
  handle: "dulcehoraoficial",
  url: "https://www.instagram.com/dulcehoraoficial/",
} as const;
