// Datos globales del sitio. Todo el copy comercial sale de la web oficial;
// lo que todavía no está confirmado se lista en docs/datos-a-confirmar.md.

export const site = {
  name: "Dulce Hora",
  // Dominio canónico asumido hasta que la marca lo confirme.
  url: "https://www.dulcehora.com.ar",
  locale: "es_AR",
  description:
    "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece. Más de 100 sucursales en CABA, provincia de Buenos Aires y Rosario.",
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
