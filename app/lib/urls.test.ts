import { describe, expect, it } from "vitest";
import { mailtoUrl, mapsSearchUrl, whatsappUrl } from "./urls";

describe("whatsappUrl", () => {
  it("deja solo los dígitos del teléfono", () => {
    expect(whatsappUrl("+54 9 11 5002-7657")).toBe("https://wa.me/5491150027657");
  });

  it("codifica el mensaje precargado", () => {
    expect(whatsappUrl("5491150027657", "Hola, quiero información sobre franquicias & más")).toBe(
      "https://wa.me/5491150027657?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20franquicias%20%26%20m%C3%A1s",
    );
  });
});

describe("mailtoUrl", () => {
  it("codifica el asunto", () => {
    expect(mailtoUrl("dulcehoraf@gmail.com", "Franquicias Dulce Hora")).toBe(
      "mailto:dulcehoraf@gmail.com?subject=Franquicias%20Dulce%20Hora",
    );
  });
});

describe("mapsSearchUrl", () => {
  it("usa la API de búsqueda de Maps y codifica la dirección", () => {
    expect(mapsSearchUrl("Av. de Mayo 730, Ramos Mejía")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20de%20Mayo%20730%2C%20Ramos%20Mej%C3%ADa",
    );
  });
});
