# Datos a confirmar

Lo que el sitio usa pero todavía no está validado con la marca. Cada dato indica de dónde salió y qué falta.

## Sucursales (`app/data/branches.ts`)

**Estado: listado parcial. Bloquea la publicación.**

- **Qué hay:** 31 sucursales (19 en CABA y 12 en Rosario) de las más de 100 que anuncia la marca.
- **De dónde salen:** de la página oficial [`/branches`](https://www.dulcehora.com.ar/branches), tal como la tiene indexada el buscador. La página no se pudo abrir desde el entorno de desarrollo, que bloquea los dominios externos. Las direcciones se pasaron a mayúsculas y minúsculas con tildes ("AV LA PLATA 684" → "Av. La Plata 684").
- **Falta:**
  - El listado oficial completo, con barrio o localidad de cada sucursal. Faltan todas las de la provincia de Buenos Aires (otros directorios mencionan Morón y Monte Grande) y las de la Costa Atlántica, si las hay.
  - Las direcciones de DH Villa Urquiza y DH Parque Chas: el índice muestra los nombres, pero no las direcciones.
  - Rosario: la numeración oficial repite "DH Rosario 10" y salta el 9. Uno de los resultados suma "Av. San Martín 5682", que no se incluyó porque no aparece en los otros. Un directorio da "San Juan 1536" en lugar de "San Juan 1538".
  - Los barrios de Rosario, para agruparlas como en CABA.
- **Para después (páginas por sucursal):** horarios, teléfono o WhatsApp de cada local, enlaces de Rappi y PedidosYa, y coordenadas. Con las coordenadas se pueden ordenar por distancia y dibujar un mapa propio.
- **Fotos de los locales:** la moneda del sello muestra hoy fotos de productos con el aviso "Foto ilustrativa" (`app/sections/Branches/standInPhotos.ts`). Hace falta una foto de la fachada de cada sucursal, cuadrada o apaisada, de al menos 1000 px. Con ellas se quita el aviso.
- **Cómo cargarlo:** basta con reemplazar el arreglo `branches`. Los filtros, los contadores y el tambor de barrios se arman solos. Si aparece una zona nueva, se agrega a `regions`.

## Otros datos marcados en el código

- **Dominio canónico** (`app/data/site.ts`): se asume `https://www.dulcehora.com.ar`.
- **Instagram** (`app/data/site.ts`): `@dulcehoraoficial`, citada en el sitio oficial de 2024.
