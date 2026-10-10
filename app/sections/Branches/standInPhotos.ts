import alfajor from "~/assets/photos/alfajor-chocolate.jpg";
import baguette from "~/assets/photos/baguette.jpg";
import chipa from "~/assets/photos/chipa.jpg";
import facturas from "~/assets/photos/facturas-cenital.jpg";
import medialunas from "~/assets/photos/medialunas-manteca.jpg";
import miniRogel from "~/assets/photos/mini-rogel.jpg";
import panificado from "~/assets/photos/panificado.jpg";
import sandwich from "~/assets/photos/sandwich-miga.jpg";
import surtido from "~/assets/photos/surtido-pasteleria.jpg";
import tarta from "~/assets/photos/tarta.jpg";
import trenzas from "~/assets/photos/trenzas.jpg";
import vigilante from "~/assets/photos/vigilante.jpg";

// FOTOS PROVISORIAS. Todavía no hay fotos de los locales: cada sucursal muestra un producto
// y la moneda lo aclara con "Foto ilustrativa". Cuando lleguen las fachadas, cada sucursal
// lleva la suya en app/data/branches.ts (ver docs/datos-a-confirmar.md).
// La sucursal N del listado usa la foto N % 12.
export const STAND_IN_PHOTOS = [
  medialunas,
  facturas,
  vigilante,
  trenzas,
  surtido,
  chipa,
  baguette,
  panificado,
  alfajor,
  miniRogel,
  tarta,
  sandwich,
];
