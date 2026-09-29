// animaciones-video · texto: maquetado con ajuste automático + animaciones de entrada y marcas
import { el, norm, nextId, wobblyEllipse, handLine, clamp, contrast } from './util.js';

let ctx;
const measure = (str, font, size) => {
  ctx ||= document.createElement('canvas').getContext('2d');
  ctx.font = `${font.peso} ${size}px "${font.familia}"`;
  return ctx.measureText(str).width;
};

// Resuelve 'titulo' | 'texto' | 'num' | {familia, peso, escala}
export function fontOf(M, f = 'texto') {
  if (typeof f === 'object') return { escala: 1, ...f };
  return M.style[f] || M.style.texto;
}

// Divide en líneas respetando el ancho; respeta \n explícitos
export function layout(text, font, size, maxW, lineH = 1.12, espacio = 1) {
  const spaceW = measure(' ', font, size) * espacio;
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = [], curW = 0;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const w = measure(word, font, size);
      const add = cur.length ? spaceW + w : w;
      if (cur.length && curW + add > maxW) { lines.push({ words: cur, w: curW }); cur = []; curW = 0; }
      cur.push({ t: word, w, x: cur.length ? curW + spaceW : 0 });
      curW += cur.length > 1 ? spaceW + w : w;
    }
    lines.push({ words: cur, w: curW });
  }
  const widest = Math.max(0, ...lines.flatMap(l => l.words.map(w => w.w)));
  return { lines, size, lh: size * lineH, spaceW, h: lines.length * size * lineH, w: Math.max(0, ...lines.map(l => l.w)), widest };
}

// Busca el tamaño más grande (≤ size) que cabe en maxW × maxH y maxLines
export function fit(text, font, { size, maxW, maxH = Infinity, maxLines = 4, lineH = 1.12, minScale = 0.3, espacio = 1 }) {
  let s = size, L;
  for (let k = 0; k < 60; k++) {
    L = layout(text, font, s, maxW, lineH, espacio);
    if (L.lines.length <= maxLines && L.h <= maxH && L.widest <= maxW) return L;
    if (s <= size * minScale) break;
    s *= 0.95;
  }
  console.warn(`Texto muy largo para su caja, recórtalo: "${String(text).slice(0, 60)}…"`);
  return L;
}

/* Crea un bloque de texto.
 * o: { x, y, w, h, size, font, color, align, maxLines, lineH, valign, resalta, colorResalta, marca, mayus, peso }
 * (x, y) = esquina superior izquierda de la caja; el texto se alinea dentro de la caja de ancho w.
 */
function prepare(M, text, o) {
  const font = fontOf(M, o.font);
  const mayus = o.mayus ?? (o.font === 'titulo' && M.style.mayus);
  const str = mayus ? String(text).toLocaleUpperCase('es') : String(text);
  const size = (o.size ?? 80) * M.u * (font.escala ?? 1);
  const maxW = o.w ?? (M.W - 200 * M.u);
  const L = fit(str, font, { size, maxW, maxH: o.h ?? Infinity, maxLines: o.maxLines ?? 4, lineH: o.lineH ?? 1.12, espacio: o.espacio ?? 1 });
  return { font, L, maxW };
}

// Mide sin crear nada: { h, w, size, lines }
export function measureText(M, text, o = {}) {
  const { L } = prepare(M, text, o);
  return { h: L.h, w: L.w, size: L.size, lines: L.lines.length };
}

