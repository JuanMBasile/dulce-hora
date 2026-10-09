import { expect, test, type Page } from "@playwright/test";
import { branches } from "../../app/data/branches";

// Buscador de sucursales con JavaScript: búsqueda sin tildes, filtros por zona, estado
// anunciado, vacío con salida y movimiento. La versión sin JS se prueba en seo-nojs.

const section = (page: Page) => page.locator("#sucursales");
const searchbox = (page: Page) => section(page).getByRole("searchbox", { name: "Buscá por barrio, calle o ciudad" });
const chip = (page: Page, name: RegExp) =>
  section(page).getByRole("group", { name: "Zona" }).getByRole("button", { name });
const status = (page: Page) => section(page).getByRole("status");
const areas = (page: Page) => section(page).getByRole("heading", { level: 4 });
const addressLinks = (page: Page) => section(page).getByRole("link", { name: /cómo llegar/ });
const drumWord = (page: Page) => section(page).locator('[class*="drumIn"]');

const count = (region?: string) => branches.filter((branch) => !region || branch.region === region).length;

/** Abre la Home y espera a que el buscador (chunk diferido) haya hidratado. */
async function open(page: Page) {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await section(page).scrollIntoViewIfNeeded();
  // Los filtros reciben aria-pressed recién al hidratar.
  await expect(chip(page, /^Todas/)).toHaveAttribute("aria-pressed", "true");
}

test("hidrata el buscador sin errores de consola", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await expect(addressLinks(page)).toHaveCount(branches.length);
  expect(errors).toEqual([]);
});

test("busca sin importar tildes, resalta la coincidencia y anuncia el resultado", async ({ page }) => {
  await open(page);
  await searchbox(page).fill("gascon");

  await expect(addressLinks(page)).toHaveCount(1);
  const link = addressLinks(page).first();
  await expect(link).toHaveAccessibleName("Gascón 645, Almagro: cómo llegar (Google Maps)");
  await expect(link.locator("mark")).toHaveText("Gascón");
  await expect(areas(page)).toHaveText(["Almagro"]);
  await expect(status(page)).toHaveText("1 sucursal para «gascon»");
});

test("la búsqueda exige todas las palabras y cuenta por zona", async ({ page }) => {
  await open(page);
  await searchbox(page).fill("san juan");

  await expect(addressLinks(page)).toHaveCount(2);
  await expect(chip(page, /^Todas/)).toHaveAccessibleName("Todas 2");
  await expect(chip(page, /^CABA/)).toHaveAccessibleName("CABA 1");
  await expect(chip(page, /^Rosario/)).toHaveAccessibleName("Rosario 1");

  await searchbox(page).fill("san juan rosario");
  await expect(addressLinks(page)).toHaveCount(1);
  await expect(addressLinks(page).first()).toHaveAccessibleName(/^San Juan 1538/);
});

test("filtra por zona con los botones y vuelve a todas", async ({ page }) => {
  await open(page);
  await chip(page, /^Rosario/).click();

  await expect(chip(page, /^Rosario/)).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, /^Todas/)).toHaveAttribute("aria-pressed", "false");
  await expect(addressLinks(page)).toHaveCount(count("rosario"));
  await expect(section(page).getByRole("heading", { level: 3 })).toHaveText([`Rosario ${count("rosario")} sucursales`]);
  await expect(status(page)).toHaveText(`${count("rosario")} sucursales en Rosario`);

  await chip(page, /^Todas/).click();
  await expect(addressLinks(page)).toHaveCount(branches.length);
});

test("cada dirección abre la ficha del local en Google Maps", async ({ page }) => {
  await open(page);
  const link = section(page).getByRole("link", { name: /^Tucumán 1330/ });
  await expect(link).toHaveAttribute(
    "href",
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Dulce Hora, Tucumán 1330, Rosario, Santa Fe")}`,
  );
  await expect(section(page).getByRole("link", { name: /Cerca de mí, en Google Maps/ })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search\/\?api=1&query=Dulce%20Hora/,
  );
});

