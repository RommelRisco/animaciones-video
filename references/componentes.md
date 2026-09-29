# Componentes (tipos de escena)

Un clip es un módulo que exporta un objeto. Tamaños (`tamano…`) están en píxeles para un lienzo de 1080 de ancho; el motor los escala a cualquier formato y **reduce solo** el texto si no cabe en su caja.

```js
export default {
  nombre: 'mi-clip',            // nombre de los archivos de salida
  formato: '9:16',              // '9:16' | '16:9' | '1:1' | '4:5' | '1280x720' | { ancho, alto }
  fps: 30,                      // 30 (o 60 para movimientos muy rápidos)
  estilo: 'pizarra',            // pizarra | pizarron | cuaderno | kraft | minimal | oscuro
  marca: { acento: '#FF5A1F' }, // ver estilos-y-marca.md
  fondo: undefined,             // fondo por defecto de todas las escenas; 'transparente' → export con alfa
  transicion: 'auto',           // transición por defecto entre escenas ('auto' alterna las del estilo)
  velocidad: 1,                 // 1.2 = todo 20 % más rápido
  zonaSegura: true,             // deja libres los bordes que tapa la interfaz de Reels/TikTok (9:16)
  idioma: 'es-MX',              // formato de números (1,234.5). 'es-ES' → 1.234,5
  ritmo: { bpm: 110, desfase: 0 }, // opcional: los cambios de escena caen en el pulso
  cierre: 'fundido',            // opcional: funde la última escena al final
  sonido: true,                 // false = sin efectos
  fuentes: [{ familia: 'Mi Fuente', archivo: 'assets/fonts/mi.ttf', peso: 700 }], // fuentes locales
  escenas: [ /* … */ ],
};
```

## Campos comunes a todas las escenas

| Campo | Qué hace |
|---|---|
| `tipo` | obligatorio (ver abajo) |
| `duracion` | fija la duración total de la escena en segundos (si la animación es más larga se corta y avisa) |
| `pausa` | segundos quietos al final para leer (por defecto se calcula por número de palabras) |
| `transicion` | transición **hacia la siguiente** escena: `corte`, `fundido`, `empuje`, `deslizar`, `zoom`, `voltear`, `circulo`, `barrido`, `tinta`, `persiana`, `borrador`, `auto` |
| `duracionTransicion` | segundos (por defecto 0.5–0.8 según el tipo) |
| `transicionOpc` | `{ x, y, color, color2 }` — centro del círculo/tinta y colores de los paneles |
| `fondo` | `'estilo'` (defecto), `'acento'`, `'acento2'`, `'degradado'`, `'#hex'`, `'transparente'` o el fondo de otro estilo (`'pizarron'`, `'cuaderno'`, `'kraft'`, `'minimal'`, `'oscuro'`, `'papel'`) |
| `herramienta` | `'marcador'`, `'tiza'`, `'lapiz'` o `null` (sin mano) |
| `efecto` | entrada del titular: `escribir`, `palabras`, `teclear`, `golpe`, `deslizar`, `fundido` |
| `efectoTexto` | entrada del texto de apoyo (mismas opciones) |
| `marca` | marca sobre `resalta`: `subrayado`, `circulo`, `resaltador`, `caja`, `color` |
| `resalta` | palabra o frase (o lista) del titular a destacar; debe aparecer tal cual en el texto |
| `mascota` | agrega la mascota a la escena (ver abajo) |
| `camara` | `false` sin acercamiento lento; un número (p. ej. `0.06`) para más zoom |
| `sonido` | `false` silencia los efectos de esa escena |
| `textura` | `false` quita el temblor de línea "a mano" |
| `caja` | `{ x, y, w, h }` sobrescribe la caja útil (px del lienzo) |

### Mascota dentro de una escena
```js
mascota: { accion: 'senalar', lado: 'derecha', dice: '¡Mira esto!', escala: 1, color: 'acento2', en: 0.8 }
// o simplemente: mascota: 'saludar'
```
`accion`: `saludar`, `senalar` (apunta al contenido), `saltar`, `celebrar` (confeti), `pensar`, `sorpresa`, `triste`, `feliz`, `hablar`, `ninguna`. `lado`: `derecha` (defecto), `izquierda`, `centro`. `en`: segundos desde el inicio de la escena. `imagen: 'assets/logo.png'` usa su logo o personaje (PNG con transparencia) en lugar de la mascota dibujada. La mascota ocupa la franja inferior (9:16) o la columna derecha (16:9) y el resto del contenido se acomoda.

