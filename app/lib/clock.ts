// Hora local redondeada al minuto. El HTML es estático: la hora real aparece recién en el
// navegador, así el build no depende del momento en que se generó.
const MINUTE = 60_000;
const currentMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Llama a `onChange` ahora y cada vez que cambia el minuto. Devuelve cómo detenerlo. */
export function everyMinute(onChange: (time: number) => void) {
  let last = currentMinute();
  onChange(last);
  const timer = window.setInterval(() => {
    const next = currentMinute();
    if (next === last) return;
    last = next;
    onChange(next);
  }, 10_000);
  return () => window.clearInterval(timer);
}
