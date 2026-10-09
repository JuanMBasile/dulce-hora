// Sucursales de la web oficial (https://www.dulcehora.com.ar/branches).
// LISTADO PARCIAL Y A CONFIRMAR: la página no se pudo abrir desde el entorno de desarrollo
// y las direcciones salen de lo que el buscador tiene indexado de ella. Antes de publicar,
// se reemplaza por el listado oficial completo (docs/datos-a-confirmar.md).
// La sección, los contadores y los filtros se arman solos a partir de este archivo.

export type RegionId = "caba" | "provincia" | "rosario";

export type Region = {
  id: RegionId;
  /** Título del grupo en el listado. */
  label: string;
  /** Texto del filtro. */
  chip: string;
  /** Complemento de lugar para el estado de la búsqueda: "12 sucursales en Rosario". */
  where: string;
  /** Cómo se escribe en una dirección, para la búsqueda en Google Maps. */
  postal: string;
  /** Otras formas de buscarla. */
  aliases: readonly string[];
};

// Orden en que aparecen los grupos y los filtros.
export const regions: readonly Region[] = [
  {
    id: "caba",
    label: "Ciudad de Buenos Aires",
    chip: "CABA",
    where: "en CABA",
    postal: "CABA",
    aliases: ["Capital Federal", "Capital", "Ciudad"],
  },
  {
    id: "provincia",
    label: "Provincia de Buenos Aires",
    chip: "Provincia",
    where: "en la provincia de Buenos Aires",
    postal: "Provincia de Buenos Aires",
    aliases: ["GBA", "Gran Buenos Aires", "Conurbano"],
  },
  {
    id: "rosario",
    label: "Rosario",
    chip: "Rosario",
    where: "en Rosario",
    postal: "Rosario, Santa Fe",
    aliases: ["Santa Fe"],
  },
];

export type Branch = {
  region: RegionId;
  /** Barrio (en CABA) o localidad: es lo primero que busca la gente. */
  area: string;
  /** Calle y altura. */
  address: string;
  /** Otros nombres de la zona, para la búsqueda: Barrio Norte es parte de Recoleta. */
  aliases?: readonly string[];
};

export const branches: readonly Branch[] = [
  // Ciudad de Buenos Aires
  { region: "caba", area: "Almagro", address: "Gascón 645" },
  { region: "caba", area: "Almagro", address: "Jerónimo Salguero 218" },
  { region: "caba", area: "Barracas", address: "Pinzón 1661" },
  { region: "caba", area: "Barrio Norte", address: "Ecuador 1278", aliases: ["Recoleta"] },
  { region: "caba", area: "Belgrano", address: "Virrey del Pino 2787" },
  { region: "caba", area: "Boedo", address: "Av. San Juan 3405" },
  { region: "caba", area: "Caballito", address: "Av. La Plata 684" },
  { region: "caba", area: "Caballito", address: "Av. José María Moreno 773" },
  { region: "caba", area: "Caballito", address: "Av. Rivadavia 5917" },
  { region: "caba", area: "Caballito", address: "Av. Ángel Gallardo 922", aliases: ["Cid Campeador"] },
  { region: "caba", area: "Caballito", address: "Barco Centenera 196" },
  { region: "caba", area: "Flores", address: "Pumacahua 55" },
  { region: "caba", area: "Flores", address: "Nazca 620" },
  { region: "caba", area: "La Boca", address: "Caboto 444" },
  { region: "caba", area: "Las Cañitas", address: "Av. Luis María Campos 1025", aliases: ["Palermo"] },
  { region: "caba", area: "Monserrat", address: "Luis Sáenz Peña 470" },
  { region: "caba", area: "Monte Castro", address: "Av. Álvarez Jonte 4793" },
  { region: "caba", area: "Palermo", address: "Güemes 3792" },
  { region: "caba", area: "Villa Real", address: "Simbrón 5317" },

  // Rosario. El listado oficial no dice el barrio de cada local.
  { region: "rosario", area: "Rosario", address: "Tucumán 1330" },
  { region: "rosario", area: "Rosario", address: "Pueyrredón 1181" },
  { region: "rosario", area: "Rosario", address: "Av. San Martín 3302, local 2" },
  { region: "rosario", area: "Rosario", address: "Dorrego 180" },
  { region: "rosario", area: "Rosario", address: "Mendoza 3502" },
  { region: "rosario", area: "Rosario", address: "Av. Pellegrini 954" },
  { region: "rosario", area: "Rosario", address: "San Juan 1538" },
  { region: "rosario", area: "Rosario", address: "27 de Febrero 5200" },
  { region: "rosario", area: "Rosario", address: "Italia 944" },
  { region: "rosario", area: "Rosario", address: "Balcarce 816" },
  { region: "rosario", area: "Rosario", address: "Maipú 514" },
  { region: "rosario", area: "Rosario", address: "Ayacucho 5643" },
];
