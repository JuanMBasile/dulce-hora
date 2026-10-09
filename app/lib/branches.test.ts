import { describe, expect, it } from "vitest";
import { branches, regions } from "~/data/branches";
import {
  areasOf,
  branchMapsQuery,
  countByRegion,
  describeResults,
  fold,
  foldWithIndex,
  groupBranches,
  highlight,
  indexBranches,
  matchesBranch,
  regionOf,
  tokenize,
} from "./branches";

const indexed = indexBranches(branches);
const search = (query: string) => indexed.filter((branch) => matchesBranch(branch, tokenize(query)));

describe("fold", () => {
  it("compara sin tildes, diéresis, mayúsculas ni puntuación", () => {
    expect(fold("Av. Güemes 3792")).toBe("av guemes 3792");
    expect(fold("  Las   Cañitas ")).toBe("las canitas");
    expect(fold("NÚÑEZ")).toBe("nunez");
    expect(fold("«¿Dónde?»")).toBe("donde");
  });

  it("recuerda de qué caracter del original sale cada caracter plegado", () => {
    const { folded, index } = foldWithIndex("Av. Ángel");
    expect(folded).toBe("av angel");
    expect(index).toEqual([0, 1, 2, 4, 5, 6, 7, 8]);
  });
});

describe("tokenize", () => {
  it("separa la búsqueda en palabras plegadas", () => {
    expect(tokenize("  Avenida  San Juan ")).toEqual(["avenida", "san", "juan"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("búsqueda", () => {
  it("sin palabras, muestra todas", () => {
    expect(search("")).toHaveLength(branches.length);
  });

  it("encuentra por barrio, calle, altura y zona", () => {
    expect(search("caballito")).toHaveLength(5);
    expect(search("gascon").map((branch) => branch.address)).toEqual(["Gascón 645"]);
    expect(search("3405").map((branch) => branch.area)).toEqual(["Boedo"]);
    expect(search("rosario")).toHaveLength(branches.filter((branch) => branch.region === "rosario").length);
    expect(search("capital federal")).toHaveLength(branches.filter((branch) => branch.region === "caba").length);
  });

  it("exige todas las palabras", () => {
    expect(search("san juan").map((branch) => branch.address)).toEqual(["Av. San Juan 3405", "San Juan 1538"]);
    expect(search("san juan rosario").map((branch) => branch.address)).toEqual(["San Juan 1538"]);
  });

  it("entiende alias, abreviaturas y nombres pegados", () => {
    expect(search("recoleta").map((branch) => branch.area)).toEqual(["Barrio Norte"]);
    expect(search("avenida san juan").map((branch) => branch.area)).toEqual(["Boedo"]);
    expect(search("montecastro").map((branch) => branch.area)).toEqual(["Monte Castro"]);
    expect(search("canitas").map((branch) => branch.area)).toEqual(["Las Cañitas"]);
  });

  it("no encuentra lo que no está", () => {
    expect(search("tierra del fuego")).toEqual([]);
  });
});

describe("listado", () => {
  it("cada sucursal tiene zona conocida, barrio, dirección y un id único", () => {
    for (const branch of branches) {
      expect(() => regionOf(branch.region)).not.toThrow();
      expect(branch.area.trim()).not.toBe("");
      expect(branch.address.trim()).not.toBe("");
    }
    const ids = indexed.map((branch) => branch.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("almagro-gascon-645");
  });

  it("agrupa por zona en orden fijo y por barrio en orden alfabético", () => {
    const groups = groupBranches(indexed);
    const order = regions.map((region) => region.id);
    expect(groups.map((group) => order.indexOf(group.region.id))).toEqual(
      groups.map((group) => order.indexOf(group.region.id)).toSorted((a, b) => a - b),
    );
    const caba = groups.find((group) => group.region.id === "caba")!;
    const names = caba.areas.map((area) => area.area);
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b, "es")));
    expect(caba.count).toBe(caba.areas.reduce((sum, area) => sum + area.branches.length, 0));
    // Dentro del barrio, las direcciones van en orden alfabético y numérico.
    const caballito = caba.areas.find((area) => area.area === "Caballito")!;
    expect(caballito.branches.map((branch) => branch.address)).toEqual([
      "Av. Ángel Gallardo 922",
      "Av. José María Moreno 773",
      "Av. La Plata 684",
      "Av. Rivadavia 5917",
      "Barco Centenera 196",
    ]);
  });

  it("no arma grupos vacíos y cuenta por zona", () => {
    const groups = groupBranches(search("rosario"));
    expect(groups.map((group) => group.region.id)).toEqual(["rosario"]);
    expect(countByRegion(search("san juan"))).toEqual({ caba: 1, provincia: 0, rosario: 1 });
  });

  it("lista los barrios sin repetir, en el orden del listado", () => {
    const areas = areasOf(branches);
    expect(new Set(areas).size).toBe(areas.length);
    expect(areas[0]).toBe(branches[0]!.area);
  });
});

describe("highlight", () => {
  it("marca la coincidencia sobre el texto original, con tildes", () => {
    expect(highlight("Av. Ángel Gallardo 922", ["angel"])).toEqual([
      { text: "Av. ", hit: false },
      { text: "Ángel", hit: true },
      { text: " Gallardo 922", hit: false },
    ]);
  });

  it("une coincidencias que se tocan y marca todas las apariciones", () => {
    expect(highlight("San Juan 1538", ["san", "an"])).toEqual([
      { text: "San", hit: true },
      { text: " Ju", hit: false },
      { text: "an", hit: true },
      { text: " 1538", hit: false },
    ]);
  });

  it("marca de corrido las palabras seguidas de la búsqueda", () => {
    expect(highlight("Av. San Juan 3405", ["san", "juan"])).toEqual([
      { text: "Av. ", hit: false },
      { text: "San Juan", hit: true },
      { text: " 3405", hit: false },
    ]);
  });

  it("sin búsqueda devuelve el texto entero", () => {
    expect(highlight("Gascón 645", [])).toEqual([{ text: "Gascón 645", hit: false }]);
  });
});

describe("branchMapsQuery", () => {
  it("busca la ficha del local con barrio y ciudad, sin repetir la ciudad", () => {
    expect(branchMapsQuery({ region: "caba", area: "Almagro", address: "Gascón 645" })).toBe(
      "Dulce Hora, Gascón 645, Almagro, CABA",
    );
    expect(branchMapsQuery({ region: "rosario", area: "Rosario", address: "Tucumán 1330" })).toBe(
      "Dulce Hora, Tucumán 1330, Rosario, Santa Fe",
    );
  });
});

describe("describeResults", () => {
  it("arma el estado de la búsqueda", () => {
    expect(describeResults(1, null, "")).toBe("1 sucursal");
    expect(describeResults(12, regionOf("rosario"), "")).toBe("12 sucursales en Rosario");
    expect(describeResults(2, null, " san juan ")).toBe("2 sucursales para «san juan»");
    expect(describeResults(0, regionOf("caba"), "tigre")).toBe("No hay sucursales en CABA para «tigre»");
  });
});
