import { expect, test, type Page } from "@playwright/test";
import { moments } from "../../app/data/products";

// "Un día en Dulce Hora" con JavaScript: el escenario fijo, las paradas que se vuelven
// actuales con el scroll, sus fotos, el raíl y el momento de la hora local. La versión sin
// JS se prueba en seo-nojs.

const world = (page: Page) => page.locator("[data-world]");
const stops = (page: Page) => world(page).locator("[data-stop]");
const frames = (page: Page) => world(page).locator("[data-frame]");

async function open(page: Page) {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/** Lleva el scroll al comienzo de una parada (cuando su artículo toca el borde superior). */
async function goToStop(page: Page, index: number) {
  await stops(page)
    .nth(index)
    .evaluate((stop) => window.scrollTo(0, stop.getBoundingClientRect().top + window.scrollY + 2));
}

test.use({ timezoneId: "America/Argentina/Buenos_Aires" });

test("el escenario queda fijo y cada parada se vuelve la actual con su foto", async ({ page }) => {
  await open(page);
  await expect(stops(page)).toHaveCount(moments.length + 1);
  await expect(frames(page)).toHaveCount(moments.length + 1);
  // Al cargar, la entrada es la actual y solo se ve su foto.
  await expect(stops(page).first()).toHaveAttribute("data-current", "");
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();

  for (const [index, moment] of moments.entries()) {
    await goToStop(page, index + 1);
    const stop = stops(page).nth(index + 1);
    await expect(stop).toHaveAttribute("data-current", "");
    await expect(stop.getByRole("heading", { level: 2, name: moment.heading })).toBeInViewport();
    // El escenario sigue fijo arriba y la foto de la parada ya está entera.
    await expect.poll(() => world(page).locator("[data-stage]").evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
    await expect
      .poll(() => frames(page).nth(index + 1).evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.95);
  }
  // Solo una parada es la actual a la vez.
  await expect(world(page).locator("[data-stop][data-current]")).toHaveCount(1);
});

test("marca el momento de la hora local como «Ahora» y el reloj dice la hora", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-09T17:30:00-03:00"));
  await open(page);
  const clock = world(page).getByRole("link", { name: /Son las 17:30/ });
  await expect(clock).toBeVisible();
  await expect(clock).toContainText("Buena hora para la merienda.");
  await expect(clock).toHaveAttribute("href", "#merienda");
  // La insignia solo aparece en la parada de la merienda.
  const badges = world(page).locator("[data-stop] [data-now]:not([hidden])");
  await expect(badges).toHaveCount(1);
  await expect(page.locator("#merienda")).toContainText("Ahora");
});

test("el raíl lleva a cada momento del día", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "d1440", "El raíl se muestra en escritorio.");
  await open(page);
  const rail = page.getByRole("navigation", { name: "Momentos del día" });
  await expect(rail.getByRole("link")).toHaveCount(moments.length + 1);
  await rail.getByRole("link", { name: /Merienda/ }).click();
  await expect(page).toHaveURL(/#merienda$/);
  await expect(page.locator("#merienda")).toHaveAttribute("data-current", "", { timeout: 8000 });
  await expect(rail.getByRole("link", { name: /Merienda/ })).toHaveAttribute("aria-current", "true");
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("las fotos se funden sin acercarse y el sello no gira", async ({ page }) => {
    await open(page);
    await goToStop(page, 2);
    await expect(stops(page).nth(2)).toHaveAttribute("data-current", "");
    const transforms = await frames(page).evaluateAll((elements) => elements.map((el) => (el as HTMLElement).style.transform));
    expect(transforms.every((value) => value === "")).toBe(true);
    expect(await world(page).locator("[data-day-seal]").evaluate((el) => (el as HTMLElement).style.rotate)).toBe("");
  });
});
