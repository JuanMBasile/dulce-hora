"""Genera los subsets de las tipografías del sitio y calcula los ajustes de los fallbacks.

- Bricolage Grotesque: tamaño óptico fijo en 96 (el corte de display, con trampas de
  tinta), peso 500–800 y ancho 75–100. Es la fuente precargada: 64 KB.
- Newsreader: tamaño óptico 16–72 (texto y citas grandes) y peso 400–600.

Las dos son OFL 1.1 sin Reserved Font Name, así que se pueden recortar y servir.
Solo se incluyen los caracteres del español y la puntuación tipográfica.

Imprime los descriptores @font-face de los fallbacks (size-adjust, ascent-override…)
calculados contra Arial y Georgia, para que el cambio de fuente no mueva el layout.

Uso: ver scripts/brand/generate-geometry.py (mismo entorno de Python).
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "node_modules" / "@fontsource-variable"
OUT = ROOT / "app" / "assets" / "fonts"
WINDOWS_FONTS = Path("C:/Windows/Fonts")

UNICODES = (
    list(range(0x20, 0x7F))  # ASCII imprimible
    + list(range(0xA0, 0x100))  # Latin-1: tildes, ñ, ¡¿, «», ©, ·
    + [0x2009, 0x202F, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026]
)

FONTS = [
    {
        "source": SRC / "bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2",
        "output": OUT / "bricolage-grotesque-dh.woff2",
        "limits": {"opsz": 96, "wght": (500, 800), "wdth": (75, 100)},
        "features": ["kern", "liga", "calt", "locl", "mark", "mkmk", "ccmp", "case", "lnum", "tnum"],
        # Fallbacks: texto de interfaz (ancho normal) y titulares (condensada).
        "fallbacks": [
            ("Bricolage UI Fallback", {"wght": 600, "wdth": 100}, "arial.ttf", 'local("Arial"), local("Helvetica Neue"), local("Roboto")'),
            ("Bricolage Display Fallback", {"wght": 800, "wdth": 75}, "arial.ttf", 'local("Arial"), local("Helvetica Neue"), local("Roboto")'),
        ],
    },
    {
        "source": SRC / "newsreader/files/newsreader-latin-standard-normal.woff2",
        "output": OUT / "newsreader-dh.woff2",
        "limits": {"opsz": (16, 72), "wght": (400, 600)},
        "features": ["kern", "liga", "calt", "locl", "mark", "mkmk", "ccmp", "onum", "lnum", "pnum", "tnum"],
        "fallbacks": [
            ("Newsreader Fallback", {"wght": 400, "opsz": 18}, "georgia.ttf", 'local("Georgia"), local("Times New Roman"), local("Noto Serif")'),
        ],
    },
]

# Frecuencia aproximada de letras en español, para estimar el ancho medio de un texto real.
SAMPLE = (
    "Medialunas, facturas, panificados y pastelería elaborados cada día, con la calidad y el "
    "precio que tu barrio merece. Más de 100 sucursales en CABA, provincia de Buenos Aires y Rosario. "
    "Encontrá tu sucursal. Ver productos. Abrí tu propio Dulce Hora."
)


def average_width(font: TTFont, location: dict | None) -> float:
    glyphs = font.getGlyphSet(location=location, normalized=False) if location else font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    total = sum(glyphs[cmap[ord(ch)]].width for ch in SAMPLE if ord(ch) in cmap)
    return total / len(SAMPLE) / upm


def metrics_css(name: str, font: TTFont, location: dict, fallback_file: str, local_src: str) -> str:
    fallback = TTFont(WINDOWS_FONTS / fallback_file)
    size_adjust = average_width(font, location) / average_width(fallback, None)
    upm = font["head"].unitsPerEm
    hhea = font["hhea"]
    ascent = hhea.ascent / upm / size_adjust
    descent = abs(hhea.descent) / upm / size_adjust
    line_gap = hhea.lineGap / upm / size_adjust
    return (
        f"@font-face {{\n"
        f'  font-family: "{name}";\n'
        f"  src: {local_src};\n"
        f"  size-adjust: {size_adjust * 100:.2f}%;\n"
        f"  ascent-override: {ascent * 100:.2f}%;\n"
        f"  descent-override: {descent * 100:.2f}%;\n"
        f"  line-gap-override: {line_gap * 100:.2f}%;\n"
        f"}}"
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for spec in FONTS:
        variable = TTFont(spec["source"])
        css = [metrics_css(name, variable, location, file, local_src) for name, location, file, local_src in spec["fallbacks"]]

        font = instantiateVariableFont(TTFont(spec["source"]), spec["limits"])
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = spec["features"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=UNICODES)
        subsetter.subset(font)
        font.flavor = "woff2"
        font.save(spec["output"])

        size = spec["output"].stat().st_size
        print(f"{spec['output'].relative_to(ROOT)}: {size / 1024:.1f} KB, ejes {spec['limits']}")
        print("\n".join(css))
        print()


if __name__ == "__main__":
    main()
