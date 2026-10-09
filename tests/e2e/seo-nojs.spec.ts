import { expect, test } from "@playwright/test";
import { branches } from "../../app/data/branches";
import { moments } from "../../app/data/products";
import { story } from "../../app/data/story";
import { branchMapsQuery } from "../../app/lib/branches";
import { mapsSearchUrl } from "../../app/lib/urls";

// El HTML prerenderizado tiene que traer el contenido real, sin depender de JS.
// Este spec crece en cada hito (ver plan, sección 7).

const HERO_TITLE = "Siempre es buena hora para algo rico.";
const HERO_LEAD =
  "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el precio que tu barrio merece.";
const SECTION_HEADINGS = [
  "Un día en Dulce Hora",
  "Nuestra historia",
  "Panaderías cerca de casa",
  "Abrí tu propio Dulce Hora",
];
const NAV = [
  { label: "Productos", href: "#productos" },
  { label: "Nosotros", href: "#historia" },
  { label: "Sucursales", href: "#sucursales" },
  { label: "Franquicias", href: "#franquicias" },
];

/** Texto de los encabezados de un nivel, sin etiquetas internas: el H1 parte cada
 *  palabra en spans para animarla y los acentos de color van en otro span. */
const headings = (source: string, level: number) =>
  [...source.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, "g"))].map((match) =>
    (match[1] ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

test.describe("HTML prerenderizado (sin ejecutar JS)", () => {
  let html = "";

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    html = await response.text();
  });

  test("trae idioma, título, descripción y metadatos sociales", () => {
    expect(html).toMatch(/<html lang="es-AR"/);
    expect(html).toContain("<title>Dulce Hora | Panadería y pastelería</title>");
    expect(html).toMatch(/<meta name="description" content="Medialunas, facturas, panificados y pastelería[^"]+"/);
    expect(html).toContain('<link rel="canonical" href="https://www.dulcehora.com.ar/"/>');
    expect(html).toContain('<meta property="og:url" content="https://www.dulcehora.com.ar/"/>');
    expect(html).toContain('<meta property="og:locale" content="es_AR"/>');
    expect(html).toContain('<meta property="og:title" content="Dulce Hora | Panadería y pastelería"/>');
    expect(html).toContain('<meta name="theme-color" content="#d50d17"/>');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest"/>');
    expect(html).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>');
  });

  test("trae un JSON-LD válido, solo con Organization", () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
    expect(blocks).toHaveLength(1);
    const data = JSON.parse(blocks[0]?.[1] ?? "");
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Organization");
    expect(data.url).toBe("https://www.dulcehora.com.ar/");
    expect(data.sameAs).toEqual(["https://www.instagram.com/dulcehoraoficial/"]);
    expect(data.contactPoint[0]).toMatchObject({ email: "dulcehoraf@gmail.com", telephone: "+5491150027657" });
  });

  test("trae el H1, el texto principal y el título de cada sección", () => {
    expect(headings(html, 1)).toEqual([HERO_TITLE]);
    expect(html).toContain(HERO_LEAD);
    expect(headings(html, 2)).toEqual(expect.arrayContaining(SECTION_HEADINGS));
  });

  test("trae los cuatro momentos con todas sus categorías y productos", () => {
    const h3 = headings(html, 3);
    const h4 = headings(html, 4);
    for (const moment of moments) {
      expect(h3).toContain(moment.heading);
      for (const category of moment.categories) {
        expect(h4).toContain(category.name);
        for (const item of category.items) expect(html).toContain(`<li>${item}</li>`);
      }
    }
    // Los roles de pestañas se agregan recién al hidratar, y nada se oculta con `hidden`.
    expect(html).not.toContain('role="tab"');
    // (Se mira solo <main>: React usa un <div hidden> propio para sus scripts de streaming).
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    expect(main).not.toMatch(/<[a-z]+[^>]*\shidden(=""|\s|\/?>)/);
  });

  test("trae la historia completa: manifiesto, origen, valores y cierre", () => {
    // El manifiesto se parte en una palabra por span para encenderlas con el scroll.
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
    expect(text).toContain(story.manifesto);
    expect(text).toContain(story.closing);
    expect(html).toContain(story.origin);
    expect(headings(html, 3)).toEqual(expect.arrayContaining([story.originTitle, story.valuesTitle]));
    expect(headings(html, 4)).toEqual(expect.arrayContaining(story.values.map((value) => value.name)));
    for (const value of story.values) expect(html).toContain(value.text);
  });

  test("trae el listado completo de sucursales en su lugar, con enlaces a Google Maps", () => {
    // El buscador va en un chunk diferido: el HTML lo trae completo y dentro de <main>,
    // no en un <div hidden> que solo JavaScript ubica (ver app/entry.server.tsx).
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    expect(main).toContain('id="sucursales"');
    for (const branch of branches) {
      expect(main).toContain(branch.address);
      expect(main).toContain(`href="${mapsSearchUrl(branchMapsQuery(branch)).replace("&", "&amp;")}"`);
    }
    expect(html).not.toMatch(/<div hidden id="S:/);
    // El CSS de la sección está enlazado en el HTML, no llega con el chunk.
    expect(html).toMatch(/<link rel="stylesheet" href="\/assets\/style-[^"]+\.css"\/>/);
  });

  test("trae los enlaces de navegación, los CTA y los contactos reales", () => {
    for (const item of NAV) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`id="${item.href.slice(1)}"`);
    }
    expect(html).toContain('href="#inicio"');
    expect(html).toContain('href="#contenido"');
    expect(html).toContain(
      'href="https://wa.me/5491150027657?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20las%20franquicias%20de%20Dulce%20Hora."',
    );
    expect(html).toContain('href="mailto:dulcehoraf@gmail.com?subject=Franquicias%20Dulce%20Hora"');
    expect(html).toContain('href="https://www.instagram.com/dulcehoraoficial/"');
    expect(html).not.toMatch(/href="#"/);
  });

  test("las rutas inexistentes responden un 404 real", async ({ request }) => {
    const response = await request.get("/no-existe");
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).toContain('<meta name="robots" content="noindex">');
    expect(body).toContain('href="/"');
  });
});