test("sin resultados ofrece borrar la búsqueda y abrir una franquicia", async ({ page }) => {
  await open(page);
  await searchbox(page).fill("tierra del fuego");

  await expect(addressLinks(page)).toHaveCount(0);
  await expect(section(page).getByText("No encontramos «tierra del fuego»")).toBeVisible();
  await expect(section(page).getByRole("link", { name: "Abrí el tuyo" })).toHaveAttribute("href", "#franquicias");
  await expect(status(page)).toHaveText("No hay sucursales para «tierra del fuego»");

  await section(page).getByRole("button", { name: "Borrar la búsqueda" }).last().click();
  await expect(searchbox(page)).toHaveValue("");
  await expect(addressLinks(page)).toHaveCount(branches.length);
});

test("si la zona elegida no tiene resultados, sugiere las demás", async ({ page }) => {
  await open(page);
  await chip(page, /^Rosario/).click();
  await searchbox(page).fill("boedo");

  await expect(section(page).getByText("No hay resultados en Rosario")).toBeVisible();
  await section(page).getByRole("button", { name: "Ver todas las zonas" }).click();
  await expect(chip(page, /^Todas/)).toHaveAttribute("aria-pressed", "true");
  await expect(areas(page)).toHaveText(["Boedo"]);
});

test("el botón de borrar limpia la búsqueda y devuelve el foco al campo", async ({ page }) => {
  await open(page);
  await searchbox(page).fill("flores");
  await expect(addressLinks(page)).toHaveCount(2);
  await section(page).getByRole("button", { name: "Borrar la búsqueda" }).click();
  await expect(searchbox(page)).toHaveValue("");
  await expect(searchbox(page)).toBeFocused();
});

test("el contador y el tambor acompañan el filtro", async ({ page }) => {
  await open(page);
  const digits = () =>
    section(page)
      .locator('[class*="digit"]')
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).style.getPropertyValue("--d")).join(""),
      );
  expect(await digits()).toBe(String(branches.length));

  await chip(page, /^Rosario/).click();
  await expect.poll(digits).toBe(String(count("rosario")));
  await expect(drumWord(page)).toHaveText("Rosario");

  await searchbox(page).fill("caballito");
  await chip(page, /^Todas/).click();
  await expect.poll(digits).toBe("5");
  await expect(drumWord(page)).toHaveText("Caballito");
});

test("con movimiento, el tambor recorre los barrios y la lista se desliza al filtrar", async ({ page }) => {
  await open(page);
  // El tambor gira solo mientras está a la vista (en móvil queda arriba del listado).
  await drumWord(page).scrollIntoViewIfNeeded();
  // Pasa de "tu barrio" a un barrio real, y sigue.
  await expect(drumWord(page)).not.toHaveText("tu barrio", { timeout: 5000 });
  const first = await drumWord(page).textContent();
  await expect(drumWord(page)).not.toHaveText(first ?? "", { timeout: 5000 });

  await chip(page, /^CABA/).click();
  const flips = await section(page).evaluate(
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => (animation as Animation & { id: string }).id === "flip").length,
  );
  expect(flips).toBeGreaterThan(0);
});

// El sello: las sucursales aparecen dispersas y se acomodan en el festón.
const stage = (page: Page) => section(page).locator('[class*="stage"]');
const dots = (page: Page) => stage(page).locator("[data-dot]");
const RING_POINTS = 12 * Math.max(8, Math.ceil(branches.length / 12));

async function waitFormed(page: Page) {
  await stage(page).scrollIntoViewIfNeeded();
  await expect(stage(page)).toHaveAttribute("data-formed", { timeout: 8000 });
}

