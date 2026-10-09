// Sustituto de las fotos procesadas por vite-imagetools en los tests unitarios.
const picture = {
  sources: {
    avif: "/foto-480.avif 480w, /foto-828.avif 828w",
    webp: "/foto-480.webp 480w, /foto-828.webp 828w",
    jpeg: "/foto-480.jpg 480w, /foto-828.jpg 828w",
  },
  img: { src: "/foto-828.jpg", w: 828, h: 552 },
};

export default picture;