export function makeText(M, parent, text, o = {}) {
  const { font, L, maxW } = prepare(M, text, o);
  const align = o.align ?? 'center';
  let top = o.y ?? 0;
  if (o.valign === 'middle' && o.h) top = o.y + (o.h - L.h) / 2;
  if (o.valign === 'bottom' && o.h) top = o.y + o.h - L.h;
  const g = el('g', {}, parent);
  const bgL = el('g', {}, g);
  const color = o.color ?? M.col.tinta;
  const T = { g, bgL, lines: [], words: [], size: L.size, lh: L.lh, top, height: L.h, font, align, color };

  // palabras a resaltar
  const targets = [].concat(o.resalta || []).filter(Boolean).map(p => String(p).split(/\s+/).map(norm).filter(Boolean));
  let idx = 0;
  L.lines.forEach((ln, li) => {
    const x0 = align === 'left' ? o.x : align === 'right' ? o.x + maxW - ln.w : o.x + (maxW - ln.w) / 2;
    const y = top + li * L.lh;
    const base = y + L.size * 0.86;
    const lg = el('g', {}, g);
    const line = { g: lg, x0, y, base, w: ln.w, words: [], i: li, text: ln.words.map(w => w.t).join(' ') };
    ln.words.forEach(wd => {
      const wg = el('g', {}, lg);
      const te = el('text', {
        x: (x0 + wd.x).toFixed(1), y: base.toFixed(1), 'font-family': `"${font.familia}"`, 'font-weight': font.peso,
        'font-size': L.size.toFixed(1), fill: color,
      }, wg);
      te.textContent = wd.t;
      const W = { g: wg, te, t: wd.t, x: x0 + wd.x, w: wd.w, y, base, i: idx++, line: li, hl: false };
      line.words.push(W); T.words.push(W);
    });
    T.lines.push(line);
  });
  // marcar coincidencias
  T.ranges = [];
  const toks = T.words.map(w => norm(w.t));
  for (const tg of targets) {
    for (let i = 0; i + tg.length <= toks.length; i++) {
      if (tg.every((tk, j) => toks[i + j] === tk)) { T.ranges.push([i, i + tg.length - 1]); for (let j = 0; j < tg.length; j++) T.words[i + j].hl = true; break; }
    }
  }
  const marca = o.marca ?? M.style.marca;
  const hlColor = o.colorResalta ?? M.col.acento;
  if (marca !== 'resaltador') T.words.filter(w => w.hl).forEach(w => w.te.setAttribute('fill', hlColor));
  T.left = Math.min(...T.lines.map(l => l.x0)); T.right = Math.max(...T.lines.map(l => l.x0 + l.w));
  T.bottom = top + L.h; T.cx = (T.left + T.right) / 2; T.cy = top + L.h / 2;
  T.marca = marca; T.hlColor = hlColor;
  return T;
}

// Proxy de animación para todo el bloque
export function blockAnim(M, T, init = {}) {
  if (!T.a) T.a = M.anim(T.g, { pivot: [T.cx, T.cy], ...init });
  else Object.assign(T.a, init);
  return T.a;
}

/* ------------------------- entradas ------------------------- */

// Escritura a mano: cada línea se revela de izquierda a derecha y la herramienta sigue el trazo
export function escribir(M, S, T, t, o = {}) {
  const cps = (o.vel ?? 30) * (M.style.mano ? 1 : 1.6);
  const tool = o.herramienta !== undefined ? o.herramienta : S.herramienta;
  let at = t;
  T.lines.forEach(line => {
    const id = nextId('av-clip');
    const cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, M.defs);
    const pad = T.size * 0.25;
    const r = el('rect', { x: line.x0 - pad, y: line.y - T.size * 0.4, height: T.lh + T.size * 0.8, width: 0 }, cp);
    line.g.setAttribute('clip-path', `url(#${id})`);
    const dur = clamp(line.text.length / cps, 0.25, 2.2);
    const p = { v: 0 };
    const full = line.w + pad * 2;
    M.every(() => r.setAttribute('width', (p.v * full).toFixed(1)));
    M.to(p, { v: 1, duration: dur, ease: 'none' }, at);
    const t0 = at, sz = T.size;
    if (tool) M.toolSeg(tool, t0, t0 + dur, Tm => {
      const k = clamp((Tm - t0) / dur, 0, 1);
      const x = line.x0 - pad + k * full - pad * 0.7;
      const y = line.base - sz * 0.32 + Math.sin(Tm * 41) * sz * 0.13 + Math.sin(Tm * 17) * sz * 0.05;
      return [x, y, line.g];
    });
    M.sfx(tool === 'tiza' ? 'tiza' : tool === 'lapiz' ? 'lapiz' : 'escritura', at, { dur });
    at += dur + 0.06;
  });
  return at;
}