## Tipos

### `titulo` — gancho / titular grande
```js
{ tipo: 'titulo', texto: '¿Sabías que tu app pregunta cada 5 segundos?', resalta: 'cada 5 segundos',
  subtitulo: 'Y casi siempre la respuesta es "no"', icono: 'reloj', posicion: 'centro' }
```
`texto`*, `subtitulo`, `icono`, `tamano` (175; 150 con subtítulo), `tamanoSubtitulo` (62), `maxLineas` (5), `posicion` (`centro`|`arriba`|`abajo`).

### `idea` — titular + dibujo grande + frase
```js
{ tipo: 'idea', titulo: 'Eso se llama polling', icono: 'reloj', texto: 'Gasta peticiones aunque no pase nada' }
{ tipo: 'idea', titulo: 'Del dato a la decisión', iconos: ['documento', 'grafica', 'bombilla'] } // hasta 3, con flechas
```
`titulo`, `icono` o `iconos` (con flechas entre ellos salvo `flechas: false`), `texto`, `resaltaTexto`, `tamano` (120), `tamanoTexto` (66).

### `flujo` — proceso paso a paso (2–4 pasos)
```js
{ tipo: 'flujo', titulo: 'Así viaja un webhook', pasos: [
  { icono: 'rayo', texto: 'Pasa algo' }, { icono: 'compartir', texto: 'Te avisan con un POST' }, { icono: 'check', texto: 'Tu app reacciona' } ] }
```
Vertical en 9:16, horizontal en 16:9. `tamanoTexto` (64).

### `lista` — puntos que aparecen uno a uno
```js
{ tipo: 'lista', titulo: 'Checklist', marcador: 'check', items: ['Responde 200', { texto: 'Guardar todo en el webhook', ok: false }, { texto: 'Mito', tachar: true }] }
```
`marcador`: `numeros` (defecto), `check`, `cruz`, `vinetas`. Cada item puede ser texto u objeto `{ texto, resalta, color, ok, tachar, numero }`. `tamanoItems` (84, se reduce si no cabe), `ritmo` (pausa entre items, 0.15), `alinear` del título.

### `cifra` — número que cuenta
```js
{ tipo: 'cifra', titulo: 'Tiempo ahorrado', valor: 73, sufijo: '%', anillo: true, etiqueta: 'menos tickets', fuente: 'Reporte interno 2025' }
```
`valor`*, `desde` (0), `prefijo` (`'$'`), `sufijo`, `decimales` (se deduce del valor), `separador: false`, `anillo` (`true` = valor/100, o una fracción 0–1), `color`, `tamano` (300), `duracionConteo` (1.4), `etiqueta`, `fuente` (texto chico al pie). **Solo cifras reales.**

### `barras` — comparación de cantidades
```js
{ tipo: 'barras', titulo: 'Ventas por canal', sufijo: ' k', fuente: 'CRM, marzo 2026',
  datos: [{ etiqueta: 'WhatsApp', valor: 42, resaltar: true }, { etiqueta: 'Email', valor: 18 }] }
```
Hasta ~6 barras. `prefijo`, `sufijo`, `decimales`, `maximo` (escala), `resaltarMayor: false`, `fuente`. Por barra: `color`, `sufijo`, `decimales`.

### `comparacion` — antes/después, mito/realidad, A vs B
```js
{ tipo: 'comparacion', titulo: 'Polling vs. webhook',
  izquierda: { titulo: 'Polling', items: ['Peticiones vacías', 'Llega tarde'] },      // tono 'malo' por defecto
  derecha:   { titulo: 'Webhook', items: ['Solo cuando hay algo', 'Tiempo real'] } }  // tono 'bueno' por defecto
```
También `antes`/`despues`. `tono`: `malo` (✗ rojo), `bueno` (✓ verde), `neutro` (→). `vs: false` o `vs: 'O'`. En 9:16 las tarjetas se apilan; en 16:9 van lado a lado.

### `cita`
```js
{ tipo: 'cita', texto: 'Lo que no se mide no se puede mejorar.', autor: 'Dicho popular', efecto: 'teclear' }
```

