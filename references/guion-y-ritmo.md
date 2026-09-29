# Guion y ritmo

## Antes de escribir escenas
Responde en una frase: **¿qué debe recordar quien lo vea?** Todo el guion trabaja para esa idea. Si hay dos ideas, son dos videos (o dos partes).

## Estructura para un reel explicativo (30–60 s, 5–9 escenas)
| Momento | Pregunta que responde | Escena típica | Duración |
|---|---|---|---|
| Gancho | ¿por qué me quedo? | `titulo` o `mascota` con pregunta, cifra o error común | 3–5 s |
| Contexto | ¿de qué hablamos? | `idea` | 4–6 s |
| Explicación | ¿cómo funciona? | `flujo`, `imagen` | 6–9 s |
| Prueba / contraste | ¿por qué creerlo? | `cifra`, `barras`, `comparacion` | 5–8 s |
| Qué hacer | ¿y yo qué hago? | `lista` | 5–8 s |
| Cierre | ¿y ahora? | `cta` | 4–6 s |

Para piezas sueltas (B-roll, un dato, un rótulo) basta con 1–3 escenas: no metas gancho ni CTA si van dentro de otro video.

## Ganchos que funcionan
- **Pregunta concreta**: "¿Tu app pregunta cada 5 segundos si hay algo nuevo?"
- **Cifra que sorprende** (real y con fuente): "El 70 % de los tickets son la misma duda".
- **Error común**: "Casi todos configuran esto al revés".
- **Antes/después** en la primera escena (`comparacion`).
- **La mascota saluda y promete**: "¡Hola! En 30 segundos entiendes los webhooks".

Evita intros lentas, logos al inicio y "en este video te voy a explicar…". El primer texto aparece en ~0.1 s (el motor ya lo hace): no le pongas escenas vacías delante.

## Texto en pantalla
- Se debe entender **sin audio**: la mayoría ve en silencio.
- Titular ≤ 10 palabras; texto de apoyo una sola frase.
- Una palabra clave por titular en `resalta`.
- Cifras enormes cuando la cifra **es** la noticia (`cifra`).
- Nada de párrafos: si necesitas más texto, parte la escena.
- Mismo idioma y registro que la persona (tuteo/usted, regionalismos).

## Ritmo
- Algo se mueve siempre: si el texto ya está, que la mascota reaccione o que el siguiente elemento entre.
- Varía el tipo de escena y el fondo; no más de dos escenas seguidas con la misma estructura.
- Transiciones de 0.5–0.8 s y distintas entre sí (`auto` lo hace).
- 5–8 s por escena. Si una escena pasa de 10 s, divídela.
- Si hay música con pulso claro, `ritmo: { bpm }` hace que los cambios caigan en el beat.
- `velocidad: 1.15` acelera todo si el borrador se siente lento (más fácil que tocar cada escena).

## Datos
- Solo cifras que la persona dio o que tienen fuente; pon `fuente` en `cifra` y `barras`.
- No derives números que la fuente no dice (p. ej. un "precio anterior" calculado desde un porcentaje).
- Si algo es ejemplo o maqueta, que lo diga en pantalla ("datos de ejemplo").

## Zona segura
En 9:16 la interfaz de Reels/TikTok/Shorts tapa arriba (~250 px) y abajo (~390 px). El motor coloca todo dentro de esa zona; en la vista previa, tecla **G** la muestra. Para piezas que no van a redes (presentaciones, overlays) usa `zonaSegura: false`.

## Tabla de guion (lo que se muestra antes de animar)
| # | Tipo | Texto en pantalla | Visual / mascota | Transición |
|---|---|---|---|---|
| 1 | titulo | ¿Tu app pregunta cada 5 segundos…? | mascota pensando | auto |
| 2 | idea | Eso se llama polling | reloj dibujado | auto |
| … | … | … | … | … |
