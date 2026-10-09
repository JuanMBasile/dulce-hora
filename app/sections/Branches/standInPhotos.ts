import alfajor from "~/assets/photos/alfajor-chocolate.jpg?preset=plate";
import baguette from "~/assets/photos/baguette.jpg?preset=plate";
import chipa from "~/assets/photos/chipa.jpg?preset=plate";
import facturas from "~/assets/photos/facturas-cenital.jpg?preset=plate";
import medialunas from "~/assets/photos/medialunas-manteca.jpg?preset=plate";
import miniRogel from "~/assets/photos/mini-rogel.jpg?preset=plate";
import panificado from "~/assets/photos/panificado.jpg?preset=plate";
import sandwich from "~/assets/photos/sandwich-miga.jpg?preset=plate";
import surtido from "~/assets/photos/surtido-pasteleria.jpg?preset=plate";
import tarta from "~/assets/photos/tarta.jpg?preset=plate";
import trenzas from "~/assets/photos/trenzas.jpg?preset=plate";
import vigilante from "~/assets/photos/vigilante.jpg?preset=plate";

// FOTOS PROVISORIAS. Todavía no hay fotos de los locales: cada sucursal muestra un producto
// y la moneda lo aclara con "Foto ilustrativa". Cuando lleguen las fachadas, cada sucursal
// lleva la suya en app/data/branches.ts (ver docs/datos-a-confirmar.md).
const PHOTOS = [medialunas, facturas, vigilante, trenzas, surtido, chipa, baguette, panificado, alfajor, miniRogel, tarta, sandwich];

/** Foto provisoria de la sucursal que ocupa ese lugar en el listado. */
export const standInPhoto = (index: number) => PHOTOS[index % PHOTOS.length]!;
