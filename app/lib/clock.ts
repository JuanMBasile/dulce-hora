import { useSyncExternalStore } from "react";

// Hora local redondeada al minuto, compartida por el reloj del hero y el dial de productos.
// En el servidor no hay hora: el HTML prerenderizado no depende del momento del build y
// la hora real aparece recién al hidratar, sin diferencias de hidratación.
const MINUTE = 60_000;
const currentMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

let snapshot = currentMinute();
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribeMinute(onChange: () => void) {
  listeners.add(onChange);
  if (timer === undefined) {
    snapshot = currentMinute();
    timer = window.setInterval(() => {
      const next = currentMinute();
      if (next === snapshot) return;
      snapshot = next;
      listeners.forEach((listener) => listener());
    }, 10_000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Timestamp del minuto actual, o `null` en el servidor y durante la hidratación. */
export function useMinute(): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => snapshot,
    () => null,
  );
}

const noop = () => () => {};

/** `false` en el HTML prerenderizado y en la hidratación; `true` cuando React ya tomó el control. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
