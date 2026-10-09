"""Genera la geometría vectorial de la marca a partir de las tipografías del sitio.

Salida: app/components/brand/geometry/*.json (sello, firma horizontal, isotipo y
monograma), la única fuente de verdad del logo. Un archivo por pieza, para que cada
componente React importe solo lo que dibuja. scripts/build-static.mjs los usa para
los favicons, los SVG estáticos y el 404.

Las letras se convierten a curvas: el logo no depende de que la fuente cargue.
El kerning sale de HarfBuzz con la misma posición de ejes que el contorno.

Uso (Python 3.11+):
  python -m venv .venv-brand
  .venv-brand/Scripts/pip install fonttools==4.60.1 brotli==1.2.0 uharfbuzz==0.56.3
  .venv-brand/Scripts/python scripts/brand/generate-geometry.py
"""

import io
import json
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "node_modules" / "@fontsource-variable"
OUT = ROOT / "app" / "components" / "brand" / "geometry"

# El logo usa el mismo subset de Bricolage que sirve el sitio (tamaño óptico 96).
BRICOLAGE = ROOT / "app" / "assets" / "fonts" / "bricolage-grotesque-dh.woff2"
NEWSREADER_ITALIC = FONTS / "newsreader" / "files" / "newsreader-latin-wght-italic.woff2"

# Ejes de cada pieza tipográfica.
DULCE_AXES = {"wght": 800, "wdth": 75}
HORA_AXES = {"wght": 800, "wdth": 100}
DESCRIPTOR_AXES = {"wght": 520}


def num(value: float) -> str:
    """Un decimal alcanza para un logo; recorta ceros y evita '-0'."""
    text = f"{value:.1f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


class Font:
    def __init__(self, path: Path):
        self.tt = TTFont(path)
        self.tt.flavor = None
        buffer = io.BytesIO()
        self.tt.save(buffer)
        self.hb = hb.Font(hb.Face(buffer.getvalue()))
        self.upm = self.tt["head"].unitsPerEm
        self.order = self.tt.getGlyphOrder()

    def shape(self, text: str, axes: dict):
        self.hb.set_variations(axes)
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": False})
        return [
            (self.order[info.codepoint], pos.x_advance, pos.x_offset, pos.y_offset)
            for info, pos in zip(buf.glyph_infos, buf.glyph_positions)
        ]

    def glyphs(self, axes: dict):
        return self.tt.getGlyphSet(location=axes, normalized=False)


def draw_line(font: Font, text: str, axes: dict, size: float, x: float, baseline: float, tracking: float, pen):
    """Dibuja una línea recta con tracking en em. Devuelve el ancho de avance."""
    glyphs = font.glyphs(axes)
    scale = size / font.upm
    cursor = 0.0
    shaped = font.shape(text, axes)
    for index, (name, advance, x_offset, y_offset) in enumerate(shaped):
        transform = (scale, 0, 0, -scale, x + (cursor + x_offset) * scale, baseline - y_offset * scale)
        glyphs[name].draw(TransformPen(pen, transform))
        cursor += advance + (tracking * font.upm if index < len(shaped) - 1 else 0)
    return cursor * scale


def ink_bounds(font: Font, text: str, axes: dict, size: float, tracking: float = 0.0):
    pen = BoundsPen(font.glyphs(axes))
    draw_line(font, text, axes, size, 0, 0, tracking, pen)
    return pen.bounds  # (xMin, yMin, xMax, yMax) en coordenadas SVG (y hacia abajo)


def line_path(font: Font, text: str, axes: dict, *, cap_height: float, center_x: float | None = None,
              left_x: float | None = None, baseline: float, tracking: float = 0.0):
    """Texto en una línea, alineado por la tinta (no por el avance)."""
    cap = font.tt["OS/2"].sCapHeight
    size = cap_height * font.upm / cap
    x_min, _, x_max, _ = ink_bounds(font, text, axes, size, tracking)
    width = x_max - x_min
    if center_x is not None:
        origin = center_x - width / 2 - x_min
    else:
        origin = (left_x or 0) - x_min
    pen = SVGPathPen(font.glyphs(axes), ntos=num)
    draw_line(font, text, axes, size, origin, baseline, tracking, pen)
    return pen.getCommands(), width, size


def tracking_for_width(font: Font, text: str, axes: dict, cap_height: float, target: float) -> float:
    """Busca el tracking (en em) para que la tinta mida `target`."""
    cap = font.tt["OS/2"].sCapHeight
    size = cap_height * font.upm / cap
    low, high = -0.1, 1.0
    for _ in range(40):
        mid = (low + high) / 2
        x_min, _, x_max, _ = ink_bounds(font, text, axes, size, mid)
        if x_max - x_min < target:
            low = mid
        else:
            high = mid
    return (low + high) / 2


