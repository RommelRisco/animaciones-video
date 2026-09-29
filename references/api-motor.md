# API del motor (para escenas `personalizada`)

```js
{ tipo: 'personalizada', palabras: 5, construir: async (M, S, e) => {
    let t = S.t0;                                   // cuándo puede empezar el contenido de esta escena
    const T = M.text(S, S.g, 'Hola', { x: S.caja.x, y: S.caja.y, w: S.caja.w, size: 140, font: 'titulo', resalta: 'Hola' });
    t = M.appear(S, T, t, 'escribir');               // devuelve el tiempo en que termina
    t = M.mark(S, T, t);                            // subraya/encierra lo que está en resalta
    const ic = M.icon(S, S.g, 'cohete', S.caja.x + S.caja.w / 2, S.caja.y + 700, 360);
    t = M.drawIcon(S, ic, t, 1.0);
    return t;                                       // fin de la animación (el motor agrega la pausa de lectura)
} }
```

## Modelo de tiempo (lo más importante)
- Todo es **función del tiempo**. El motor arma una línea de tiempo GSAP en pausa y, para cada cuadro, hace `seek(t)` y ejecuta los *updaters*. Así cada cuadro sale igual sin importar el orden: por eso se puede renderizar en paralelo.
- Los tiempos son **absolutos en segundos de guion** (antes de `velocidad`). Usa `S.t0` como inicio y ve encadenando: casi todas las funciones devuelven el tiempo en que terminan.
- **No uses** `setTimeout`, `requestAnimationFrame`, `Math.random()` ni `Date` para animar. Usa `M.to` / `M.set` / `M.every` y `M.rand()` (aleatorio con semilla).
- Nunca animes con GSAP el `transform` de un elemento SVG directamente: crea un proxy con `M.anim(elemento)` y anima el proxy.
- Los *updaters* (`M.every`) corren en el orden en que se registran. Si un updater calcula valores que usa un `M.anim`, regístralo **antes** de crear ese `M.anim`.

## Escena `S`
| Propiedad | Qué es |
|---|---|
| `S.g` | grupo principal (en estilos a mano lleva el temblor de línea) |
| `S.plain` | grupo sin filtro (fotos, capturas, UI nítida) |
| `S.caja` | `{ x, y, w, h }` zona útil (segura) en px del lienzo |
| `S.col` | colores ya ajustados al fondo de la escena: `tinta, acento, acento2, acento3, suave, malo, bueno, amarillo, resaltador` |
| `S.t0`, `S.start` | inicio del contenido / inicio de la escena (incluye la transición de entrada) |
| `S.herramienta` | herramienta de la escena (`marcador`, `tiza`, `lapiz` o `null`) |
| `S.bg` | `{ kind, color }` del fondo (`color` es `null` si es transparente) |
| `M.W`, `M.H`, `M.u` | tamaño del lienzo y escala (`u = min(W,H)/1080`; multiplica tus medidas por `u`) |
| `M.style` | estilo resuelto (colores, fuentes, `mano`, etc.) |