test.describe("Página con JavaScript desactivado", () => {
  test("muestra el título y el texto principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(HERO_TITLE);
    await expect(page.getByText(HERO_LEAD)).toBeVisible();
  });

  test("la navegación del header queda visible y operable", async ({ page }) => {
    await page.goto("/");
    // El botón de menú depende de JS: sin JS no se muestra.
    await expect(page.getByRole("button", { name: "Menú" })).toBeHidden();

    const nav = page.getByRole("navigation", { name: "Principal" });
    for (const item of NAV) {
      await expect(nav.getByRole("link", { name: item.label })).toBeVisible();
      await expect(nav.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    await nav.getByRole("link", { name: "Sucursales" }).click();
    await expect(page).toHaveURL(/#sucursales$/);
    await expect(page.getByRole("heading", { level: 2, name: "Panaderías cerca de casa" })).toBeInViewport();
  });

  test("los cuatro momentos de productos quedan visibles y completos", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#productos");
    // El dial y sus pestañas dependen de JS: sin JS no se muestran.
    await expect(section.getByRole("button")).toHaveCount(0);

    for (const moment of moments) {
      const panel = section.getByRole("region", { name: moment.heading });
      await expect(panel.getByRole("heading", { level: 3 })).toBeVisible();
      const items = moment.categories.flatMap((category) => category.items);
      await expect(panel.getByRole("listitem")).toHaveText(items);
      for (const item of await panel.getByRole("listitem").all()) await expect(item).toBeVisible();
    }
  });

  test("la historia queda quieta, completa y visible", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#historia");
    // Sin JS no hay escena fija: la sección mide lo que su contenido.
    expect(await section.evaluate((element) => element.firstElementChild!.getBoundingClientRect().height)).toBeLessThan(
      1600,
    );
    await expect(section.getByRole("heading", { level: 2, name: "Nuestra historia" })).toBeVisible();
    await expect(section.getByRole("img", { name: /Medialunas de manteca/ })).toBeVisible();
    await section.getByText(story.manifesto).scrollIntoViewIfNeeded();
    await expect(section.getByText(story.manifesto)).toBeVisible();
    expect(await section.getByText(story.manifesto).evaluate((element) => getComputedStyle(element).color)).toBe(
      "rgb(34, 20, 15)",
    );
    for (const value of story.values) {
      await expect(section.getByRole("heading", { level: 4, name: value.name })).toBeVisible();
      await expect(section.getByText(value.text)).toBeVisible();
    }
  });

  test("las sucursales quedan listadas y visibles, sin buscador", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#sucursales");
    // La búsqueda y los filtros dependen de JS: sin JS no se muestran.
    await expect(section.getByRole("searchbox")).toBeHidden();
    await expect(section.getByRole("button")).toHaveCount(0);

    const links = section.getByRole("link", { name: /cómo llegar/ });
    await expect(links).toHaveCount(branches.length);
    for (const link of [links.first(), links.last()]) {
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
    }
    await expect(section.getByRole("link", { name: /Cerca de mí, en Google Maps/ })).toBeVisible();

    // El sello de sucursales se ve ya formado, sin los nombres de la coreografía.
    const stage = section.locator('[class*="stage"]');
    await stage.scrollIntoViewIfNeeded();
    const dots = await stage
      .locator("[data-dot]")
      .evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
    expect(dots.length).toBeGreaterThanOrEqual(branches.length);
    expect(Math.min(...dots)).toBe(1);
    expect(
      await stage
        .locator("[data-label]")
        .first()
        .evaluate((label) => getComputedStyle(label).opacity),
    ).toBe("0");
  });

  test("el pie trae la navegación y los contactos visibles", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /WhatsApp/ })).toBeVisible();
    await expect(footer.getByRole("link", { name: "dulcehoraf@gmail.com" })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Instagram/ })).toBeVisible();
    await expect(footer.getByRole("navigation", { name: "Secciones" }).getByRole("link")).toHaveCount(NAV.length);
  });
});
