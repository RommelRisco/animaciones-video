---
name: animaciones-video
description: Crea animaciones por código listas para usar en videos — escenas explicativas estilo pizarra (plumón, tiza, lápiz), tipografía cinética, listas, cifras que cuentan, gráficas de barras, comparaciones, capturas señaladas, llamados a la acción, una mascota que actúa, rótulos (lower thirds), subtítulos karaoke y transiciones — y las exporta a MP4 (9:16, 16:9, 1:1, 4:5), MOV ProRes 4444 o WebM con fondo transparente, PNG o GIF, con efectos de sonido sintetizados. Úsalo cuando pidan "una animación para mi video", "video animado", "video tipo pizarra / whiteboard", "explicativo animado", "reel o short animado", "rótulo / lower third", "subtítulos animados", "transición para mi edición", "motion graphics", "intro u outro animada", o quieran explicar un tema, dato o proceso en video sin grabarse, aunque no digan "animación".
license: MIT
---

# animaciones-video

Convierte una idea en animaciones que se pueden usar tal cual o meter en un editor (Premiere, DaVinci, Final Cut, CapCut…). Todo se genera con código (SVG + GSAP), se renderiza cuadro por cuadro con Chromium y se codifica con ffmpeg, así que el resultado es **determinista**: el mismo clip produce siempre el mismo video.

El motor ya está hecho en `template/`. Tu trabajo es entender qué pieza necesita la persona, escribir un **clip** (un archivo `.js` con una lista de escenas) y revisar el resultado. **No reescribas el motor**: si algo no existe, usa la escena `personalizada` con el API (`references/api-motor.md`).

## Qué puede salir de aquí

| Pieza | Cómo | Salida típica |
|---|---|---|
| Reel/Short/TikTok explicativo completo | varias escenas + mascota, 9:16 | `.mp4` con efectos de sonido |
| Segmento o B-roll para insertar en un video | 1–3 escenas, 16:9 o 9:16 | `.mp4` |
| Gráfico encima del video (rótulo, subtítulos, flecha, cifra) | `fondo: 'transparente'` | `.mov` (ProRes 4444) + `.webm` con alfa |
| Transición para un corte | escena `transicion` con fondo transparente | `.mov`/`.webm`; tapa todo justo a la mitad |
| Editor sin soporte de alfa (CapCut móvil, InShot) | `--croma` | `.mp4` sobre verde puro para *chroma key* |
| Vista previa ligera / para docs | `--gif` | `.gif` |

Tipos de escena (detalle en `references/componentes.md`): `titulo`, `idea`, `flujo`, `lista`, `cifra`, `barras`, `comparacion`, `cita`, `imagen`, `mascota`, `cta`, `rotulo`, `subtitulos`, `transicion`, `personalizada`.
Estilos (`references/estilos-y-marca.md`): `pizarra` (plumón), `pizarron` (tiza), `cuaderno` (lápiz y marcatextos), `kraft` (cartón), `minimal` (limpio), `oscuro` (tech/neón). Todos aceptan colores, fuentes y logo de marca.

## Flujo

### 1 · Entender el pedido (rápido)
Averigua solo lo que cambie el resultado; lo demás decídelo con los valores por defecto y dilo en el resumen.

| Dato | Por defecto |
|---|---|
| Dónde se usará | video completo para redes → 9:16 |
| Formato | 9:16 (Reels/TikTok/Shorts) · 16:9 (YouTube) · 1:1 / 4:5 (feed) |
| Estilo | `pizarra` para explicar; `minimal` u `oscuro` para datos/tecnología |
| Texto y datos | los da la persona; **nunca inventes cifras** (ver abajo) |
| Marca | colores y fuentes del estilo; pregunta si tiene hex, fuente o logo |
| Mascota | sí en explicativos para redes; no en overlays |
| Audio | efectos sintetizados; música solo si la persona da el archivo |
| Duración | la que pida el contenido: 5–8 s por escena, 30–60 s un reel |

Si el pedido ya trae lo necesario (o dice "hazlo directo"), no preguntes: muestra un resumen de 3–5 líneas y arranca. Si faltan cosas que no puedes suponer (el texto, las cifras reales, su marca), haz como máximo 3 preguntas en una sola tanda, cada una con una opción recomendada.

### 2 · Guion → aprobación
Lee `references/guion-y-ritmo.md` y escribe una tabla corta: escena · tipo · texto en pantalla · qué se dibuja o hace la mascota · transición. Muéstrala y espera el visto bueno antes de renderizar algo largo (salvo que haya pedido hacerlo directo). Cambiar un guion cuesta segundos; un render, minutos.

