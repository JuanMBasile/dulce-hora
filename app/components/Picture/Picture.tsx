import type { Picture as ImagePicture } from "vite-imagetools";

type PictureProps = {
  /** Resultado de importar una foto con `?preset=hero|feature|thumb`. */
  picture: ImagePicture;
  alt: string;
  /** Ancho que ocupa la foto en cada breakpoint, para que el navegador elija la variante justa. */
  sizes: string;
  className?: string;
  imgClassName?: string;
  /** Solo la foto del hero carga con prioridad; el resto es diferida. */
  priority?: boolean;
  /** Carga inmediata sin subir la prioridad: para una foto que se va a mostrar enseguida. */
  eager?: boolean;
};

const MIME: Record<string, string> = { avif: "image/avif", webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg" };

export function Picture({ picture, alt, sizes, className, imgClassName, priority = false, eager = false }: PictureProps) {
  const { sources, img } = picture;

  return (
    <picture className={className}>
      {Object.entries(sources).map(([format, srcSet]) => (
        <source key={format} type={MIME[format] ?? `image/${format}`} srcSet={srcSet} sizes={sizes} />
      ))}
      <img
        className={imgClassName}
        src={img.src}
        width={img.w}
        height={img.h}
        alt={alt}
        loading={priority || eager ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
