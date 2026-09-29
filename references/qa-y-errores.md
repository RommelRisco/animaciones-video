# QA y errores comunes

## Revisión mínima antes de entregar
1. `node render.mjs clips/x.js --escenas` → abre `salida/x/qa/contacto.jpg`.
2. Mira también 2–3 fotos dentro de cada transición (`--fotos` con tiempos de `qa/indice.txt` o de la consola).
3. Revisa:
   - [ ] Texto completo, sin cortes ni encimados, legible en un teléfono.
   - [ ] La palabra clave está resaltada y es la correcta.
   - [ ] La mascota no tapa texto.
   - [ ] Nada importante fuera de la zona segura (9:16).
   - [ ] Contraste suficiente en cada fondo.
   - [ ] La primera imagen ya muestra algo (gancho) y la última deja leer el cierre.
   - [ ] Cifras = las de la fuente, con `fuente` si aplica.
   - [ ] La consola no muestra avisos (`⚠`).
4. Render final, abre el archivo (o una foto de él) antes de entregarlo.

## Síntoma → causa → solución
| Síntoma | Causa | Solución |
|---|---|---|
| Aviso "Texto muy largo para su caja" | demasiadas palabras | acorta el texto o parte la escena (no bajes `tamano` a menos de ~50) |
| Aviso "su animación dura X s pero duracion es Y" | `duracion` muy corta | quita `duracion` (el motor calcula) o súbela |
| Fuente distinta a la esperada | no cargó (sin internet o nombre mal escrito) | usa una incluida, o un archivo en `assets/fonts` con `fuentes: [...]` |
| "No encuentro la imagen" | ruta incorrecta | rutas relativas a la carpeta del proyecto: `'assets/foto.png'` |
| Todo sale en negro en el editor | el editor no lee el alfa | `.mov` ProRes 4444, secuencia `--png` o `--croma` |
| El texto con fuente a mano se ve chico | Caveat/Patrick Hand tienen letra pequeña | el estilo ya las escala; con fuentes propias usa `escalaTitulo: 1.2` |
| La escena se siente lenta | mucho texto escrito a mano | `efecto: 'palabras'`, menos palabras o `velocidad: 1.15` |
| Aparecen dos escenas a la vez en una foto | la foto cae dentro de una transición | normal; revisa fotos fuera de la transición |
| Algo "salta" o cambia según el orden de render | animación fuera del modelo de tiempo | usa `M.to`/`M.every`/`M.rand`, nunca `setTimeout` ni `Math.random` (ver `api-motor.md`) |
| `Error al construir el clip` | error de sintaxis o tipo desconocido | lee el mensaje: dice la escena y qué valores acepta |
| `ffmpeg` no encontrado | no está instalado | Mac `brew install ffmpeg` · Windows `winget install ffmpeg` · Linux `sudo apt install ffmpeg` |
| `npx playwright install chromium` falla por red | la red bloquea la descarga | usa Chrome instalado (se detecta solo) o `CHROME_PATH=/ruta/al/navegador`. En Linux sin acceso al CDN: `npm i --no-save @sparticuz/chromium` y `export CHROME_PATH=$(node -e "import('@sparticuz/chromium').then(async c=>console.log(await c.default.executablePath()))")` |

## Vista previa en vivo
`node preview.mjs clips/x.js` → abre la URL. Espacio reproduce/pausa, ←/→ avanzan un cuadro (Shift = 1 s), G muestra la zona segura, los botones saltan a cada escena. Recarga (F5) después de editar el clip. Los avisos del motor salen en amarillo bajo la barra.
