import { brandColors } from "./colors";
import seal from "./geometry/seal.json";

type SealProps = {
  className?: string;
  /** Clase para el arco-reloj, que el hero dibuja con stroke-dashoffset. */
  arcClassName?: string;
};

/** Sello principal inline (para animarlo). Para usos estáticos, ver assets/brand/sello.svg. */
export function Seal({ className, arcClassName }: SealProps) {
  const { rojo, tostado, harina } = brandColors;

  return (
    <svg viewBox={seal.viewBox} className={className} role="img" aria-label="Dulce Hora, panadería y pastelería">
      <path fill={tostado} d={seal.festoon} />
      <circle fill={harina} cx={seal.disc.cx} cy={seal.disc.cy} r={seal.disc.r} />
      <path
        className={arcClassName}
        fill="none"
        stroke={rojo}
        strokeWidth={4.5}
        strokeLinecap="round"
        pathLength={1}
        d={seal.arc}
      />
      <path fill={rojo} d={seal.sprig} />
      <path fill="none" stroke={harina} strokeWidth={1.6} strokeLinecap="round" d={seal.veins} />
      <path fill={tostado} d={seal.dulce} />
      <path fill={rojo} d={seal.hora} />
      <path fill={tostado} d={seal.descriptor} />
      <path fill={rojo} d={seal.ampersand} />
    </svg>
  );
}