def arc_text_path(font: Font, text: str, axes: dict, *, size: float, cx: float, cy: float, radius: float,
                  accent: str = ""):
    """Texto sobre el arco inferior de un círculo, derecho y leyendo de izquierda a derecha.
    La línea de base apoya en `radius` y las letras miran hacia el centro.
    Los caracteres de `accent` van en un trazado aparte (para pintarlos de otro color)."""
    glyphs = font.glyphs(axes)
    scale = size / font.upm
    shaped = font.shape(text, axes)
    total = sum(advance for _, advance, _, _ in shaped) * scale
    ink_pen, accent_pen = SVGPathPen(glyphs, ntos=num), SVGPathPen(glyphs, ntos=num)
    accent_names = {name for name, *_ in font.shape(accent, axes)} if accent else set()
    cursor = -total / 2
    for name, advance, x_offset, y_offset in shaped:
        pen = accent_pen if name in accent_names else ink_pen
        middle = cursor + advance * scale / 2
        alpha = middle / radius  # 0 = abajo al centro, positivo hacia la derecha
        px, py = cx + radius * math.sin(alpha), cy + radius * math.cos(alpha)
        theta = -alpha
        cos_t, sin_t = math.cos(theta), math.sin(theta)
        tx, ty = (-advance / 2 + x_offset) * scale, -y_offset * scale
        transform = (
            scale * cos_t,
            scale * sin_t,
            scale * sin_t,
            -scale * cos_t,
            cos_t * tx - sin_t * ty + px,
            sin_t * tx + cos_t * ty + py,
        )
        glyphs[name].draw(TransformPen(pen, transform))
        cursor += advance * scale
    return ink_pen.getCommands(), accent_pen.getCommands(), total


def clock_point(cx: float, cy: float, radius: float, degrees: float):
    """Punto a `degrees` desde las 12, en sentido horario."""
    rad = math.radians(degrees)
    return cx + radius * math.sin(rad), cy - radius * math.cos(rad)


def festoon_path(cx: float, cy: float, valley: float, bump: float, count: int = 12) -> str:
    """Borde de festones: un arco hacia afuera entre cada par de valles.
    Con 12 festones, cada uno queda centrado en una hora del reloj."""
    step = 360 / count
    points = [clock_point(cx, cy, valley, step / 2 + step * k) for k in range(count)]
    commands = [f"M{num(points[0][0])} {num(points[0][1])}"]
    for k in range(count):
        x, y = points[(k + 1) % count]
        commands.append(f"A{num(bump)} {num(bump)} 0 0 1 {num(x)} {num(y)}")
    return "".join(commands) + "Z"


def leaf(base_x: float, base_y: float, length: float, width: float, angle: float) -> str:
    """Hoja almendrada que nace en (base_x, base_y) y apunta a `angle` grados desde la vertical."""
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)

    def rotate(x: float, y: float):
        return base_x + x * cos_a - y * sin_a, base_y + x * sin_a + y * cos_a

    half = width / 2
    c1, c2 = rotate(half * 0.95, -length * 0.12), rotate(half * 1.3, -length * 0.74)
    tip = rotate(0, -length)
    c3, c4 = rotate(-half * 1.3, -length * 0.74), rotate(-half * 0.95, -length * 0.12)
    fmt = lambda p: f"{num(p[0])} {num(p[1])}"
    return (
        f"M{fmt((base_x, base_y))}C{fmt(c1)} {fmt(c2)} {fmt(tip)}"
        f"C{fmt(c3)} {fmt(c4)} {fmt((base_x, base_y))}Z"
    )


def sprig(base_x: float, base_y: float, length: float, width: float):
    """Ramita de tres hojas que nacen separadas, abiertas como un brote.
    Devuelve (hojas, nervaduras): las nervaduras se calan en Harina en el sello grande."""
    side = length * 0.78
    spread = width * 0.22
    leaves = [
        (base_x - spread, base_y - spread * 0.4, side, width * 0.92, -54),
        (base_x, base_y, length, width, 0),
        (base_x + spread, base_y - spread * 0.4, side, width * 0.92, 54),
    ]
    shapes = "".join(leaf(x, y, l, w, a) for x, y, l, w, a in leaves)
    veins = []
    for x, y, l, _, a in leaves:
        rad = math.radians(a)
        x1, y1 = x - math.sin(-rad) * l * 0.18, y - math.cos(rad) * l * 0.18
        x2, y2 = x - math.sin(-rad) * l * 0.72, y - math.cos(rad) * l * 0.72
        veins.append(f"M{num(x1)} {num(y1)}L{num(x2)} {num(y2)}")
    return shapes, "".join(veins)


