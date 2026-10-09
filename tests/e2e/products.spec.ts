import { expect, test, type Page } from "@playwright/test";
import { moments } from "../../app/data/products";

// Dial "Un día en Dulce Hora" con JavaScript: pestañas ARIA, teclado, la aguja y el
// momento por defecto según la hora del visitante. La versión sin JS se prueba en seo-nojs.

const angleOf = (label: string) => {
  const moment = moments.find((item) => item.label === label);
  if (!moment) throw new Error(`Momento desconocido: ${label}`);
  return (moment.hour - 12) * 15;
};

/** Ángulo actual de la aguja, normalizado a [0, 360). */
async function beadAngle(page: Page) {
  const rotate = await page.locator('[class*="orbit"]').evaluate((element) => (element as HTMLElement).style.rotate);
  return ((parseFloat(rotate) % 360) + 360) % 360;
}

const normalize = (angle: number) => ((angle % 360) + 360) % 360;

// Durante el fundido (200 ms) el panel saliente sigue visible: el activo se identifica por su estado.
const activePanel = (page: Page) => page.locator('[role="tabpanel"][data-active]');

async function openAt(page: Page, time: Date) {
  await page.clock.setFixedTime(time);
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.locator("#productos").scrollIntoViewIfNeeded();
}

test("arranca en el momento actual del visitante y lo marca como «ahora»", async ({ page }) => {
  await openAt(page, new Date(2026, 9, 9, 17, 30));
  const tablist = page.getByRole("tablist", { name: "Momentos del día" });
  await expect(tablist.getByRole("tab")).toHaveCount(4);
  const merienda = tablist.getByRole("tab", { name: /Merienda/ });
  await expect(merienda).toHaveAttribute("aria-selected", "true");
  await expect(merienda).toContainText("ahora");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(activePanel(page).getByRole("heading", { level: 3 })).toHaveText("Para la merienda");
  await expect.poll(() => beadAngle(page)).toBeCloseTo(normalize(angleOf("Merienda")), 0);
});

test("cambia de momento con clic y deja un solo panel visible", async ({ page }) => {
  await openAt(page, new Date(2026, 9, 9, 9, 0));
  await page.getByRole("tab", { name: /Mediodía/ }).click();

  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  const panel = activePanel(page);
  await expect(panel).toHaveAccessibleName(/Mediodía/);
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Para el mediodía");
  await expect(panel.getByRole("listitem").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Para la mañana" })).toBeHidden();
  await expect.poll(() => beadAngle(page)).toBeCloseTo(normalize(angleOf("Mediodía")), 0);
});

test("se maneja con flechas, Inicio y Fin (foco móvil entre pestañas)", async ({ page }) => {
  await openAt(page, new Date(2026, 9, 9, 9, 0));
  const tab = (name: RegExp) => page.getByRole("tab", { name });

  await tab(/Mañana/).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(/Mediodía/)).toBeFocused();
  await expect(tab(/Mediodía/)).toHaveAttribute("aria-selected", "true");
  await expect(tab(/Mañana/)).toHaveAttribute("tabindex", "-1");

  await page.keyboard.press("End");
  await expect(tab(/Para festejar/)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(tab(/Mañana/)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(tab(/Para festejar/)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tab(/Mañana/)).toHaveAttribute("aria-selected", "true");

  // Tab sale del grupo de pestañas y entra al panel activo.
  await page.keyboard.press("Tab");
  await expect(activePanel(page)).toBeFocused();
});

test("los cambios rápidos terminan coherentes: pestaña, panel y aguja", async ({ page }) => {
  await openAt(page, new Date(2026, 9, 9, 9, 0));
  for (const label of ["Mediodía", "Para festejar", "Merienda", "Mañana", "Para festejar"]) {
    await page.getByRole("tab", { name: new RegExp(label) }).click({ delay: 0 });
  }
  await expect(page.getByRole("tab", { selected: true })).toContainText("Para festejar");
  await expect(activePanel(page).getByRole("heading", { level: 3 })).toHaveText("Para festejar");
  await expect.poll(() => beadAngle(page)).toBeCloseTo(normalize(angleOf("Para festejar")), 0);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("la aguja salta sin animar y el panel cambia sin desplazamientos", async ({ page }) => {
    await openAt(page, new Date(2026, 9, 9, 9, 0));
    await page.getByRole("tab", { name: /Merienda/ }).click();
    expect(await beadAngle(page)).toBeCloseTo(normalize(angleOf("Merienda")), 3);
    const animations = await activePanel(page).evaluate((panel) => panel.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length);
    expect(animations).toBe(0);
  });
});