### 3 · Preparar el proyecto (una vez)
```bash
SKILL_DIR=<carpeta de este SKILL.md>   # p. ej. ~/.claude/skills/animaciones-video
PROJ=./<nombre-del-proyecto>            # o la carpeta que indique la persona
mkdir -p "$PROJ" && cp -R "$SKILL_DIR/template/." "$PROJ/" && cd "$PROJ"
npm install
npx playwright install chromium      # si falla por red: ver references/qa-y-errores.md
ffmpeg -version                      # obligatorio (brew/winget/apt install ffmpeg)
```
Necesita Node 18+ y ffmpeg. Las fuentes vienen por npm (funcionan sin internet).

### 4 · Escribir el clip
Crea `clips/<nombre>.js` partiendo del ejemplo más parecido:
- `clips/ejemplo-explicativo.js` — reel 9:16, pizarra, mascota (el más completo)
- `clips/ejemplo-datos.js` — 16:9 minimal: cifra con anillo, barras, captura señalada, cita
- `clips/ejemplo-overlays.js` — rótulo + subtítulos karaoke con fondo transparente
- `clips/ejemplo-transiciones.js` — transiciones sueltas con alfa
- `clips/ejemplo-personalizada.js` — 1:1 oscuro con una escena propia hecha con el API

Reglas que evitan retrabajo:
- Una idea por escena; titular ≤ 10 palabras; el texto se entiende sin audio.
- Pon en `resalta` la palabra clave de cada titular (se colorea y subraya/encierra).
- Varía los tipos de escena y deja que `transicion: 'auto'` alterne transiciones.
- Imágenes y SRT van en `assets/` y se referencian como `'assets/archivo.png'`.
- El texto se ajusta solo a su caja; si el motor avisa "Texto muy largo", acórtalo en vez de bajar el tamaño.

### 5 · Revisar (obligatorio antes del render final)
```bash
node render.mjs clips/<nombre>.js --escenas          # 1 foto por escena → salida/<nombre>/qa/contacto.jpg
node render.mjs clips/<nombre>.js --fotos 4.2,4.5    # fotos puntuales (p. ej. dentro de una transición)
node render.mjs clips/<nombre>.js --cada 0.7         # recorrido completo
```
Abre `contacto.jpg` con Read y revisa: texto cortado o encimado, mascota tapando texto, escenas vacías, contraste, que nada importante quede fuera de la zona segura. Los tiempos de cada escena están en la consola y en `salida/<nombre>/qa/indice.txt`. Corrige y vuelve a mirar. Problemas típicos: `references/qa-y-errores.md`.

Si la persona tiene el proyecto en su computadora, la vista previa en vivo es `node preview.mjs clips/<nombre>.js` (abre la URL que imprime; Espacio reproduce, G muestra la zona segura).

### 6 · Render final y entrega
```bash
node render.mjs clips/<nombre>.js                     # MP4 (o MOV+WebM si el fondo es transparente)
node render.mjs clips/<nombre>.js --musica assets/tema.mp3 --gif
```
Opciones y qué archivo usar en cada editor: `references/exportar.md`. Un clip de 30 s tarda ~1–4 min según la computadora. Si es largo, córrelo en segundo plano y avisa.

Entrega el archivo principal y di en una o dos líneas qué contiene y cómo usarlo (p. ej. "el `.mov` va en una pista encima de tu video"). Incluye `-marcas.json` si la persona edita (trae el inicio y fin de cada escena).

### 7 · Cambios
Edita solo el clip y repite QA → render. Guarda versiones (`clips/<nombre>-v2.js`) si los cambios son grandes.

## Datos y honestidad
- En pantalla van solo cifras que la persona dio o que tienen fuente verificable; usa `fuente: '…'` en `cifra` y `barras`. No calcules cifras derivadas que la fuente no dice.
- Si falta un dato real, pon un marcador visible ("DATO POR CONFIRMAR" o "datos de ejemplo") y avísale.
- No pongas nombres de clientes o terceros sin permiso; no imites logotipos ni personajes con derechos de autor (la mascota incluida es original; su propio logo sí se puede usar con `mascota: { imagen }`).

## Personalizar (no digas "no se puede")
| Pide… | Haz |
|---|---|
| Sus colores / fuentes | `marca: { acento, acento2, tinta, fondo, fuenteTitulo, fuenteTexto }` |
| Su logo o personaje como mascota | `mascota: { imagen: 'assets/logo.png', accion: 'saltar' }` |
| Otro fondo en una escena | `fondo: 'acento' \| 'degradado' \| 'pizarron' \| '#hex'` en esa escena |
| Otra herramienta | `herramienta: 'marcador' \| 'tiza' \| 'lapiz' \| null` |
| Ir al ritmo de su música | `ritmo: { bpm: 110 }` en el clip + `--musica` |
| Algo que no existe | escena `personalizada` (ver `references/api-motor.md`) |