// Palabra por palabra con rebote
export function palabras(M, S, T, t, o = {}) {
  const st = o.stagger ?? clamp(1.1 / T.words.length, 0.06, 0.14);
  let at = t;
  T.words.forEach((w, i) => {
    const a = M.anim(w.g, { pivot: [w.x + w.w / 2, w.base - T.size * 0.35], o: 0, s: 0.45, y: T.size * 0.35 });
    M.to(a, { o: 1, duration: 0.12, ease: 'none' }, at);
    M.to(a, { s: 1, y: 0, duration: 0.42, ease: 'back.out(2.2)' }, at);
    if (i % 2 === 0) M.sfx('pop', at, { vol: 0.45, tono: 1 + (i % 5) * 0.06 });
    at += st;
  });
  return at + 0.3;
}

// Máquina de escribir (con cursor)
export function teclear(M, S, T, t, o = {}) {
  const cps = o.vel ?? 26;
  let at = t;
  const font = T.font;
  const caret = el('rect', { width: Math.max(3, T.size * 0.06), height: T.size * 0.9, fill: o.colorCursor ?? M.col.acento, opacity: 0 }, T.g);
  const segs = [];
  T.lines.forEach(line => {
    const id = nextId('av-clip');
    const cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, M.defs);
    const r = el('rect', { x: line.x0 - 2, y: line.y - T.size * 0.4, height: T.lh + T.size * 0.8, width: 0 }, cp);
    line.g.setAttribute('clip-path', `url(#${id})`);
    const chars = [...line.text];
    const ctx2 = document.createElement('canvas').getContext('2d');
    ctx2.font = `${font.peso} ${T.size}px "${font.familia}"`;
    const pref = chars.map((_, i) => ctx2.measureText(line.text.slice(0, i + 1)).width);
    const dur = chars.length / cps;
    const p = { v: 0 };
    M.every(() => { const n = Math.floor(p.v); r.setAttribute('width', n <= 0 ? 0 : (pref[Math.min(n, pref.length) - 1] + 4).toFixed(1)); });
    M.to(p, { v: chars.length + 0.999, duration: dur, ease: 'none' }, at);
    segs.push({ a: at, b: at + dur, line, pref, p });
    M.sfx('tecla', at, { dur, n: chars.length });
    at += dur + 0.12;
  });
  const end = at;
  M.every(Tm => {
    let s = segs.find(s => Tm >= s.a - 0.12 && Tm <= s.b + 0.1);
    let show = !!s;
    if (!s && Tm > end && Tm < end + 1.2) { s = segs[segs.length - 1]; show = Math.floor((Tm - end) / 0.28) % 2 === 0; }
    if (!s || Tm < t - 0.01) { caret.setAttribute('opacity', 0); return; }
    const n = Math.floor(s.p.v);
    const x = s.line.x0 + (n > 0 ? s.pref[Math.min(n, s.pref.length) - 1] : 0) + 3;
    caret.setAttribute('x', x.toFixed(1)); caret.setAttribute('y', (s.line.base - T.size * 0.78).toFixed(1));
    caret.setAttribute('opacity', show ? 1 : 0);
  });
  return end;
}

// Golpe: entra grande y se asienta con sacudida
export function golpe(M, S, T, t) {
  const a = blockAnim(M, T, { s: 2.2, o: 0 });
  M.to(a, { o: 1, duration: 0.1, ease: 'none' }, t);
  M.to(a, { s: 1, duration: 0.32, ease: 'power4.in' }, t);
  M.to(a, { r: 2.5, duration: 0.06, ease: 'none', yoyo: true, repeat: 3 }, t + 0.32);
  M.sfx('golpe', t + 0.3);
  M.shake?.(S, t + 0.32, 10);
  return t + 0.6;
}

// Líneas que suben desde una máscara (look editorial)
export function deslizar(M, S, T, t, o = {}) {
  let at = t;
  T.lines.forEach(line => {
    const id = nextId('av-clip');
    const cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, M.defs);
    el('rect', { x: line.x0 - T.size, y: line.y - T.size * 0.3, width: line.w + T.size * 2, height: T.lh + T.size * 0.45 }, cp);
    const outer = el('g', { 'clip-path': `url(#${id})` }, line.g.parentNode);
    outer.appendChild(line.g);
    const a = M.anim(line.g, { pivot: [line.x0, line.base], y: T.lh * 1.05 });
    M.to(a, { y: 0, duration: 0.55, ease: 'power3.out' }, at);
    at += o.stagger ?? 0.1;
  });
  M.sfx('whoosh', t, { vol: 0.35, dur: 0.4 });
  return at + 0.45;
}

