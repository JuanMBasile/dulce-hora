# Marca

> **Estado: provisional.** El sello redibujado se usa en el sitio como identidad coherente mientras se revisa. No es definitivo hasta que la marca lo apruebe. Lámina de revisión: [`marca/propuesta-logo.html`](./marca/propuesta-logo.html), con una vista rápida en [`marca/propuesta-logo.jpg`](./marca/propuesta-logo.jpg).

## Punto de partida

- Desde 2022 la marca usa **rojo, negro y blanco** en locales, packaging, Instagram y la web.
- El logo vigente es un sello con borde ondulado, ramita roja, "DULCE" dibujada a mano, "HORA" en rojo, un abanico de rayos y "PANADERIA & PASTELERIA" en arco.
- Solo existe como PNG de 534 px, a veces envuelto en un SVG de 323 KB. En el header del sitio actual aparece roto.
- El manual amarillo de Behance (2021) tiene licencia "no-use" y no se usa en la calle. No tomamos nada de él.

## Qué cambia

| Elemento | Antes | Ahora | Por qué |
|---|---|---|---|
| Borde | Ondulado irregular | **12 festones regulares** | Las 12 horas del reloj y la docena de facturas. Es el recurso gráfico de todo el sitio: el festón separa secciones. |
| Arco interior | Círculo rojo casi completo | Arco de 270°, de las 7:30 a las 4:30 | Lee como la esfera de un reloj. En la web se dibuja al cargar (`pathLength`). |
| DULCE | Letra a mano | Bricolage Grotesque, opsz 96, peso 800, ancho 75 | Conserva lo condensado y pesado del original, pero se lee a 64 px. Kerning de HarfBuzz. |
| HORA | Rojo, espaciada | Rojo, ancho 100, tracking 0,085 em | Misma jerarquía, más aire para que no se empaste. |
| Descriptor | Mayúsculas sin tildes | *Panadería & Pastelería* en Newsreader itálica, con tildes y "&" rojo | Ortografía correcta y un contrapunto cálido a la palo seco. |
| Rayos y puntos | Sí | No | A tamaño chico son ruido. |
| Archivo | PNG | SVG con letras convertidas a curvas | No depende de que cargue la fuente. Un solo origen para todo. |

## Qué se conserva

- El sello redondo con borde ondulado en Tostado.
- La ramita roja de tres hojas, ahora con hojas separadas y nervaduras blancas.
- El arco rojo interior.
- La jerarquía DULCE grande y oscura sobre HORA roja.
- El rojo exacto del logo, **#D50D17**, que pasa a ser el rojo de toda la web (con Harina da 5,4:1, AA).

## Piezas

| Pieza | Archivo | Uso |
|---|---|---|
| Sello | `geometry/seal.json` → `Seal.tsx`, `app/assets/brand/sello.svg` | Hero (en línea, para animar el arco; llega en M3), pie y menú móvil (como `<img>`). Desde 64 px. |
| Sello sobre oscuro | `sello-sobre-oscuro.svg` | Sobre Tostado: los festones pasan a Rojo. |
| Firma horizontal | `geometry/signature.json` → `Signature.tsx` | Header y menú móvil. |
| Isotipo | `geometry/isotype.json` | Favicon, íconos de la app. |
| Monograma DH | `geometry/monogram.json` | Alternativa al isotipo. Hoy no se usa. |

Todas las piezas comparten la geometría de `app/components/brand/geometry/*.json`. Si cambia el logo, se regeneran esos archivos y todo lo demás se actualiza solo.

## Cómo regenerar

```bash
# 1. Geometría (Python 3.11+). Solo hace falta si cambia el dibujo.
python -m venv .venv-brand
.venv-brand/Scripts/pip install fonttools==4.60.1 brotli==1.2.0 uharfbuzz==0.56.3
.venv-brand/Scripts/python scripts/brand/generate-geometry.py

# 2. Subsets de las fuentes (solo si cambian los ejes o los caracteres).
.venv-brand/Scripts/python scripts/brand/subset-fonts.py

# 3. Favicons, íconos, SVG estáticos y 404. Con --sheet, también los SVG de la lámina.
npm run static -- --sheet
```

En macOS o Linux, `Scripts/` es `bin/`. `subset-fonts.py` mide los fallbacks contra Arial y Georgia de Windows; en otro sistema hay que ajustar esas rutas.

## Tipografía

- **Bricolage Grotesque** (OFL 1.1, sin Reserved Font Name) para títulos, navegación y botones. Subset propio con el tamaño óptico fijo en 96, el corte de display con trampas de tinta, peso 500–800 y ancho 75–100: **62,5 KB**, la única fuente precargada.
- **Newsreader** (OFL 1.1) para lectura y citas. Subset con opsz 16–72 y peso 400–600: **76,5 KB**, sin precarga.
- Los fallbacks tienen `size-adjust` y overrides de métricas calculados contra Arial y Georgia, para que el cambio de fuente no mueva el layout.
- En tamaños de interfaz, el corte 96 queda apretado: `--tracking-ui: 0.018em` le devuelve aire.

## Para decidir con la marca

- Aprobar el sello o pedir ajustes.
- Isotipo con ramita o monograma DH como favicon.
- Si existen los vectoriales originales, compararlos antes de cerrar.
- Letra de DULCE: la condensada geométrica de la propuesta o una más caligráfica, más cerca de la actual.