def main():
    bricolage = Font(BRICOLAGE)
    newsreader = Font(NEWSREADER_ITALIC)

    # ---------- Sello principal (400 × 400) ----------
    # Capas, de afuera hacia adentro: 12 festones (uno por hora), disco Harina,
    # arco-reloj rojo de 270° y, en el hueco inferior, el descriptor en arco.
    cx = cy = 200
    arc_radius = 151
    arc_start, arc_end = 225, 135  # de las 7:30 a las 4:30, pasando por las 12
    start, end = clock_point(cx, cy, arc_radius, arc_start), clock_point(cx, cy, arc_radius, arc_end)
    arc = f"M{num(start[0])} {num(start[1])}A{arc_radius} {arc_radius} 0 1 1 {num(end[0])} {num(end[1])}"

    dulce, dulce_width, _ = line_path(bricolage, "DULCE", DULCE_AXES, cap_height=76, center_x=cx, baseline=230)
    hora_tracking = tracking_for_width(bricolage, "HORA", HORA_AXES, 36, dulce_width * 0.7)
    hora, hora_width, _ = line_path(
        bricolage, "HORA", HORA_AXES, cap_height=36, center_x=cx, baseline=282, tracking=hora_tracking
    )
    descriptor, ampersand, descriptor_length = arc_text_path(
        newsreader, "Panadería & Pastelería", DESCRIPTOR_AXES, size=19.5, cx=cx, cy=cy, radius=arc_radius + 6,
        accent="&",
    )

    seal_sprig, seal_veins = sprig(cx, 140, 38, 15)
    seal = {
        "viewBox": "0 0 400 400",
        "festoon": festoon_path(cx, cy, valley=182, bump=64),
        "disc": {"cx": cx, "cy": cy, "r": 166},
        "arc": arc,
        "sprig": seal_sprig,
        "veins": seal_veins,
        "dulce": dulce,
        "hora": hora,
        "descriptor": descriptor,
        "ampersand": ampersand,
    }

    # ---------- Isotipo (100 × 100): festones, disco y ramita ----------
    # Anillo más grueso que en el sello para que se lea a 16 px.
    isotype = {
        "viewBox": "0 0 100 100",
        "festoon": festoon_path(50, 50, valley=44, bump=16),
        "disc": {"cx": 50, "cy": 50, "r": 35},
        "sprig": sprig(50, 70, 40, 17)[0],
    }

    # ---------- Monograma (100 × 100): variante "DH" del isotipo ----------
    d_path, d_width, _ = line_path(bricolage, "D", DULCE_AXES, cap_height=34, left_x=0, baseline=0)
    h_path, h_width, _ = line_path(bricolage, "H", DULCE_AXES, cap_height=34, left_x=0, baseline=0)
    gap = 3
    left = 50 - (d_width + gap + h_width) / 2
    d_path, _, _ = line_path(bricolage, "D", DULCE_AXES, cap_height=34, left_x=left, baseline=67)
    h_path, _, _ = line_path(bricolage, "H", DULCE_AXES, cap_height=34, left_x=left + d_width + gap, baseline=67)
    monogram = {
        "viewBox": "0 0 100 100",
        "festoon": isotype["festoon"],
        "disc": isotype["disc"],
        "d": d_path,
        "h": h_path,
    }

    # ---------- Firma horizontal: isotipo + DULCE / HORA apilados ----------
    height = 48
    text_left = height + 10
    sig_dulce, sig_dulce_width, _ = line_path(
        bricolage, "DULCE", DULCE_AXES, cap_height=21, left_x=text_left, baseline=24.5
    )
    sig_tracking = tracking_for_width(bricolage, "HORA", HORA_AXES, 12.5, sig_dulce_width)
    sig_hora, _, _ = line_path(
        bricolage, "HORA", HORA_AXES, cap_height=12.5, left_x=text_left, baseline=43.5, tracking=sig_tracking
    )
    signature_width = math.ceil(text_left + sig_dulce_width + 1)
    scale = height / 100
    signature = {
        "viewBox": f"0 0 {signature_width} {height}",
        "width": signature_width,
        "height": height,
        "isotypeScale": scale,
        "dulce": sig_dulce,
        "hora": sig_hora,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    for name, piece in {"seal": seal, "isotype": isotype, "monogram": monogram, "signature": signature}.items():
        path = OUT / f"{name}.json"
        path.write_text(json.dumps(piece, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Escrito {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    print(f"DULCE {dulce_width:.1f} · HORA {hora_width:.1f} (tracking {hora_tracking:.3f} em)")
    print(f"Descriptor sobre el arco: {descriptor_length:.1f} de {math.radians(90) * (arc_radius + 6):.1f} disponibles")
    print(f"Firma: {signature_width} × {height}, tracking HORA {sig_tracking:.3f} em")


if __name__ == "__main__":
    main()
