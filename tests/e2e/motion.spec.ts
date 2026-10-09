import { expect, test, type Page } from "@playwright/test";

// Movimiento ligado al scroll (plan, sección 7, spec motion). Por ahora: la marquesina,
// que corre sola, acelera e inclina con la velocidad del scroll y cambia de sentido al subir.

const track = (page: Page) => page.locator('[class*="band"] [class*="track"]').first();

const offset = (page: Page) =>
  track(page).evaluate((element) => parseFloat((element as HTMLElement).style.translate) || 0);
const tilt = (page: Page) =>
  track(page).evaluate((element) =>
    parseFloat(/skewX\((-?[\d.e-]+)deg\)/.exec((element as HTMLElement).style.transform)?.[1] ?? "0"),
  );

/** Diferencia entre dos posiciones de la pista, que da la vuelta cada 50 %. */
const moved = (from: number, to: number) => ((((to - from) % 50) + 75) % 50) - 25;

async function openAtBand(page: Page) {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  // La banda queda a un cuarto de la pantalla: al subir 480 px sigue a la vista (fuera de vista, el loop se pausa).
  await track(page).evaluate((element) => {
    const box = element.getBoundingClientRect();
    window.scrollTo(0, box.top + window.scrollY - window.innerHeight / 4);
  });
}

test("la marquesina corre sola y en reposo queda derecha", async ({ page }) => {
  await openAtBand(page);
  await page.waitForTimeout(400);
  const start = await offset(page);
  await page.waitForTimeout(800);
  // En reposo avanza hacia la izquierda unos 0,9 % por segundo.
  expect(moved(start, await offset(page))).toBeLessThan(-0.3);
  expect(Math.abs(await tilt(page))).toBeLessThan(0.5);
});

test("al subir, se inclina con el envión y cambia de sentido", async ({ page }) => {
  await openAtBand(page);
  await page.waitForTimeout(300);
  // Mide la inclinación en cada frame mientras se gira la rueda hacia arriba.
  await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[class*="band"] [class*="track"]')!;
    const state = { peak: 0, running: true };
    Object.assign(window, { tiltProbe: state });
    const sample = () => {
      const angle = parseFloat(/skewX\((-?[\d.e-]+)deg\)/.exec(track.style.transform)?.[1] ?? "0");
      state.peak = Math.max(state.peak, angle);
      if (state.running) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const box = (await track(page).boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  for (let tick = 0; tick < 4; tick++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(300);
  const peak = await page.evaluate(() => {
    const state = (window as unknown as { tiltProbe: { peak: number; running: boolean } }).tiltProbe;
    state.running = false;
    return state.peak;
  });
  expect(peak).toBeGreaterThan(1);

  await page.waitForTimeout(900);
  const start = await offset(page);
  await page.waitForTimeout(700);
  expect(moved(start, await offset(page))).toBeGreaterThan(0.3);
  expect(Math.abs(await tilt(page))).toBeLessThan(0.5);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("la marquesina queda quieta", async ({ page }) => {
    await openAtBand(page);
    await page.waitForTimeout(300);
    const start = await offset(page);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(700);
    expect(await offset(page)).toBe(start);
    expect(start).toBe(0);
  });
});
