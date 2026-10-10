// "Un día en Dulce Hora": el paseo de la portada. El scroll recorre el día, de la entrada
// a los cuatro momentos del catálogo (app/data/products.ts), y cada parada tiene su foto.
//
// Videos (skill scroll-world): cada parada puede tener un clip que va de su foto a la de la
// siguiente, en public/video/. Mientras no haya clips, el paseo funciona con las fotos: se
// funden y se acercan con el scroll. Ver docs/decisiones.md para generarlos.
import type { ImageMetadata } from "astro";
import facturas from "~/assets/photos/facturas-cenital.jpg";
import miniRogel from "~/assets/photos/mini-rogel.jpg";
import surtido from "~/assets/photos/surtido-pasteleria.jpg";
import tarta from "~/assets/photos/tarta.jpg";
import trenzas from "~/assets/photos/trenzas.jpg";
import { sections } from "~/data/site";
import type { MomentId } from "~/lib/moments";

export type Parada = {
  /** Ancla de la parada. */
  id: string;
  /** Nombre en el raíl de paradas. */
  lugar: string;
  /** Momento del catálogo que presenta; la entrada no tiene. */
  moment?: MomentId;
  photo: ImageMetadata;
  alt: string;
  /** En pantallas angostas la foto se recorta: qué parte horizontal queda a la vista (%). */
  focus: number;
  /** Clip que va de esta parada a la siguiente (public/video/…). Opcional. */
  clip?: string;
};

export const paradas: readonly Parada[] = [
  {
    id: sections.inicio,
    lugar: "Inicio",
    photo: facturas,
    alt: "Medialunas y facturas con crema pastelera, dulce de leche y membrillo, servidas en platos sobre una mesa de madera.",
    focus: 46,
  },
  {
    // La primera parada del catálogo es el destino de "Productos" en la navegación.
    id: sections.productos,
    lugar: "Mañana",
    moment: "manana",
    photo: trenzas,
    alt: "Dos trenzas de hojaldre, una con membrillo y otra con crema pastelera, en un plato.",
    focus: 50,
  },
  {
    id: "mediodia",
    lugar: "Mediodía",
    moment: "mediodia",
    photo: tarta,
    alt: "Tarta de queso gratinado con tomate y albahaca, vista desde arriba.",
    focus: 50,
  },
  {
    id: "merienda",
    lugar: "Merienda",
    moment: "merienda",
    photo: surtido,
    alt: "Plato con surtido de masas secas, alfajorcitos y pepas.",
    focus: 55,
  },
  {
    id: "festejo",
    lugar: "Para festejar",
    moment: "festejo",
    photo: miniRogel,
    alt: "Mini torta Rogel con capas de masa, dulce de leche y merengue.",
    focus: 50,
  },
];

/** Ancla de la parada de un momento del día. */
export const stopOf = (moment: MomentId) => paradas.find((parada) => parada.moment === moment)?.id ?? sections.productos;
