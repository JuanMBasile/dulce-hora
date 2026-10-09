import { expect, test, type Page } from "@playwright/test";
import { story } from "../../app/data/story";

// Escena "Nuestra historia" con JavaScript: queda fija, el festón se abre hasta cubrir la
// pantalla y el manifiesto se enciende. La versión sin JS se prueba en seo-nojs.

const scene = (page: Page) => page.locator("#historia > div").first();
const stage = (page: Page) => scene(page).locator("> div");
const words = (page: Page) => page.locator("#historia p").first().locator("span");

async function open(page: Page) {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/** Lleva el scroll a una fracción del recorrido fijo de la escena (0 = se fija, 1 = se suelta). */
async function scrollScene(page: Page, fraction: number) {
  await scene(page).evaluate((element, fraction) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + fraction * (element.getBoundingClientRect().height - window.innerHeight));
  }, fraction);
}

/** ¿La foto de la ventana se ve en la esquina superior izquierda del escenario? El hit-test respeta el clip-path. */
const photoAtCorner = (page: Page) =>
  stage(page).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return document.elementsFromPoint(box.left + 4, box.top + 4).some((hit) => hit.tagName === "IMG");
  });

const opacities = (page: Page) =>
  words(page).evaluateAll((spans) => spans.map((span) => Number(getComputedStyle(span).opacity)));

test("la escena queda fija y el festón se abre hasta mostrar el manifiesto completo", async ({ page }) => {
  await open(page);
  const viewport = page.viewportSize()!;
  expect(await scene(page).evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(
    viewport.height * 2.5,
  );
  await expect(words(page)).toHaveCount(story.manifesto.split(" ").length);

  // Al fijarse: el título flanquea un sello chico y el manifiesto todavía no se ve.
  await scrollScene(page, 0.02);
  await expect(page.getByRole("heading", { level: 2, name: "Nuestra historia" })).toBeInViewport();
  expect(await stage(page).evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
  expect(await photoAtCorner(page)).toBe(false);
  await expect
    .poll(() =>
      page
        .locator("#historia p")
        .first()
        .evaluate((p) => Number(getComputedStyle(p.parentElement!).opacity)),
    )
    .toBeLessThan(0.05);

  // A mitad del recorrido, el escenario sigue fijo bajo el header.
  await scrollScene(page, 0.5);
  const header = await page.getByRole("banner").evaluate((element) => element.getBoundingClientRect().height);
  await expect
    .poll(() => stage(page).evaluate((element) => Math.round(element.getBoundingClientRect().top)))
    .toBe(Math.round(header));

  // Al final: la foto cubre toda la pantalla y cada palabra quedó encendida.
  await scrollScene(page, 1);
  await expect.poll(() => photoAtCorner(page)).toBe(true);
  await expect.poll(async () => Math.min(...(await opacities(page)))).toBeCloseTo(1, 2);
  await expect(page.getByText(story.manifesto)).toBeInViewport();
});

test("el manifiesto se enciende en orden de lectura", async ({ page }) => {
  await open(page);
  await scrollScene(page, 0.72);
  // A mitad de la lectura: la primera palabra ya está encendida y la última todavía no.
  await expect.poll(async () => (await opacities(page))[0]).toBeGreaterThan(0.95);
  await page.waitForTimeout(400);
  const values = await opacities(page);
  expect(values.at(-1)).toBeLessThan(0.9);
  // Nunca una palabra posterior está más encendida que una anterior.
  for (let index = 1; index < values.length; index++)
    expect(values[index]!).toBeLessThanOrEqual(values[index - 1]! + 1e-6);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("no hay escena fija: la composición queda quieta y el manifiesto se lee entero", async ({ page }) => {
    await open(page);
    await scene(page).scrollIntoViewIfNeeded();
    const viewport = page.viewportSize()!;
    expect(await stage(page).evaluate((element) => getComputedStyle(element).position)).not.toBe("sticky");
    expect(await scene(page).evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(
      viewport.height * 1.6,
    );
    expect(Math.min(...(await opacities(page)))).toBe(1);
    await expect(page.getByRole("img", { name: /Medialunas de manteca/ })).toBeVisible();
    await expect(page.getByText(story.manifesto)).toBeVisible();
  });
});
