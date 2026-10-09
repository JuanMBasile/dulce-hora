// Tipos de los presets de vite-imagetools y de las constantes definidas en el build.
type ImgPicture = import("vite-imagetools").Picture;

declare module "*?preset=hero" {
  const picture: ImgPicture;
  export default picture;
}
declare module "*?preset=feature" {
  const picture: ImgPicture;
  export default picture;
}
declare module "*?preset=thumb" {
  const picture: ImgPicture;
  export default picture;
}

declare module "*?preset=plate" {
  const picture: ImgPicture;
  export default picture;
}

declare const __BUILD_YEAR__: number;
