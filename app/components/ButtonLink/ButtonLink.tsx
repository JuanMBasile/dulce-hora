import type { ComponentPropsWithoutRef } from "react";
import styles from "./ButtonLink.module.css";

export type ButtonVariant = "primary" | "secondary" | "inverse" | "almibar";

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  /** primary: Rojo sobre Harina · secondary: contorno · inverse: Harina sobre Rojo · almibar: sobre Tostado */
  variant?: ButtonVariant;
};

/** Todas las llamadas a la acción del sitio son enlaces: anclas, WhatsApp o mailto. */
export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <a {...props} data-variant={variant} className={className ? `${styles.button} ${className}` : styles.button} />;
}
