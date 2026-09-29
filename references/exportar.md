# Exportar y usar en tu editor

## Comando
```bash
node render.mjs clips/<nombre>.js [opciones]
```
| Opción | Efecto |
|---|---|
| *(sin opciones)* | video final en `salida/<nombre>/` |
| `--escenas` | QA: una foto por escena + `qa/contacto.jpg` |
| `--cada 0.7` / `--fotos 1.2,3.4` | QA: fotos cada N s / en esos segundos |
| `--formato 16:9` | cambia el formato sin tocar el clip (`9:16`, `16:9`, `1:1`, `4:5`, `1280x720`) |
| `--estilo oscuro` | cambia el estilo sin tocar el clip |
| `--fps 60` | más fluido (tarda el doble) |
| `--alfa` | fondo transparente → `.mov` + `.webm` |
| `--croma` | fondo verde puro `#00FF00` → `.mp4` para *chroma key* |
| `--png` | además deja la secuencia de PNG (`<nombre>-png/`) |
| `--gif` | además genera un `.gif` ligero (15 fps) |
| `--borrador` | mitad de resolución y 15 fps: rapidísimo para revisar el movimiento |
| `--desde 4 --hasta 9` | solo un tramo |
| `--musica assets/tema.mp3` | mezcla la música bajo los efectos y normaliza a −14 LUFS (`--volumen-musica 0.35`) |
| `--sin-audio` | sin pista de audio |
| `--sin-webm` | con alfa, solo el `.mov` (más rápido) |
| `--trabajadores 3` | pestañas en paralelo (por defecto: núcleos − 1, máx. 4) |
| `--salida carpeta` | otra carpeta de salida |

## Qué archivo usar
| Archivo | Qué es | Dónde usarlo |
|---|---|---|
| `<nombre>.mp4` | H.264 + AAC, `yuv420p`, *faststart* | subir directo a redes; cualquier editor |
| `<nombre>.mov` | ProRes 4444 **con transparencia** | Premiere Pro, DaVinci Resolve, Final Cut Pro, After Effects: ponlo en una pista encima de tu video |
| `<nombre>.webm` | VP9 **con transparencia**, muy liviano | web, OBS, editores que lean WebM con alfa |
| `<nombre>-png/` | PNG numerados (con alfa si aplica) | cualquier programa que importe secuencias de imágenes |
| `<nombre>.mp4` con `--croma` | fondo verde puro | editores sin alfa (CapCut móvil, InShot…): usa su herramienta "chroma key" / "quitar fondo" |
| `<nombre>.gif` | vista previa | docs, Slack, README |
| `<nombre>-sfx.wav` | efectos de sonido | en exportaciones con alfa van aparte: ponlos en una pista de audio |
| `<nombre>-marcas.json` | inicio y fin de cada escena | para cortar o poner marcadores en tu línea de tiempo |

Notas:
- **Transiciones sueltas**: tapan toda la pantalla justo en su mitad; coloca esa mitad sobre el corte entre tus dos clips.
- **Subtítulos**: el clip dura lo mismo que tus líneas; alinéalo con el inicio del audio. Para sincronía perfecta usa `palabras` con tiempos por palabra.
- Si tu editor muestra negro en lugar de transparencia, el archivo no se está leyendo con alfa: prueba el `.mov`, luego la secuencia PNG y, si nada funciona, `--croma`.
- Con `--croma` evita elementos verdes y bordes muy finos (el recorte deja halo).

## Tiempos de render (orientativo)
~5–10 cuadros por segundo por núcleo a 1080p. Un reel de 30 s (900 cuadros) tarda ~1–4 min según la computadora; con alfa + WebM algo más. `--borrador` es ~4× más rápido.