### `imagen` — captura, foto o producto con señalamientos
```js
{ tipo: 'imagen', src: 'assets/captura.png', marco: 'navegador', titulo: 'Configúralo aquí',
  senalar: [{ x: 0.82, y: 0.3, texto: 'Pega tu URL', radio: 0.08 }], pie: 'Menú > Webhooks', zoom: 1.08 }
```
`marco`: `tarjeta` (defecto), `navegador`, `telefono`, `ninguno`. `senalar`: puntos en coordenadas relativas de la imagen (0–1) → círculo a mano + flecha + etiqueta. `zoom` (Ken Burns, `false` lo quita), `foco: { x, y }`.

### `mascota` — la mascota como presentadora
```js
{ tipo: 'mascota', dice: '¡Hola! Hoy te explico qué es un webhook', resalta: 'webhook', accion: 'saludar' }
```
`dice`, `accion`, `escala` (1.5), `color`, `imagen`, `tamano` (76).

### `cta` — llamado a la acción
```js
{ tipo: 'cta', texto: '¿Te sirvió? Guárdalo', resalta: 'Guárdalo', usuario: '@tu_usuario', boton: 'Seguir', botonHecho: 'Siguiendo ✓', iconos: ['corazon', 'chat', 'compartir', 'guardar'] }
```
Un cursor hace clic en el botón y cambia a `botonHecho`. `boton: false` lo quita; `iconos: []` quita la fila de íconos.

### `rotulo` — lower third (nombre y cargo)
```js
{ tipo: 'rotulo', nombre: 'Ana Pérez', cargo: 'CEO de Ejemplo', posicion: 'izquierda', permanencia: 4 }
```
Entra, se queda `permanencia` segundos y sale sola. `posicion`: `izquierda`, `centro`, `derecha`; `y` (0–1, alto relativo); `panel` (color del fondo del rótulo). Pensado para `fondo: 'transparente'`.

### `subtitulos` — subtítulos animados
```js
{ tipo: 'subtitulos', modo: 'karaoke', srt: 'assets/voz.srt' }
{ tipo: 'subtitulos', lineas: [{ desde: 0, hasta: 1.8, texto: 'Hola a todos' }] }
{ tipo: 'subtitulos', palabras: [{ t: 0.00, fin: 0.32, texto: 'Hola' }, …], maxPalabras: 4 } // tiempos exactos por palabra
```
`modo`: `karaoke` (la palabra que se dice se colorea), `pop` (cada palabra aparece al decirse), `simple`. `posicion`: `abajo`, `centro`, `arriba`. `tamano` (78 en 9:16), `color`, `contorno`, `colorResalta`, `mayusculas` (true), `fuente`. Los tiempos son relativos al inicio de la escena (normalmente la única del clip). Con solo `lineas`/`srt`, el tiempo de cada palabra se reparte por su largo; para sincronía exacta usa `palabras` (p. ej. de Whisper o AssemblyAI).

### `transicion` — transición suelta (para editar)
```js
{ tipo: 'transicion', efecto: 'tinta', duracion: 1, color: 'acento', color2: 'tinta' }
```
`efecto`: `tinta`, `barrido`, `persiana`, `circulo`, `borrador`. Tapa toda la pantalla en la mitad exacta: en el editor, alinea esa mitad con el corte. Úsala con `fondo: 'transparente'`.

### `personalizada` — cualquier otra cosa
```js
{ tipo: 'personalizada', palabras: 6, construir: async (M, S, e) => { /* … */ return tiempoFinal; } }
```
Ver `api-motor.md`. Devuelve el tiempo (absoluto, en segundos de guion) en el que termina tu animación.

## Íconos disponibles
bombilla, check, cruz, flecha, estrella, corazon, cohete, grafica, barras, reloj, dinero, persona, grupo, chat, engranaje, objetivo, alerta, lupa, rayo, nube, candado, trofeo, play, correo, telefono, camara, libro, casa, chip, compartir, guardar, pregunta, calendario, mundo, escudo, codigo, carrito, mano, documento, microfono, fuego, like.

Hoja visual: `node render.mjs clips/catalogo-iconos.js --fotos 0.3`. Para uno que falte, dibújalo en una escena `personalizada` con `M.path` + `M.draw`, o agrégalo a `engine/icons.js` (caja 100×100, `trazos` y `rellenos`).
