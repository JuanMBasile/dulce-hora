# Referencia: cómo muestra Vremont sus oficinas

Relevado el 2026-10-09 para diseñar la sección de sucursales. [Vremont](https://vremont.com.ar/) es una red de inmobiliarias de CABA ("15 oficinas que trabajan como una sola red").

> **Límite del relevamiento.** El entorno de desarrollo no pudo abrir el sitio: la política de red bloquea los dominios externos. Todo sale de lo que el buscador tiene indexado. Por eso hay estructura y textos, pero **no se vieron sus animaciones**. Para compararlas hay que habilitar `vremont.com.ar` en la red del entorno, o pasar capturas o un video.

## Qué hacen

| Pieza | Cómo la resuelven |
|---|---|
| Home | Una sección "Nuestras oficinas" (o "Red de socios") con el nombre y la dirección de cada una, y la invitación a "encontrar la inmobiliaria Vremont más cerca tuyo", con un enlace a una vista de mapa. |
| Directorio | [`/inmobiliarias/`](https://www.vremont.com.ar/inmobiliarias/): "15 oficinas que trabajan como una sola red", con nombre y dirección de cada una. |
| Cada oficina | Un micrositio en un subdominio propio ([`pronin.vremont.com.ar`](https://pronin.vremont.com.ar/), [`bsasaccion.vremont.com.ar`](https://bsasaccion.vremont.com.ar/)) con dirección, barrio, teléfono y correo. Sus propiedades salen del portal de la red, pero las consultas llegan a la oficina. |
| Propiedades por oficina | El portal filtra por oficina (`/propiedades?workgroup=10`, `/perfil/treus`). |

## Qué tomamos

- La red como mensaje: muchas sucursales que funcionan como una sola marca.
- Una entrada clara a "la más cercana".
- La idea de que cada sucursal tenga su propia página (más adelante, ver abajo).

## Qué hacemos mejor

Comparado con lo que se pudo verificar:

| Vremont | Dulce Hora |
|---|---|
| El directorio es un listado de 15 oficinas con nombre y dirección. Dulce Hora tiene más de 100: un listado plano no alcanza. | Buscador por barrio, calle, altura o ciudad, sin importar tildes ("nunez" encuentra Núñez y "recoleta" encuentra Barrio Norte), con filtros por zona que cuentan los resultados. |
| La cantidad de oficinas no coincide entre páginas: el directorio dice 15 y una versión de "Quiénes somos" decía 16. | Un solo archivo de datos (`app/data/branches.ts`) arma la lista, los contadores y los filtros. No puede haber dos números. |
| Cada oficina tiene un micrositio en un subdominio propio. | Cuando haya datos verificados, cada sucursal tendrá una página en `/sucursales/<barrio>`, dentro del mismo sitio: la misma navegación, un solo sitemap y su JSON-LD `Bakery`. |

Además, sin equivalente verificado en Vremont:

- Cada dirección abre la ficha del local en Google Maps ("Dulce Hora, <dirección>"), con los horarios y las fotos que todavía no tenemos.
- "Cerca de mí" abre Google Maps, que ubica al visitante: el sitio no pide permisos ni necesita coordenadas propias.
- Sin resultados, se sugiere otra zona y se invita a abrir una franquicia en ese barrio.
- El movimiento usa el lenguaje de la marca: el tambor "Estamos en Caballito" (como el cartel de horarios del dial), un contador mecánico, una píldora que se desliza entre filtros y filas que se acomodan (FLIP) al filtrar y aparecen con el scroll. Respeta el movimiento reducido y, sin JavaScript, el listado queda completo.

## Pendiente

- Habilitar `vremont.com.ar` en el entorno (o mandar capturas o un video) para comparar sus animaciones.
- Listado oficial completo de sucursales (ver [`datos-a-confirmar.md`](./datos-a-confirmar.md)). Con él llegan las páginas por sucursal.
