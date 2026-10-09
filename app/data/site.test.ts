import { describe, expect, it } from "vitest";
import { heroCopy, heroOptions, site } from "./site";

describe("datos del sitio", () => {
  it("usa la alternativa A del hero por defecto", () => {
    expect(heroCopy).toBe(heroOptions.a);
    expect(heroCopy.title).toBe("Siempre es buena hora para algo rico.");
  });

  it("tiene una URL canónica absoluta con https y sin barra final", () => {
    expect(site.url).toMatch(/^https:\/\/[^/]+$/);
  });
});
