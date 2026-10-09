// Constructores de enlaces externos. Codifican todo lo que viaja en la URL.

/** Chat de WhatsApp con un mensaje precargado (formato oficial de wa.me). */
export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** Enlace mailto con asunto opcional. */
export function mailtoUrl(email: string, subject?: string): string {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

/** Búsqueda en Google Maps (API de URLs de Maps, sin clave). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