test("las sucursales aparecen dispersas, con sus barrios, y forman el sello", async ({ page }) => {
  await open(page);
  await expect(stage(page)).toHaveAttribute("aria-hidden", "true");
  await expect(dots(page)).toHaveCount(RING_POINTS);
  await stage(page).scrollIntoViewIfNeeded();
  // Mientras están dispersas, algunos barrios se nombran.
  await expect
    .poll(() =>
      stage(page)
        .locator("[data-label]")
        .evaluateAll((labels) => Math.max(...labels.map((label) => Number(getComputedStyle(label).opacity)))),
    )
    .toBeGreaterThan(0.9);

  await waitFormed(page);
  // Formado: cada punto en su lugar del festón, sin transformaciones, y los nombres ya no están.
  const transforms = await dots(page).evaluateAll((elements) => [
    ...new Set(elements.map((element) => getComputedStyle(element).transform)),
  ]);
  expect(transforms).toEqual(["none"]);
  const opacities = await dots(page).evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity)),
  );
  expect(Math.min(...opacities)).toBe(1);
  const labels = await stage(page)
    .locator("[data-label]")
    .evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
  expect(Math.max(...labels)).toBe(0);
  expect(
    await stage(page)
      .locator("[data-sprig]")
      .evaluate((sprig) => getComputedStyle(sprig).opacity),
  ).toBe("1");
});

test("la búsqueda y los filtros encienden sus sucursales en el sello", async ({ page }) => {
  await open(page);
  await waitFormed(page);

  await searchbox(page).fill("caballito");
  await expect(stage(page).locator("[data-dot][data-lit]")).toHaveCount(5);
  await expect(stage(page).locator("[data-dot][data-dim]")).toHaveCount(RING_POINTS - 5);

  await searchbox(page).fill("");
  await chip(page, /^Rosario/).click();
  await expect(stage(page).locator("[data-dot][data-lit]")).toHaveCount(count("rosario"));

  await chip(page, /^Todas/).click();
  await expect(stage(page).locator("[data-dot][data-dim]")).toHaveCount(0);
});

test("sin filtro, el sello enciende las sucursales del barrio que nombra el tambor", async ({ page }) => {
  await open(page);
  await waitFormed(page);
  await drumWord(page).scrollIntoViewIfNeeded();
  await expect(drumWord(page)).not.toHaveText("tu barrio", { timeout: 5000 });
  // Se leen juntos, en un mismo frame: el tambor puede girar entre dos lecturas.
  const { area, lit } = await page.evaluate(() => ({
    area: document.querySelector('#sucursales [class*="drumIn"]')?.textContent ?? "",
    lit: document.querySelectorAll('#sucursales [class*="stage"] [data-dot][data-lit]').length,
  }));
  expect(lit).toBe(branches.filter((branch) => branch.area === area).length);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("el sello aparece ya formado, sin coreografía", async ({ page }) => {
    await open(page);
    await stage(page).scrollIntoViewIfNeeded();
    await expect(stage(page)).toHaveAttribute("data-formed");
    const opacities = await dots(page).evaluateAll((elements) =>
      elements.map((element) => Number(getComputedStyle(element).opacity)),
    );
    expect(Math.min(...opacities)).toBe(1);
    const running = await stage(page).evaluate(
      (element) =>
        element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    );
    expect(running).toBe(0);
  });

  test("el tambor queda quieto y los cambios son instantáneos", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(3000);
    await expect(drumWord(page)).toHaveText("tu barrio");

    await chip(page, /^Rosario/).click();
    await expect(drumWord(page)).toHaveText("Rosario");
    // Ni FLIP ni revelado: en el listado no corre ninguna animación.
    const running = await section(page)
      .locator('[class*="boardBody"]')
      .evaluate(
        (element) =>
          element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
      );
    expect(running).toBe(0);
  });
});

test("Enter cierra el teclado y deja el listado a la vista", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("m"), "El listado queda abajo del buscador solo en móvil.");
  await open(page);
  await searchbox(page).fill("boedo");
  await searchbox(page).press("Enter");
  await expect(searchbox(page)).not.toBeFocused();
  await expect(section(page).getByRole("link", { name: /^Av\. San Juan 3405/ })).toBeInViewport();
});