export function fundido(M, S, T, t) {
  const a = blockAnim(M, T, { o: 0, y: 30 * M.u });
  M.to(a, { o: 1, y: 0, duration: 0.5, ease: 'power2.out' }, t);
  return t + 0.5;
}

export function aparecer(M, S, T, t, efecto, o = {}) {
  const fx = { escribir, palabras, teclear, golpe, deslizar, fundido }[efecto];
  if (!fx) throw new Error(`Efecto de texto desconocido "${efecto}" (usa escribir, palabras, teclear, golpe, deslizar, fundido)`);
  return fx(M, S, T, t, o);
}

/* ------------------------- marcas sobre palabras ------------------------- */
// Subraya / encierra / resalta los rangos de "resalta". Devuelve el tiempo final.
export function marcar(M, S, T, t, o = {}) {
  const tipo = o.tipo ?? T.marca;
  if (!tipo || tipo === 'color' || !T.ranges.length) return t;
  let at = t;
  for (const [i0, i1] of T.ranges) {
    // un rango puede partirse en varias líneas
    const byLine = new Map();
    for (let i = i0; i <= i1; i++) { const w = T.words[i]; if (!byLine.has(w.line)) byLine.set(w.line, []); byLine.get(w.line).push(w); }
    for (const ws of byLine.values()) {
      const x1 = ws[0].x, x2 = ws[ws.length - 1].x + ws[ws.length - 1].w, base = ws[0].base, sz = T.size;
      const color = o.color ?? T.hlColor;
      if (tipo === 'resaltador') {
        const hc = o.color ?? M.col.resaltador;
        const r = el('path', { d: `M${x1 - sz * 0.12},${base - sz * 0.42} L${x2 + sz * 0.1},${base - sz * 0.47} L${x2 + sz * 0.14},${base + sz * 0.1} L${x1 - sz * 0.1},${base + sz * 0.13} Z`, fill: hc, opacity: M.style.mano ? 0.75 : 0.9 }, T.bgL);
        const a = M.anim(r, { pivot: [x1, base], sx: 0 });
        M.to(a, { sx: 1, duration: 0.35, ease: 'power2.inOut' }, at);
        M.sfx('resaltador', at, { dur: 0.35 });
        at += 0.3;
      } else if (tipo === 'subrayado') {
        const y = base + sz * 0.14;
        const d = M.style.mano ? handLine(x1 - sz * 0.05, y, x2 + sz * 0.08, y + sz * 0.03, 11 + i0, 1.4) : `M${x1},${y} L${x2},${y}`;
        const p = el('path', { d, fill: 'none', stroke: color, 'stroke-width': Math.max(5, sz * 0.07), 'stroke-linecap': 'round' }, T.g);
        at = M.draw(S, p, at, 0.38, { sonido: M.style.mano });
      } else if (tipo === 'circulo') {
        const cx = (x1 + x2) / 2, cy = base - sz * 0.32;
        const p = el('path', { d: wobblyEllipse(cx, cy, (x2 - x1) / 2 + sz * 0.3, sz * 0.62, 5 + i0), fill: 'none', stroke: color, 'stroke-width': Math.max(5, sz * 0.06), 'stroke-linecap': 'round' }, T.g);
        at = M.draw(S, p, at, 0.5, {});
      } else if (tipo === 'caja') {
        const r = el('rect', { x: x1 - sz * 0.15, y: base - sz * 0.82, width: x2 - x1 + sz * 0.3, height: sz * 1.0, rx: sz * 0.12, fill: color }, T.bgL);
        ws.forEach(w => w.te.setAttribute('fill', contrast('#FFFFFF', color) >= 2.6 ? '#FFFFFF' : '#111114'));
        const a = M.anim(r, { pivot: [x1, base], sx: 0 });
        M.to(a, { sx: 1, duration: 0.3, ease: 'power3.out' }, at);
        at += 0.25;
      }
    }
  }
  return at;
}
