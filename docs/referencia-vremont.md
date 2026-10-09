# Referencia: cómo muestra Vremont sus oficinas

Relevado el 2026-10-09 para diseñar la sección de sucursales. [Vremont](https://vremont.com.ar/) es una red de inmobiliarias de CABA ("15 oficinas que trabajan como una sola red").

> **Límite del relevamiento.** El entorno de desarrollo no puede abrir el sitio: la política de red bloquea los dominios externos. La estructura sale de lo que el buscador tiene indexado y la animación, de una captura del hero.

## Qué hacen

| Pieza | Cómo la resuelven |
|---|---|
| Hero | Sobre un azul con una grilla de puntos tenue, las oficinas aparecen como puntos blancos dispersos, algunas con su nombre al lado, y se acomodan formando la V del logo. |
| Home | Una sección "Nuestras oficinas" (o "Red de socios") con el nombre y la dirección de cada una, y la invitación a "encontrar la inmobiliaria Vremont más cerca tuyo", con un enlace a una vista de mapa. |
| Directorio | [`/inmobiliarias/`](https://www.vremont.com.ar/inmobiliarias/): "15 oficinas que trabajan como una sola red", con nombre y dirección de cada una. |
| Cada oficina | Un micrositio en un subdominio propio ([`pronin.vremont.com.ar`](https://pronin.vremont.com.ar/), [`bsasaccion.vremont.com.ar`](https://bsasaccion.vremont.com.ar/)) con dirección, barrio, teléfono y correo. Sus propiedades salen del portal de la red, pero las consultas llegan a la oficina. |
| Propiedades por oficina | El portal filtra por oficina (`/propiedades?workgroup=10`, `/perfil/treus`). |

## Qué tomamos

- La animación del hero: los puntos de la red que aparecen y forman la marca. En Dulce Hora, las sucursales forman el festón del sello, con la ramita en el centro.
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

Además:

- **El sello no termina en la animación.** Ya formado, acompaña al buscador: buscar "caballito" enciende sus 5 puntos, el filtro de Rosario enciende su tramo del festón, y sin filtro se encienden las sucursales del barrio que nombra el tambor "Estamos en…".
- **Escala con la red:** el festón suma puntos con las sucursales y se dispersan como mucho 36, así que con más de 100 la animación sigue siendo legible.
- **Mejora progresiva:** con movimiento reducido o sin JavaScript, el sello aparece ya formado.
- Cada dirección abre la ficha del local en Google Maps ("Dulce Hora, <dirección>"), con los horarios y las fotos que todavía no tenemos.
- "Cerca de mí" abre Google Maps, que ubica al visitante: el sitio no pide permisos ni necesita coordenadas propias.
- Sin resultados, se sugiere otra zona y se invita a abrir una franquicia en ese barrio.

## Pendiente

- Para afinar el ritmo contra el original (tiempos, si se arma con el scroll o sola), habilitar `vremont.com.ar` en la red del entorno o pasar un video del hero.
- Listado oficial completo de sucursales (ver [`datos-a-confirmar.md`](./datos-a-confirmar.md)). Con él llegan las páginas por sucursal.
