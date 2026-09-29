# Estilos, marca y recursos

## Estilos incluidos
| Estilo | Look | Fuentes | Herramienta | Entrada del titular | Úsalo para |
|---|---|---|---|---|---|
| `pizarra` | papel blanco, plumón negro y naranja | Caveat + Kalam | marcador | se escribe a mano | explicar cualquier cosa, tono cercano |
| `pizarron` | pizarrón verde con tiza | Caveat + Kalam | tiza | se escribe a mano | clases, historia, "vuelta a lo básico" |
| `cuaderno` | hoja rayada, lápiz y marcatextos | Patrick Hand | lápiz | se escribe a mano | tips, estudio, listas, productividad |
| `kraft` | cartón café, marcador y sellos | Caveat + Patrick Hand | marcador | se escribe a mano | precios, negocio, artesanal |
| `minimal` | blanco limpio, color de acento | Poppins | — | palabra por palabra | datos, SaaS, corporativo, YouTube |
| `oscuro` | fondo oscuro con retícula y brillo | Bebas Neue + Poppins | — | golpe (entra grande) | tecnología, IA, noticias, energía |

Prueba rápida de un estilo sin tocar el clip: `node render.mjs clips/x.js --estilo oscuro --escenas`.

## Marca
```js
marca: {
  acento: '#FF5A1F',       // color principal (palabras resaltadas, mascota, botones)
  acento2: '#2F6FDE',      // secundario (barras, íconos rellenos)
  acento3: '#16A34A',
  tinta: '#1E1B18',        // color del texto
  fondo: '#FFF8EF',        // color del papel/fondo del estilo
  resaltador: '#FFE066',   // color del marcatextos
  malo: '#D93A2F', bueno: '#16A34A', amarillo: '#FFD23F', suave: '#8C857B',
  fuenteTitulo: 'Montserrat', pesoTitulo: 800, escalaTitulo: 1,
  fuenteTexto: 'Inter', pesoTexto: 400,
  fuenteNumeros: 'Bebas Neue',
  herramienta: 'lapiz',    // o null para quitar la mano
  mayus: true,             // titulares en mayúsculas
  efectoTitulo: 'palabras', efectoTexto: 'fundido', marca: 'circulo',
  grano: 0.1,              // textura de papel encima (0 = nada)
}
```
El motor corrige el contraste por escena: si el texto no se lee sobre el fondo, cambia la tinta a blanco o negro y elige un acento legible.

### Fuentes
- **Incluidas (sin internet):** Caveat, Kalam, Patrick Hand, Poppins, Bebas Neue, JetBrains Mono.
- **Cualquier otra de Google Fonts:** escribe su nombre en `fuenteTitulo`/`fuenteTexto`; se descarga al renderizar (requiere internet).
- **Archivo propio:** ponlo en `assets/fonts/` y decláralo en el clip:
  `fuentes: [{ familia: 'Mi Marca', archivo: 'assets/fonts/MiMarca-Bold.ttf', peso: 700 }]` y usa `fuenteTitulo: 'Mi Marca'`.
- Si una fuente no carga, la consola dice cuál y se usa una de reserva: revisa el QA.
- Las fuentes a mano (Caveat) se ven más chicas: el estilo ya las escala (`escala`). Con fuentes propias ajusta `escalaTitulo`.

### Logo o personaje propio
`mascota: { imagen: 'assets/logo.png' }` (PNG con fondo transparente, ~600 px de alto). Salta, saluda y celebra como bloque. Úsalo solo si la persona lo pidió; por defecto no pongas logos.

## Fondos por escena
`fondo` acepta: `'estilo'` · `'acento'` · `'acento2'` · `'degradado'` · `'#hex'` · `'transparente'` · `'papel'` · `'pizarron'` · `'cuaderno'` · `'kraft'` · `'minimal'` · `'oscuro'`. Alternar fondos da ritmo (p. ej. una escena `fondo: 'acento'` con una cifra grande).

## Herramientas
`marcador` (plumón), `tiza`, `lapiz` o `null`. La herramienta aparece solo mientras algo se escribe o se dibuja, viaja entre trazos cercanos y se retira sola. Cambia por escena con `herramienta: …`.

## Transiciones
| Nombre | Qué pasa | Va bien con |
|---|---|---|
| `corte` | cambio seco | overlays, ritmo muy rápido |
| `fundido` | se funde | cierres, tono calmado |
| `empuje` / `deslizar` | la escena nueva empuja a la anterior (horizontal / vertical) | listas de ideas, "siguiente" |
| `zoom` | la anterior se acerca y desaparece | revelaciones, entrar a un detalle |
| `voltear` | tarjeta que gira | mito/realidad, antes/después |
| `circulo` | la nueva aparece desde un círculo (usa `transicionOpc: { x, y }` para centrarlo en algo) | enfocar un objeto |
| `barrido` | dos paneles de color cruzan la pantalla | cambio de tema, energía |
| `tinta` | una mancha de tinta cubre y se abre | estilos a mano, momentos clave |
| `persiana` | franjas que tapan y destapan | datos, tecnología |
| `borrador` | un borrador limpia el pizarrón | pizarra/pizarrón |

`transicion: 'auto'` rota las del estilo sin repetir la anterior.

## Efectos de sonido
Se sintetizan con código (sin archivos ni licencias): escritura de plumón/tiza/lápiz, pops, whoosh, clics de teclado, ding, éxito, error, golpe, conteo, borrador. Se generan a partir de lo que pasa en pantalla. `sonido: false` en el clip o en una escena los quita. En exportaciones con alfa se entregan aparte (`-sfx.wav`).
