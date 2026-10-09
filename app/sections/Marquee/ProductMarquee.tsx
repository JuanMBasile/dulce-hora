import isotype from "~/components/brand/geometry/isotype.json";
import styles from "./ProductMarquee.module.css";

// Productos reales del catálogo oficial, como en la marquesina de un local.
const PRODUCTS = [
  "Medialunas de manteca",
  "Vigilantes",
  "Sacramentos",
  "Chipá",
  "Pan de campo",
  "Alfajores de maicena",
  "Budín marmolado",
  "Pastafrola de membrillo",
  "Mini Rogel",
  "Sándwiches de miga",
  "Tartas",
  "Chocotorta en pote",
  "Medialunas de grasa",
  "Tortitas negras",
  "Scones de queso",
  "Mini Red Velvet",
];

/** Ramita del sello como separador. */
function Sprig() {
  return (
    <svg className={styles.sprig} viewBox="20 29 60 44" aria-hidden="true">
      <path d={isotype.sprig} />
    </svg>
  );
}

/**
 * Marquesina roja con los productos. Es decorativa (los productos se presentan,
 * accesibles, en la sección siguiente), así que queda fuera del árbol de accesibilidad.
 */
export function ProductMarquee() {
  return (
    <div className={`surface-rojo festoon-top ${styles.band}`} aria-hidden="true">
      <div className={styles.viewport}>
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <ul key={copy} role="list" className={styles.group}>
              {PRODUCTS.map((product) => (
                <li key={product} className={styles.item}>
                  {product}
                  <Sprig />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
