import { expect, test, type Page } from "@playwright/test";

// Estructura base de la página: desborde, estabilidad visual, skip link,
// anclas y header según el ancho. Corre en m375, m390, t768 y d1440.

const DESKTOP_MIN_WIDTH = 1024; // 64rem

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function gotoHydrated(page: Page) {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "");
}

test("no hay desborde horizontal", async ({ page }) => {
  await gotoHydrated(page);
  expect(await horizontalOverflow(page)).toBe(0);
});

test("no hay desborde horizontal a 320 px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "m375", "Alcanza con probarlo en un solo proyecto móvil.");
  await page.setViewportSize({ width: 320, height: 640 });
  await gotoHydrated(page);
  expect(await horizontalOverflow(page)).toBe(0);
});

test("no hay corrimientos de layout al cargar ni al recorrer la página", async ({ page }) => {
  await page.addInitScript(() => {
    const store = window as unknown as { __cls: number };
    store.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) store.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await gotoHydrated(page);
  await page.evaluate(() => document.fonts.ready);

  // Recorre la página de arriba abajo, como un scroll real.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.mouse.wheel(0, 400);
  }
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  expect(cls).toBe(0);
});

test("el skip link aparece con el teclado y lleva al contenido", async ({ page }) => {
  await gotoHydrated(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenido$/);
  await expect(page.locator("main#contenido")).toBeFocused();
});

test("cada ancla de la página apunta a un id existente", async ({ page }) => {
  await gotoHydrated(page);
  const hrefs = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of new Set(hrefs)) {
    expect(href, "No se permiten anclas vacías").not.toBe("#");
    await expect(page.locator(`[id="${href!.slice(1)}"]`), `Falta el destino de ${href}`).toHaveCount(1);
  }
});

test("el header muestra la navegación que corresponde al ancho", async ({ page }) => {
  await gotoHydrated(page);
  const width = page.viewportSize()!.width;
  const header = page.getByRole("banner");
  const nav = header.getByRole("navigation", { name: "Principal" });
  const toggle = header.getByRole("button", { name: "Menú" });
  const cta = header.getByRole("link", { name: "Encontrá tu sucursal" });

  await expect(header.getByRole("link", { name: "Dulce Hora, ir al inicio" })).toBeVisible();
  if (width >= DESKTOP_MIN_WIDTH) {
    await expect(nav).toBeVisible();
    await expect(cta).toBeVisible();
    await expect(toggle).toBeHidden();
  } else {
    await expect(toggle).toBeVisible();
    await expect(nav).toBeHidden();
    await expect(cta).toBeHidden();
  }
});

test("el header queda fijo y se compacta al bajar", async ({ page }) => {
  await gotoHydrated(page);
  const header = page.getByRole("banner");
  await expect(header).not.toHaveAttribute("data-compact");

  await page.mouse.wheel(0, 900);
  await expect(header).toHaveAttribute("data-compact", "");
  await expect(header).toBeInViewport();
  expect((await header.boundingBox())!.y).toBe(0);
});
