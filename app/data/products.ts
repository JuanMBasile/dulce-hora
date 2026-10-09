// Catálogo de la web oficial (https://www.dulcehora.com.ar/products), agrupado por
// momento del día. Los nombres son los publicados, con tildes y plurales corregidos;
// las categorías que la web lista sin productos ("Tortas y tartas", "Tartas",
// "Ensaladas") aparecen solo como categoría.
import type { MomentId } from "~/lib/moments";

export type ProductCategory = {
  name: string;
  items: readonly string[];
};

export type Moment = {
  id: MomentId;
  /** Texto de la pestaña. */
  label: string;
  /** Título visible del panel. */
  heading: string;
  /** Hora de referencia en el dial de 24 h. */
  hour: number;
  photo: "trenzas" | "tarta" | "surtido-pasteleria" | "mini-rogel";
  photoAlt: string;
  categories: readonly ProductCategory[];
};

export const moments: readonly Moment[] = [
  {
    id: "manana",
    label: "Mañana",
    heading: "Para la mañana",
    hour: 8,
    photo: "trenzas",
    photoAlt: "Dos trenzas de hojaldre, una con membrillo y otra con crema pastelera, en un plato.",
    categories: [
      { name: "Medialunas", items: ["Manteca", "Grasa"] },
      {
        name: "Facturas",
        items: ["Vigilantes", "Santiagueñas", "Sacramentos", "Tortitas negras", "Hojaldre", "Triangulitos", "Culis", "Moñitos", "Trenzas", "Niditos"],
      },
      { name: "Bizcochería", items: ["Bizcochitos de grasa", "Criollos", "Cremonas", "Chipá", "Scones de queso"] },
      { name: "Panificado", items: ["Miñones", "Pan de campo", "Baguette", "Figaza", "Francés", "Salvado"] },
    ],
  },
  {
    id: "mediodia",
    label: "Mediodía",
    heading: "Para el mediodía",
    hour: 13,
    photo: "tarta",
    photoAlt: "Tarta de queso gratinado con tomate y albahaca, vista desde arriba.",
    categories: [
      { name: "Sándwiches y tostados", items: ["Árabe", "Miga", "Tostado"] },
      { name: "Wraps", items: ["Carne", "Queso", "Vegetariano"] },
      { name: "Pizzas", items: ["Muzzarella", "Cebolla"] },
      { name: "Pastel de papas", items: ["Papa", "Calabaza"] },
      { name: "Y además", items: ["Tartas", "Ensaladas"] },
    ],
  },
  {
    id: "merienda",
    label: "Merienda",
    heading: "Para la merienda",
    hour: 17,
    photo: "surtido-pasteleria",
    photoAlt: "Plato con surtido de masas secas, alfajorcitos y pepas.",
    categories: [
      {
        name: "Variedad de pastelería",
        items: [
          "Conitos",
          "Cookies de limón",
          "Cookies de manteca",
          "Alfajorcitos blancos",
          "Alfajorcitos de chocolate con dulce de leche",
          "Pepas",
          "Alfajorcitos de maicena",
          "Alfajorcitos santafesinos",
          "Rosquitas de maicena",
        ],
      },
      { name: "Alfajores", items: ["Chocolate", "Blanco", "Maicena", "Azúcar impalpable"] },
      {
        name: "Budines",
        items: ["Limón", "Naranja", "Chocolate", "Chocolate con dulce de leche", "Vainilla", "Vainilla con chips", "Zanahoria", "Marmolado"],
      },
      {
        name: "Cuadrados",
        items: ["Manzana", "Naranja", "Limón", "Chocolate", "Ricota", "Pastafrola de batata", "Pastafrola de membrillo"],
      },
    ],
  },
  {
    id: "festejo",
    label: "Para festejar",
    heading: "Para festejar",
    hour: 21,
    photo: "mini-rogel",
    photoAlt: "Mini torta Rogel con capas de masa, dulce de leche y merengue.",
    categories: [
      { name: "Mini tortas", items: ["Red Velvet", "Dulce Hora", "Matilda", "Rogel"] },
      { name: "Potes", items: ["Frutos rojos", "Mousse de chocolate", "Oreo", "Chocotorta", "Durazno", "Tiramisú", "Maracuyá"] },
      { name: "Y además", items: ["Tortas y tartas"] },
    ],
  },
];
