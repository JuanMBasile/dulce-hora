import { brandColors } from "./colors";
import isotype from "./geometry/isotype.json";
import signature from "./geometry/signature.json";

type SignatureProps = {
  /** "inverse" pinta DULCE y HORA en Harina, para fondos Rojo. */
  tone?: "default" | "inverse";
  className?: string;
};

/** Firma horizontal: isotipo + DULCE / HORA. Decorativa; el texto accesible va en el enlace. */
export function Signature({ tone = "default", className }: SignatureProps) {
  const { rojo, tostado, harina } = brandColors;
  const ink = tone === "inverse" ? harina : tostado;
  const accent = tone === "inverse" ? harina : rojo;

  return (
    <svg
      viewBox={signature.viewBox}
      width={signature.width}
      height={signature.height}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`scale(${signature.isotypeScale})`}>
        <path fill={tostado} d={isotype.festoon} />
        <circle fill={harina} cx={isotype.disc.cx} cy={isotype.disc.cy} r={isotype.disc.r} />
        <path fill={rojo} d={isotype.sprig} />
      </g>
      <path fill={ink} d={signature.dulce} />
      <path fill={accent} d={signature.hora} />
    </svg>
  );
}
