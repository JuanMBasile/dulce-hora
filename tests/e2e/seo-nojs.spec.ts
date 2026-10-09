import { expect, test } from "@playwright/test";

// El HTML prerenderizado tiene que traer el contenido real, sin depender de JS.
// Este spec crece en cada hito (ver plan, sección 7).

test.describe("HTML prerenderizado (sin ejecutar JS)", () => {
  test("trae idioma, metadatos y el texto principal del hero", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toMatch(/<html lang="es-AR"/);
    expect(html).toContain("<title>Dulce Hora | Panadería y pastelería</title>");
    expect(html).toMatch(/<meta name="description" content="Medialunas, facturas, panificados y pastelería[^"]+"/);
    expect(html).toContain("<h1>Siempre es buena hora para algo rico.</h1>");
    expect(html).toContain(
      "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece.",
    );
  });
});

test.describe("Página con JavaScript desactivado", () => {
  test("muestra el título y el texto principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Siempre es buena hora para algo rico.");
    await expect(page.getByText("elaborados cada día, con la calidad y el precio que tu barrio merece.")).toBeVisible();
  });
});