## Funciones
| Función | Devuelve | Notas |
|---|---|---|
| `M.el(tag, attrs, padre)` | elemento SVG | crea cualquier cosa (`rect`, `circle`, `path`, `text`, `image`…) |
| `M.anim(el, { pivot:[x,y], x, y, s, sx, sy, r, o, bx, by })` | proxy | anima `x, y, s` (escala), `sx, sy`, `r` (grados), `o` (opacidad). `bx/by` = posición base |
| `M.to(proxy, { prop: valor, duration, ease }, t)` | tiempo final | tween en la línea de tiempo (easings de GSAP: `power2.out`, `back.out(2)`, `elastic.out(1,0.4)`…) |
| `M.set(proxy, { prop: valor }, t)` | t | cambio instantáneo en `t` |
| `M.every(T => …)` | — | código que corre cada cuadro con el tiempo de guion `T` |
| `M.text(S, padre, texto, o)` | bloque `T` | `o: { x, y, w, h, size, font: 'titulo'|'texto'|'num'|{familia,peso}, color, align, valign, maxLines, resalta, marca, mayus }`. `T` trae `lines`, `words`, `top`, `bottom`, `left`, `right`, `size`, `lh` |
| `M.appear(S, T, t, efecto, o)` | tiempo final | `escribir` (con herramienta), `palabras`, `teclear`, `golpe`, `deslizar`, `fundido` |
| `M.mark(S, T, t, { tipo, color })` | tiempo final | marca las palabras de `resalta`: `subrayado`, `circulo`, `resaltador`, `caja` |
| `M.path(padre, d, { color, w, fill })` | `<path>` | trazo redondeado |
| `M.draw(S, path, t, dur, { herramienta, ease, sonido })` | tiempo final | dibuja el trazo; la herramienta sigue la punta |
| `M.icon(S, padre, nombre, cx, cy, tamaño, { color, trazo, rellenar, colorRelleno })` | ícono | ver lista en `componentes.md` |
| `M.drawIcon(S, ic, t, dur)` / `M.popIcon(S, ic, t)` | tiempo final | dibujado a mano / aparece con rebote |
| `M.arrow(S, padre, x1, y1, x2, y2, { curva, cabeza, color })` + `M.drawArrow(S, ar, t, dur)` | flecha / tiempo | `curva` −0.3…0.3 |
| `M.bubble(S, padre, x, y, w, h, colaX, colaY, { fill, color })` | globo | globo de diálogo con colita |
| `M.mascot(S, padre, x, y, { escala, color, imagen })` | `rig` | `rig.entrar(t)`, `saludar`, `senalar(t, dir, hold, ang)`, `saltar(t, n)`, `celebrar`, `pensar`, `sorpresa`, `triste`, `feliz`, `hablar(a, b)`, `cara('abierta'|'sonrisa'|'o'|'triste'|'plana', t)`, `salir(t)` |
| `M.confetti(padre, x, y, t)` | — | confeti determinista |
| `M.shake(S, t, px)` | — | sacude la cámara de la escena |
| `M.sfx(tipo, t, { dur, vol, n, tono })` | — | efectos: `pop`, `burbuja`, `salto`, `sorpresa`, `whoosh`, `escritura`, `tiza`, `lapiz`, `resaltador`, `borrador`, `tecla`, `click`, `ding`, `exito`, `error`, `golpe`, `conteo` |
| `await M.image('assets/x.png')` | `{ url, w, h }` | carga una imagen (úsala como `href` de un `<image>`) |
| `M.color(S, 'acento')` | color | resuelve nombres de paleta |
| `M.rand()` | 0–1 | aleatorio con semilla (`clip.semilla`) |
| `M.warn(msg)` | — | aviso que aparece en consola y en la vista previa |

## Ejemplo: algo que se mueve por un camino
```js
const path = M.path(S.g, 'M100,900 C400,600 700,1200 980,900', { color: S.col.acento2, w: 8 * M.u });
let t = M.draw(S, path, S.t0, 0.8);
const len = path.getTotalLength(), p = { v: 0 };
let a;
M.every(() => { const pt = path.getPointAtLength(len * p.v); a.x = pt.x; a.y = pt.y; }); // primero calcula…
const ic = M.icon(S, S.g, 'cohete', 0, 0, 140 * M.u);
a = M.anim(ic.g, { pivot: [0, 0] });                                                     // …luego aplica
M.to(p, { v: 1, duration: 1.5, ease: 'power1.inOut' }, t);
return t + 1.5;
```

## Reglas que mantienen el render correcto
1. Mide y posiciona **al construir** (las fuentes ya están cargadas): `T.bottom`, `getBBox()`, `getTotalLength()`.
2. Estado inicial en el proxy (`M.anim(el, { o: 0, s: 0 })`), nunca con `from`/`fromTo` de GSAP.
3. Un solo `M.anim` por elemento. Si necesitas dos movimientos independientes, envuelve en `<g>` y anima cada nivel.
4. Si algo debe verse solo un tramo, hazlo en un updater: `M.every(T => el.style.display = T >= a && T < b ? '' : 'none')`.
5. Fotos y capturas en `S.plain` (sin temblor). Trazos a mano en `S.g`.
6. Deja el contenido dentro de `S.caja`; fuera de ella la interfaz de la red social lo tapa.
