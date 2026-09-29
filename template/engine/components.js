// animaciones-video · componentes (tipos de escena). Cada uno recibe (M, S, e) y devuelve { fin, palabras, pausa?, camara? }
//   M = motor (API), S = escena (grupos, caja segura, colores, tiempos), e = especificación escrita en el clip.
import { el, clamp, roundRect, handRect, handLine, wobblyEllipse, mix, contrast } from './util.js';
import { measureText } from './text.js';
import { hatch } from './styles.js';
import { transition, TRANSITION_DUR } from './transitions.js';

const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
const efT = (M, e) => e.efecto ?? M.style.efectoTitulo;
const efX = (M, e) => e.efectoTexto ?? M.style.efectoTexto;
const portrait = M => M.H >= M.W;

/* ---------- mascota opcional en cualquier escena ---------- */
async function setupMascot(M, S, e) {
  if (!e.mascota) return null;
  const spec = typeof e.mascota === 'string' ? { accion: e.mascota } : { ...e.mascota };
  const B = S.caja, u = M.u, P = portrait(M);
  const esc = spec.escala ?? (P ? 0.95 : 0.9);
  const mh = 300 * u * esc;
  const lado = spec.lado ?? 'derecha';
  let x, y = B.y + B.h, bubbleBox = null, dir = 1, ang = 58;
  if (P) {
    const centro = lado === 'centro';
    const zone = mh + (centro && spec.dice ? 300 * u : 50 * u);
    x = lado === 'izquierda' ? B.x + 150 * u * esc : centro ? B.x + B.w / 2 : B.x + B.w - 150 * u * esc;
    S.caja = { ...B, h: B.h - zone };
    if (spec.dice) bubbleBox = centro
      ? { x: B.x + B.w * 0.12, y: y - mh - 280 * u, w: B.w * 0.76, h: 220 * u }
      : lado === 'izquierda'
        ? { x: x + 170 * u * esc, y: y - mh * 1.0, w: B.x + B.w - (x + 170 * u * esc), h: mh * 0.62 }
        : { x: B.x, y: y - mh * 1.0, w: x - 170 * u * esc - B.x, h: mh * 0.62 };
    dir = lado === 'izquierda' ? 1 : -1; ang = 125;
  } else {
    const zw = 500 * u;
    x = lado === 'izquierda' ? B.x + zw / 2 : B.x + B.w - zw / 2;
    S.caja = lado === 'izquierda' ? { ...B, x: B.x + zw, w: B.w - zw } : { ...B, w: B.w - zw };
    if (spec.dice) bubbleBox = { x: x - zw / 2 + 10 * u, y: y - mh - 250 * u, w: zw - 20 * u, h: 210 * u };
    dir = lado === 'izquierda' ? 1 : -1; ang = 60;
  }
  const imagen = spec.imagen ? await M.image(spec.imagen) : null;
  const rig = M.mascot(S, S.g, x, y, { escala: esc, color: spec.color ? M.color(S, spec.color) : undefined, imagen, seed: S.i + 1 });
  return {
    rig, spec, x, y,
    run(t0, contentEnd) {
      let t = rig.entrar(t0);
      let end = t;
      if (spec.dice && bubbleBox) {
        const bb = bubbleBox, tx = x + (P && lado !== 'centro' ? -dir * 0 : 0);
        const m = measureText(M, spec.dice, { size: 50, font: 'texto', w: bb.w - 60 * u, maxLines: 4, h: bb.h - 40 * u });
        const h = Math.min(bb.h, m.h + 56 * u), by = bb.y + (bb.h - h);
        const g = el('g', {}, S.g);
        const tail = P && lado !== 'centro' ? [x - dir * -1 * 0 + (lado === 'izquierda' ? 60 * u * esc : -60 * u * esc), y - mh * 0.7] : [x, y - mh + 10 * u];
        M.bubble(S, g, bb.x, by, bb.w, h, tail[0], tail[1], { fill: '#FFFFFF', color: '#1E1B18' });
        const T = M.text(S, g, spec.dice, { x: bb.x + 30 * u, y: by + 28 * u, w: bb.w - 60 * u, h: h - 40 * u, size: 50, font: 'texto', maxLines: 4, color: '#1E1B18', valign: 'middle' });
        const a = M.anim(g, { pivot: [tail[0], tail[1]], s: 0 });
        M.to(a, { s: 1, duration: 0.4, ease: 'back.out(2)' }, t);
        M.sfx('pop', t, { vol: 0.5 });
        const talkEnd = t + clamp(words(spec.dice) * 0.28, 0.8, 3);
        rig.hablar(t + 0.1, talkEnd);
        end = Math.max(end, t + 0.4, talkEnd - 0.6);
        void T;
      }
      const acc = spec.accion ?? (spec.dice ? 'hablar' : 'saludar');
      const en = spec.en != null ? t0 + spec.en : acc === 'celebrar' ? Math.max(t, contentEnd - 0.3) : t + 0.1;
      if (acc === 'senalar') end = Math.max(end, rig.senalar(en, dir, 1.4, ang));
      else end = Math.max(end, rig.accion(acc, en));
      return end;
    },
  };
}

/* ---------- títulos y bloques de texto ---------- */
function placeStack(M, B, parts, gap, posicion = 'centro') {
  const total = parts.reduce((a, p) => a + p.h, 0) + gap * (parts.filter(p => p.h > 0).length - 1);
  let y = posicion === 'arriba' ? B.y : posicion === 'abajo' ? B.y + B.h - total : B.y + (B.h - total) / 2;
  for (const p of parts) { if (!p.h) continue; p.y = y; y += p.h + gap; }
  return total;
}

async function titulo(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const size = e.tamano ?? (e.subtitulo ? 150 : 175);
  const tOpts = { x: B.x, w: B.w, size, font: 'titulo', maxLines: e.maxLineas ?? 5, resalta: e.resalta, marca: e.marca, h: B.h * 0.66 };
  const sOpts = { x: B.x + B.w * 0.04, w: B.w * 0.92, size: e.tamanoSubtitulo ?? 62, font: 'texto', maxLines: 3, color: S.col.suave };
  const ic = e.icono ? { h: Math.min(260 * u, B.h * 0.22) } : { h: 0 };
  const tt = { h: measureText(M, e.texto, tOpts).h };
  const st = { h: e.subtitulo ? measureText(M, e.subtitulo, sOpts).h : 0 };
  placeStack(M, B, [ic, tt, st], 46 * u, e.posicion);
  const T = M.text(S, S.g, e.texto, { ...tOpts, y: tt.y });
  let t = M.appear(S, T, S.t0, efT(M, e));
  t = M.mark(S, T, t + 0.05);
  if (e.subtitulo) { const Sb = M.text(S, S.g, e.subtitulo, { ...sOpts, y: st.y }); t = M.appear(S, Sb, t + 0.1, efX(M, e)); }
  if (e.icono) { const I = M.icon(S, S.g, e.icono, B.x + B.w / 2, ic.y + ic.h / 2, ic.h); t = Math.max(t, M.style.mano ? M.drawIcon(S, I, t, 0.8) : M.popIcon(S, I, S.t0 + 0.2)); }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.texto) + words(e.subtitulo) + words(mz?.spec.dice) };
}

async function idea(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const tOpts = { x: B.x, w: B.w, size: e.tamano ?? 120, font: 'titulo', maxLines: 3, resalta: e.resalta, marca: e.marca, h: B.h * 0.36 };
  const xOpts = { x: B.x + B.w * 0.04, w: B.w * 0.92, size: e.tamanoTexto ?? 66, font: 'texto', maxLines: 3, h: B.h * 0.24, resalta: e.resaltaTexto };
  const iconos = [].concat(e.iconos || e.icono || []);
  const tt = { h: e.titulo ? measureText(M, e.titulo, tOpts).h : 0 };
  const xt = { h: e.texto ? measureText(M, e.texto, xOpts).h : 0 };
  const free = B.h - tt.h - xt.h - 2 * 60 * u;
  const size = Math.min(iconos.length > 1 ? B.w / iconos.length * 0.72 : 480 * u, free);
  const ic = { h: iconos.length ? size : 0 };
  placeStack(M, B, [tt, ic, xt], 60 * u, e.posicion ?? 'centro');
  let t = S.t0;
  if (e.titulo) { const T = M.text(S, S.g, e.titulo, { ...tOpts, y: tt.y }); t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); }
  const n = iconos.length;
  iconos.forEach((name, i) => {
    const cx = B.x + B.w * ((i + 0.5) / n), cy = ic.y + size / 2;
    const I = M.icon(S, S.g, name, cx, cy, size * (n > 1 ? 0.9 : 1));
    t = M.style.mano ? M.drawIcon(S, I, t + 0.05, n > 1 ? 0.7 : 1.1) : M.popIcon(S, I, t + 0.05);
    if (i < n - 1 && e.flechas !== false && n > 1) {
      const ar = M.arrow(S, S.g, cx + size * 0.47, cy, cx + B.w / n - size * 0.47, cy, { cabeza: 22, curva: -0.15 });
      t = M.drawArrow(S, ar, t, 0.3);
    }
  });
  if (e.texto) { const X = M.text(S, S.g, e.texto, { ...xOpts, y: xt.y }); t = M.appear(S, X, t + 0.1, efX(M, e)); t = M.mark(S, X, t); }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + words(e.texto) };
}

async function flujo(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u, P = portrait(M);
  const pasos = e.pasos || [];
  const tOpts = { x: B.x, w: B.w, size: e.tamano ?? 110, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.22 };
  const tt = { h: e.titulo ? measureText(M, e.titulo, tOpts).h : 0 };
  let t = S.t0, y0 = B.y;
  if (e.titulo) { const T = M.text(S, S.g, e.titulo, { ...tOpts, y: B.y }); t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); y0 = B.y + tt.h + 60 * u; }
  const n = pasos.length, H = B.y + B.h - y0;
  pasos.forEach((p, i) => {
    let cx, cy, size, lab;
    if (P) {
      const rowH = H / n; size = Math.min(rowH * 0.62, 220 * u);
      cx = B.x + size / 2 + 20 * u; cy = y0 + rowH * i + rowH * 0.42;
      lab = { x: cx + size / 2 + 40 * u, w: B.x + B.w - (cx + size / 2 + 40 * u), y: cy - rowH * 0.3, h: rowH * 0.6, align: 'left', valign: 'middle' };
    } else {
      const colW = B.w / n; size = Math.min(colW * 0.5, H * 0.45);
      cx = B.x + colW * (i + 0.5); cy = y0 + size / 2 + 10 * u;
      lab = { x: cx - colW * 0.45, w: colW * 0.9, y: cy + size / 2 + 30 * u, h: H - size - 50 * u, align: 'center' };
    }
    const I = M.icon(S, S.g, p.icono || 'check', cx, cy, size);
    t = M.style.mano ? M.drawIcon(S, I, t + 0.05, 0.6) : M.popIcon(S, I, t + 0.05);
    if (p.texto) {
      const X = M.text(S, S.g, p.texto, { ...lab, size: p.tamano ?? e.tamanoTexto ?? 64, font: 'texto', maxLines: 3, resalta: p.resalta });
      t = M.appear(S, X, t, efX(M, e));
    }
    if (i < n - 1) {
      const ar = P ? M.arrow(S, S.g, cx, cy + size / 2 + 12 * u, cx, cy + H / n - size / 2 - 12 * u, { cabeza: 24 })
        : M.arrow(S, S.g, cx + size / 2 + 20 * u, cy, cx + B.w / n - size / 2 - 20 * u, cy, { cabeza: 26, curva: -0.12 });
      t = M.drawArrow(S, ar, t + 0.05, 0.35);
    }
  });
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + pasos.reduce((a, p) => a + words(p.texto), 0) };
}

async function lista(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const items = e.items || [];
  const tOpts = { x: B.x, w: B.w, size: e.tamano ?? 110, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.24 };
  let t = S.t0, y = B.y;
  if (e.titulo) {
    const T = M.text(S, S.g, e.titulo, { ...tOpts, y: B.y, align: e.alinear ?? 'center' });
    t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t);
    y = T.bottom + 60 * u;
  }
  const bul = e.marcador ?? 'numeros';
  const avail = B.y + B.h - y;
  let size = e.tamanoItems ?? 84, heights;
  const bw = size * 1.25 * u;
  const opt = sz => ({ x: B.x + bw + 30 * u, w: B.w - bw - 30 * u, size: sz, font: 'texto', maxLines: 3, align: 'left' });
  for (let k = 0; k < 20; k++) {
    heights = items.map(it => measureText(M, it.texto ?? it, opt(size)).h);
    const gap = 44 * u, total = heights.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    if (total <= avail) { y += (avail - total) * (e.centrar === false ? 0 : 0.4); break; }
    size *= 0.93;
  }
  const gap = 44 * u;
  items.forEach((it, i) => {
    const text = it.texto ?? it;
    let chk = null;
    const X = M.text(S, S.g, text, { ...opt(size), y, resalta: it.resalta });
    const bx = B.x + bw / 2, by = y + X.lh * 0.5, br = Math.min(bw, X.lh) * 0.42;
    const col = it.color ? M.color(S, it.color) : S.col.acento;
    if (bul === 'numeros') {
      const g = el('g', {}, S.g);
      const c = el('path', { d: M.style.mano ? wobblyEllipse(bx, by, br, br, 9 + i, 1.05) : `M${bx - br},${by} a${br},${br} 0 1,0 ${2 * br},0 a${br},${br} 0 1,0 ${-2 * br},0`, fill: M.style.mano ? 'none' : col, stroke: col, 'stroke-width': 6 * u }, g);
      const n = el('text', { x: bx, y: by + br * 0.42, 'text-anchor': 'middle', 'font-family': `"${M.style.num.familia}"`, 'font-weight': M.style.num.peso, 'font-size': br * 1.25, fill: M.style.mano ? col : '#FFFFFF' }, g);
      n.textContent = it.numero ?? i + 1;
      if (M.style.mano) { t = M.draw(S, c, t, 0.3); const a = M.anim(n, { pivot: [bx, by], s: 0 }); M.to(a, { s: 1, duration: 0.3, ease: 'back.out(2.5)' }, t - 0.1); }
      else { const a = M.anim(g, { pivot: [bx, by], s: 0 }); M.to(a, { s: 1, duration: 0.35, ease: 'back.out(2.5)' }, t); M.sfx('pop', t, { vol: 0.5 }); t += 0.15; }
    } else if (bul === 'check' || bul === 'cruz') {
      const box = el('path', { d: M.style.mano ? handRect(bx - br, by - br, br * 2, br * 2, 4 + i) : roundRect(bx - br, by - br, br * 2, br * 2, br * 0.3), fill: 'none', stroke: S.col.tinta, 'stroke-width': 5 * u }, S.g);
      t = M.style.mano ? M.draw(S, box, t, 0.3) : (M.popIcon(S, { g: box, fills: [], cx: bx, cy: by }, t), t + 0.15);
      chk = { bx, by, br };
    } else {
      const d = el('circle', { cx: bx, cy: by, r: br * 0.35, fill: col }, S.g);
      M.popIcon(S, { g: d, fills: [], cx: bx, cy: by }, t, { sonido: false }); t += 0.1;
    }
    t = M.appear(S, X, t, efX(M, e));
    t = M.mark(S, X, t);
    if (chk) {
      const { bx: cx, by: cy, br: r } = chk;
      const ok = bul === 'check' && it.ok !== false;
      const d = ok ? `M${cx - r * 0.7},${cy} L${cx - r * 0.1},${cy + r * 0.6} L${cx + r * 1.1},${cy - r * 1.1}` : `M${cx - r * 0.7},${cy - r * 0.7} L${cx + r * 0.7},${cy + r * 0.7} M${cx + r * 0.7},${cy - r * 0.7} L${cx - r * 0.7},${cy + r * 0.7}`;
      const p = M.path(S.g, d, { color: ok ? S.col.bueno : S.col.malo, w: 9 * u });
      t = M.draw(S, p, t, 0.3, { herramienta: null });
      M.sfx(ok ? 'ding' : 'error', t - 0.1, { vol: 0.5 });
    }
    if (it.tachar) {
      X.lines.forEach(l => { const p = M.path(S.g, handLine(l.x0 - 10 * u, l.base - X.size * 0.3, l.x0 + l.w + 10 * u, l.base - X.size * 0.36, 5 + i), { color: S.col.malo, w: 8 * u }); t = M.draw(S, p, t, 0.3); });
    }
    y = X.bottom + gap;
    t += e.ritmo ?? 0.15;
  });
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + items.reduce((a, it) => a + words(it.texto ?? it), 0) * 0.6 };
}

function fmtNum(M, v, dec, sep) {
  return new Intl.NumberFormat(M.clip.idioma ?? 'es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: sep !== false }).format(v);
}

async function cifra(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const dec = e.decimales ?? (String(e.valor).includes('.') ? String(e.valor).split('.')[1].length : 0);
  const final = `${e.prefijo ?? ''}${fmtNum(M, e.valor, dec, e.separador)}${e.sufijo ?? ''}`;
  const nf = M.style.num;
  const tOpts = { x: B.x, w: B.w, size: 90, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.2 };
  const lOpts = { x: B.x + B.w * 0.05, w: B.w * 0.9, size: e.tamanoEtiqueta ?? 64, font: 'texto', maxLines: 3, resalta: e.resaltaEtiqueta };
  const tt = { h: e.titulo ? measureText(M, e.titulo, tOpts).h : 0 };
  const lt = { h: e.etiqueta ? measureText(M, e.etiqueta, lOpts).h : 0 };
  // con anillo: el número se ajusta para caber dentro del círculo
  const ring = e.anillo ? Math.min(B.w * 0.85, (B.h - tt.h - lt.h - 120 * u) * 0.95, 700 * u) : 0;
  const nOpts = e.anillo
    ? { x: B.x, w: ring * 0.64, size: Math.min(e.tamano ?? 300, (ring * 0.4) / u / (nf.escala ?? 1)), font: 'num', maxLines: 1 }
    : { x: B.x, w: B.w * 0.96, size: e.tamano ?? 300, font: 'num', maxLines: 1 };
  const nm = measureText(M, final, nOpts);
  const nn = { h: e.anillo ? ring : nm.size * 1.0 };
  placeStack(M, B, [tt, nn, lt], 56 * u, e.posicion);
  let t = S.t0;
  if (e.titulo) { const T = M.text(S, S.g, e.titulo, { ...tOpts, y: tt.y }); t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); }
  const cx = B.x + B.w / 2, cy = nn.y + nn.h / 2;
  const color = e.color ? M.color(S, e.color) : S.col.acento;
  const g = el('g', {}, S.g);
  const te = el('text', { x: cx, y: cy + nm.size * 0.34, 'text-anchor': 'middle', 'font-family': `"${nf.familia}"`, 'font-weight': nf.peso, 'font-size': nm.size, fill: color, style: 'font-variant-numeric: tabular-nums' }, g);
  const p = { v: e.desde ?? 0 };
  const dur = e.duracionConteo ?? 1.4;
  let last = null;
  M.every(() => { const s = `${e.prefijo ?? ''}${fmtNum(M, p.v, dec, e.separador)}${e.sufijo ?? ''}`; if (s !== last) { te.textContent = s; last = s; } });
  const a = M.anim(g, { pivot: [cx, cy], s: 0.6, o: 0 });
  M.to(a, { s: 1, o: 1, duration: 0.35, ease: 'back.out(2)' }, t);
  M.to(p, { v: e.valor, duration: dur, ease: 'power2.out' }, t + 0.1);
  M.sfx('conteo', t + 0.1, { dur: dur * 0.8, vol: 0.5 });
  if (e.anillo) {
    const r = ring / 2 - 14 * u, frac = clamp(typeof e.anillo === 'number' ? e.anillo : e.valor / 100, 0, 1);
    el('circle', { cx, cy, r, fill: 'none', stroke: mix(S.col.suave, S.bg.color || '#ffffff', 0.55), 'stroke-width': 22 * u }, g);
    const arc = el('path', { d: `M${cx},${cy - r} A${r},${r} 0 ${frac > 0.5 ? 1 : 0},1 ${cx + Math.sin(frac * 2 * Math.PI) * r},${cy - Math.cos(frac * 2 * Math.PI) * r}`, fill: 'none', stroke: color, 'stroke-width': 22 * u, 'stroke-linecap': 'round' }, g);
    if (frac >= 0.999) arc.setAttribute('d', `M${cx},${cy - r} a${r},${r} 0 1,1 -0.01,0`);
    M.draw(S, arc, t + 0.1, dur, { herramienta: null, ease: 'power2.out' });
  }
  t += 0.1 + dur;
  M.to(a, { s: 1.08, duration: 0.12, ease: 'power2.out' }, t); M.to(a, { s: 1, duration: 0.3, ease: 'back.out(3)' }, t + 0.12);
  M.sfx('ding', t, { vol: 0.6 });
  if (e.etiqueta) { const L = M.text(S, S.g, e.etiqueta, { ...lOpts, y: lt.y }); t = M.appear(S, L, t + 0.1, efX(M, e)); t = M.mark(S, L, t); }
  if (e.fuente) fuente(M, S, e.fuente, t);
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + words(e.etiqueta) + 2 };
}

function fuente(M, S, text, t) {
  const B = S.caja, u = M.u;
  const F = M.text(S, S.plain, `Fuente: ${text}`, { x: B.x, y: B.y + B.h + 30 * M.u, w: B.w, size: 30, font: 'texto', maxLines: 2, color: S.col.suave });
  const a = M.anim(F.g, { o: 0 }); M.to(a, { o: 0.9, duration: 0.4 }, t);
  void u;
}

async function barras(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const datos = e.datos || [];
  let t = S.t0, y = B.y;
  if (e.titulo) {
    const T = M.text(S, S.g, e.titulo, { x: B.x, y, w: B.w, size: e.tamano ?? 100, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.24 });
    t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); y = T.bottom + 60 * u;
  }
  const max = e.maximo ?? Math.max(...datos.map(d => d.valor));
  const avail = B.y + B.h - y - (e.fuente ? 20 * u : 0);
  const rowH = Math.min(avail / datos.length, 210 * u);
  const labSize = clamp(rowH / u * 0.26, 34, 54), barH = rowH * 0.36;
  const valW = 200 * u;
  const hlIdx = datos.findIndex(d => d.resaltar);
  datos.forEach((d, i) => {
    const ry = y + i * rowH;
    const L = M.text(S, S.g, d.etiqueta, { x: B.x, y: ry, w: B.w - valW, size: labSize, font: 'texto', maxLines: 1, align: 'left' });
    const by = ry + L.lh + 8 * u, bw = Math.max(8 * u, (B.w - valW - 10 * u) * (d.valor / max));
    const isHl = i === hlIdx || (hlIdx < 0 && d.valor === max && e.resaltarMayor !== false);
    const c = d.color ? M.color(S, d.color) : isHl ? S.col.acento : (M.style.mano ? S.col.acento2 : mix(S.col.acento2, S.bg.color || '#FFFFFF', 0.15));
    const bar = el('path', { d: M.style.mano ? handRect(B.x, by, bw, barH, 3 + i) : roundRect(B.x, by, bw, barH, barH * 0.3), fill: M.style.relleno === 'trama' ? hatch(M.defs, c, M.u) : c, stroke: M.style.mano ? S.col.tinta : 'none', 'stroke-width': 5 * u, 'stroke-linejoin': 'round' }, S.g);
    const a = M.anim(bar, { pivot: [B.x, by], sx: 0 });
    const at = t + i * 0.22;
    M.appear(S, L, at, 'fundido');
    M.to(a, { sx: 1, duration: 0.8, ease: 'power3.out' }, at + 0.1);
    const vt = el('text', { x: B.x + bw + 18 * u, y: by + barH * 0.78, 'font-family': `"${M.style.num.familia}"`, 'font-weight': M.style.num.peso, 'font-size': barH * 1.1 * (M.style.num.escala ?? 1), fill: isHl ? S.col.acento : S.col.tinta, opacity: 0 }, S.g);
    const p = { v: 0, o: 0 };
    const dec = d.decimales ?? e.decimales ?? 0;
    M.every(() => { vt.textContent = `${e.prefijo ?? ''}${fmtNum(M, p.v, dec)}${d.sufijo ?? e.sufijo ?? ''}`; vt.setAttribute('opacity', p.o); vt.setAttribute('x', (B.x + bw * a.sx + 18 * u).toFixed(1)); });
    M.to(p, { v: d.valor, o: 1, duration: 0.8, ease: 'power3.out' }, at + 0.1);
    M.sfx('whoosh', at + 0.1, { vol: 0.35, dur: 0.4, tono: 1.4 + i * 0.1 });
  });
  t += datos.length * 0.22 + 0.9;
  if (e.fuente) fuente(M, S, e.fuente, t);
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + datos.length * 2 };
}

async function comparacion(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u, P = portrait(M);
  let t = S.t0, y = B.y;
  if (e.titulo) {
    const T = M.text(S, S.g, e.titulo, { x: B.x, y, w: B.w, size: e.tamano ?? 100, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.22 });
    t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); y = T.bottom + 50 * u;
  }
  const sides = [
    { ...(e.izquierda || e.antes || {}), tono: (e.izquierda || e.antes || {}).tono ?? 'malo' },
    { ...(e.derecha || e.despues || {}), tono: (e.derecha || e.despues || {}).tono ?? 'bueno' },
  ];
  // vertical (9:16): tarjetas apiladas a lo ancho · horizontal: lado a lado
  const avail = B.y + B.h - y, vsGap = P ? 130 * u : 70 * u;
  const cw = P ? B.w : (B.w - vsGap) / 2;
  let isz = e.tamanoItems ?? (P ? 62 : 54), hsz = e.tamanoCabecera ?? (P ? 86 : 80), heights;
  const colH = sd => {
    const icS = isz * 1.1 * u;
    let h = 28 * u + measureText(M, sd.titulo || ' ', { w: cw - 48 * u, size: hsz, font: 'titulo', maxLines: 2 }).h + 26 * u;
    for (const it of sd.items || []) h += measureText(M, it, { w: cw - 76 * u - icS, size: isz, font: 'texto', maxLines: 3 }).h + 22 * u;
    return h + 26 * u;
  };
  for (let k = 0; k < 25; k++) {
    heights = sides.map(colH);
    const need = P ? heights[0] + heights[1] + vsGap : Math.max(...heights);
    if (need <= avail) break;
    isz *= 0.94; hsz *= 0.94;
  }
  const icS = isz * 1.1 * u;
  const need = P ? heights[0] + heights[1] + vsGap : Math.max(...heights);
  const y0 = y + Math.max(0, avail - need) * 0.35;
  const rects = P
    ? [{ x: B.x, y: y0, w: cw, h: heights[0] }, { x: B.x, y: y0 + heights[0] + vsGap, w: cw, h: heights[1] }]
    : [{ x: B.x, y: y0, w: cw, h: need }, { x: B.x + cw + vsGap, y: y0, w: cw, h: need }];
  let tVs = 0; const tCards = t;
  sides.forEach((sd, k) => {
    const R = rects[k];
    if (k === 1) tVs = t;
    const col = sd.tono === 'malo' ? S.col.malo : sd.tono === 'bueno' ? S.col.bueno : S.col.acento2;
    const card = el('g', {}, S.g);
    const bgc = mix(col, S.bg.color || '#FFFFFF', 0.86);
    el('path', { d: M.style.mano ? handRect(R.x, R.y, R.w, R.h, 8 + k) : roundRect(R.x, R.y, R.w, R.h, 28 * u), fill: bgc, stroke: M.style.mano ? S.col.tinta : col, 'stroke-width': (M.style.mano ? 5 : 4) * u }, card);
    const a = M.anim(card, { pivot: [R.x + R.w / 2, R.y + R.h / 2], o: 0, y: 40 * u });
    M.to(a, { o: 1, y: 0, duration: 0.4 }, tCards + k * 0.12);
    const at = Math.max(t, tCards + 0.35) + 0.05;
    const txtCol = contrast(S.col.tinta, bgc) > 3 ? S.col.tinta : '#141414';
    const H1 = M.text(S, S.g, sd.titulo || '', { x: R.x + 24 * u, y: R.y + 28 * u, w: R.w - 48 * u, size: hsz, font: 'titulo', maxLines: 2, color: col, align: P ? 'left' : 'center' });
    let tt = M.appear(S, H1, at + 0.15, efT(M, e) === 'golpe' ? 'palabras' : efT(M, e));
    let iy = H1.bottom + 26 * u;
    (sd.items || []).forEach(it => {
      const X = M.text(S, S.g, it, { x: R.x + 30 * u + icS + 16 * u, y: iy, w: R.w - 76 * u - icS, size: isz, font: 'texto', maxLines: 3, align: 'left', color: txtCol });
      const I = M.icon(S, S.g, sd.tono === 'malo' ? 'cruz' : sd.tono === 'bueno' ? 'check' : 'flecha', R.x + 30 * u + icS / 2, iy + X.lh * 0.5, icS, { color: col, trazo: 9 });
      tt = M.drawIcon(S, I, tt + 0.05, 0.25, { herramienta: null, sonido: false });
      M.sfx(sd.tono === 'malo' ? 'error' : 'ding', tt - 0.1, { vol: 0.4 });
      tt = M.appear(S, X, tt, efX(M, e) === 'escribir' ? 'escribir' : 'fundido');
      iy = X.bottom + 22 * u;
    });
    t = Math.max(t, tt) + 0.1;
  });
  if (e.vs !== false) {
    const cx = P ? B.x + B.w / 2 : B.x + cw + vsGap / 2, cy = P ? rects[0].y + rects[0].h + vsGap / 2 : y0 + need / 2, r = 58 * u;
    const g = el('g', {}, S.g);
    el('circle', { cx, cy, r, fill: S.col.tinta }, g);
    const tv = el('text', { x: cx, y: cy + r * 0.33, 'text-anchor': 'middle', 'font-family': `"${M.style.titulo.familia}"`, 'font-weight': M.style.titulo.peso, 'font-size': r * 0.95 * (M.style.titulo.escala ?? 1), fill: S.bg.color && contrast(S.bg.color, S.col.tinta) > 3 ? S.bg.color : '#FFFFFF' }, g);
    tv.textContent = e.vs ?? 'VS';
    const a = M.anim(g, { pivot: [cx, cy], s: 0, r: -30 });
    const tv0 = Math.max(S.t0 + 0.6, tVs);
    M.to(a, { s: 1, r: 0, duration: 0.45, ease: 'back.out(3)' }, tv0);
    M.sfx('golpe', tv0, { vol: 0.5 });
  }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + sides.reduce((a, s) => a + (s.items || []).reduce((b, i) => b + words(i), 0), 0) * 0.6 };
}

async function cita(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const qSize = 260 * u;
  const tOpts = { x: B.x + 20 * u, w: B.w - 40 * u, size: e.tamano ?? 76, font: 'texto', maxLines: 7, resalta: e.resalta, align: 'left', h: B.h * 0.6 };
  const tt = { h: measureText(M, e.texto, tOpts).h };
  const qq = { h: qSize * 0.55 }, aa = { h: e.autor ? 70 * u : 0 };
  placeStack(M, B, [qq, tt, aa], 30 * u, e.posicion);
  let t = S.t0;
  const q = el('text', { x: B.x, y: qq.y + qSize * 0.72, 'font-family': '"Poppins", Georgia, serif', 'font-weight': 800, 'font-size': qSize, fill: S.col.acento }, S.g);
  q.textContent = '“';
  const qa = M.anim(q, { pivot: [B.x + qSize * 0.2, qq.y + qSize * 0.3], s: 0, r: -20 });
  M.to(qa, { s: 1, r: 0, duration: 0.45, ease: 'back.out(2.5)' }, t); M.sfx('pop', t);
  const T = M.text(S, S.g, e.texto, { ...tOpts, y: tt.y });
  t = M.appear(S, T, t + 0.3, e.efecto ?? (M.style.mano ? 'escribir' : 'teclear'));
  t = M.mark(S, T, t);
  if (e.autor) {
    const A = M.text(S, S.g, `— ${e.autor}`, { x: B.x, y: aa.y, w: B.w - 20 * u, size: 50, font: 'titulo', maxLines: 1, align: 'right', color: S.col.suave });
    t = M.appear(S, A, t + 0.15, 'fundido');
  }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.texto) + words(e.autor) };
}

async function imagen(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const img = await M.image(e.src);
  let t = S.t0, y = B.y;
  if (e.titulo) {
    const T = M.text(S, S.g, e.titulo, { x: B.x, y, w: B.w, size: e.tamano ?? 96, font: 'titulo', maxLines: 2, resalta: e.resalta, h: B.h * 0.22 });
    t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t); y = T.bottom + 40 * u;
  }
  const pieH = e.pie ? measureText(M, e.pie, { w: B.w, size: 52, font: 'texto', maxLines: 2 }).h + 30 * u : 0;
  const availH = B.y + B.h - y - pieH, availW = B.w;
  const marco = e.marco ?? 'tarjeta';
  const pad = marco === 'telefono' ? 22 * u : marco === 'navegador' ? 0 : 0;
  const top = marco === 'navegador' ? 56 * u : 0;
  const ar = img.w / img.h;
  let iw = availW - pad * 2, ih = iw / ar;
  if (ih + top + pad * 2 > availH) { ih = availH - top - pad * 2; iw = ih * ar; }
  const fw = iw + pad * 2, fh = ih + pad * 2 + top;
  const fx = B.x + (B.w - fw) / 2, fy = y + (availH - fh) / 2;
  const g = el('g', {}, S.plain);
  const ix = fx + pad, iy = fy + pad + top, rad = marco === 'telefono' ? 40 * u : 22 * u;
  if (marco === 'telefono') el('path', { d: roundRect(fx, fy, fw, fh, 64 * u), fill: '#16161A', filter: 'url(#av-sombra)' }, g);
  if (marco === 'navegador') {
    el('path', { d: roundRect(fx, fy, fw, fh, 22 * u), fill: '#FFFFFF', stroke: '#D6D6DC', 'stroke-width': 2 * u, filter: 'url(#av-sombra)' }, g);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => el('circle', { cx: fx + 30 * u + i * 26 * u, cy: fy + top / 2, r: 8 * u, fill: c }, g));
    el('path', { d: roundRect(fx + 120 * u, fy + 13 * u, fw - 150 * u, top - 26 * u, 15 * u), fill: '#F0F0F4' }, g);
  }
  if (marco === 'tarjeta') el('path', { d: roundRect(fx - 12 * u, fy - 12 * u, fw + 24 * u, fh + 24 * u, 30 * u), fill: '#FFFFFF', filter: 'url(#av-sombra)' }, g);
  const cid = 'av-img' + S.i;
  const cp = el('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, M.defs);
  el('path', { d: marco === 'navegador' ? `M${ix},${iy} L${ix + iw},${iy} L${ix + iw},${iy + ih - rad} Q${ix + iw},${iy + ih} ${ix + iw - rad},${iy + ih} L${ix + rad},${iy + ih} Q${ix},${iy + ih} ${ix},${iy + ih - rad} Z` : roundRect(ix, iy, iw, ih, rad) }, cp);
  const ig = el('g', { 'clip-path': `url(#${cid})` }, g);
  const im = el('image', { href: img.url, x: ix, y: iy, width: iw, height: ih, preserveAspectRatio: 'xMidYMid slice' }, ig);
  if (e.zoom !== false) { const z = M.anim(im, { pivot: [ix + iw * (e.foco?.x ?? 0.5), iy + ih * (e.foco?.y ?? 0.5)] }); M.to(z, { s: typeof e.zoom === 'number' ? e.zoom : 1.1, duration: 6, ease: 'none' }, t); }
  const a = M.anim(g, { pivot: [fx + fw / 2, fy + fh / 2], o: 0, y: 80 * u, s: 0.96 });
  M.to(a, { o: 1, y: 0, s: 1, duration: 0.55, ease: 'power3.out' }, t);
  M.sfx('whoosh', t, { vol: 0.5 });
  t += 0.6;
  (e.senalar || []).forEach((p, i) => {
    const px = ix + iw * p.x, py = iy + ih * p.y, rr = (p.radio ?? 0.08) * iw;
    const c = M.path(S.g, wobblyEllipse(px, py, rr * 1.25, rr, 12 + i), { color: S.col.acento, w: 8 * u });
    t = M.draw(S, c, t + 0.1, 0.45);
    if (p.texto) {
      const lx = clamp(px + (p.x > 0.5 ? -1 : 1) * iw * 0.35, B.x + 150 * u, B.x + B.w - 150 * u);
      const ly = p.y > 0.5 ? py - rr - 190 * u : py + rr + 150 * u;
      const L = M.text(S, S.g, p.texto, { x: lx - 220 * u, y: ly - 40 * u, w: 440 * u, size: 58, font: 'titulo', maxLines: 2, color: S.col.acento });
      const lab = el('path', { d: roundRect(L.left - 22 * u, L.top - 10 * u, L.right - L.left + 44 * u, L.height + 20 * u, 18 * u), fill: '#FFFFFF', opacity: 0.94 }, L.bgL);
      void lab;
      const ar2 = M.arrow(S, S.g, lx, p.y > 0.5 ? L.bottom + 14 * u : L.top - 14 * u, px + (lx - px) * 0.18, py + (p.y > 0.5 ? -rr : rr) * 1.05, { color: S.col.acento, cabeza: 26, curva: 0.18 });
      t = M.appear(S, L, t, 'palabras');
      t = M.drawArrow(S, ar2, t, 0.35);
    }
  });
  if (e.pie) { const P = M.text(S, S.g, e.pie, { x: B.x, y: B.y + B.h - pieH + 20 * u, w: B.w, size: 52, font: 'texto', maxLines: 2 }); t = M.appear(S, P, t + 0.1, efX(M, e)); }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.titulo) + words(e.pie) + 3 };
}

async function rotulo(M, S, e) {
  const u = M.u, P = portrait(M);
  const pos = e.posicion ?? 'izquierda';
  const ns = e.tamano ?? 62, cs = ns * 0.62;
  const nm = measureText(M, e.nombre, { size: ns, font: 'titulo', maxLines: 1, w: M.W * 0.8 });
  const cm = e.cargo ? measureText(M, e.cargo, { size: cs, font: 'texto', maxLines: 1, w: M.W * 0.8 }) : { w: 0, h: 0 };
  const padX = 36 * u, padY = 22 * u, bar = 14 * u;
  const w = Math.max(nm.w, cm.w) + padX * 2 + bar, h = nm.h + cm.h + padY * 2 + (e.cargo ? 6 * u : 0);
  const baseY = e.y != null ? e.y * M.H : (P ? M.H * 0.7 : M.H * 0.76);
  const x = pos === 'centro' ? (M.W - w) / 2 : pos === 'derecha' ? M.W - S.caja.x - w + 20 * u : (P ? 70 * u : 110 * u);
  const panel = e.panel ?? M.style.papel;
  const ink = contrast(M.style.tinta, panel) > 4 ? M.style.tinta : (contrast('#FFFFFF', panel) > 4 ? '#FFFFFF' : '#141414');
  const g = el('g', {}, S.g);
  const card = el('g', {}, g);
  el('path', { d: M.style.mano ? handRect(x, baseY, w, h, 3) : roundRect(x, baseY, w, h, 16 * u), fill: panel, stroke: M.style.mano ? ink : 'none', 'stroke-width': 4 * u, filter: M.style.mano ? null : 'url(#av-sombra)' }, card);
  el('path', { d: roundRect(x, baseY, bar, h, M.style.mano ? 2 : 7 * u), fill: M.style.acento }, card);
  const ca = M.anim(card, { pivot: [x, baseY + h / 2], sx: 0 });
  let t = S.t0;
  M.to(ca, { sx: 1, duration: 0.45, ease: 'power3.out' }, t);
  M.sfx('whoosh', t, { vol: 0.5, dur: 0.4 });
  const N = M.text(S, g, e.nombre, { x: x + bar + padX, y: baseY + padY, w: w - bar - padX * 2, size: ns, font: 'titulo', maxLines: 1, align: 'left', color: ink, resalta: e.resalta });
  const tn = M.appear(S, N, t + 0.25, M.style.mano ? 'escribir' : 'deslizar', { herramienta: M.style.mano ? S.herramienta : null });
  let tc = tn;
  if (e.cargo) { const C = M.text(S, g, e.cargo, { x: x + bar + padX, y: N.bottom + 6 * u, w: w - bar - padX * 2, size: cs, font: 'texto', maxLines: 1, align: 'left', color: mix(ink, panel, 0.3) }); tc = M.appear(S, C, t + 0.45, 'deslizar'); }
  const stay = e.permanencia ?? 3;
  const out = Math.max(tn, tc) + stay;
  const ga = M.anim(g, { pivot: [x, baseY + h / 2] });
  M.to(ga, { x: -(x + w + 40 * u), duration: 0.45, ease: 'power3.in' }, out);
  M.sfx('whoosh', out, { vol: 0.4, dur: 0.4 });
  return { fin: out + 0.5, pausa: 0.05, camara: false, lleno: out - 0.2 };
}

// ------- subtítulos animados (SRT, líneas o palabras con tiempos) -------
function parseSRT(txt) {
  const tm = s => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0; };
  return txt.replace(/\r/g, '').split(/\n\n+/).map(b => {
    const lines = b.split('\n').filter(Boolean);
    const i = lines.findIndex(l => l.includes('-->'));
    if (i < 0) return null;
    const [a, z] = lines[i].split('-->');
    return { desde: tm(a), hasta: tm(z), texto: lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '') };
  }).filter(Boolean);
}

async function subtitulos(M, S, e) {
  const u = M.u, P = portrait(M);
  let cues = e.lineas ? [...e.lineas] : [];
  if (e.srt) cues = parseSRT(await (await fetch(e.srt)).text());
  let wordsT = null;
  if (e.palabras) { // [{t, fin, texto}] → agrupa en frases de ≤ maxPalabras
    const mx = e.maxPalabras ?? (P ? 4 : 7); cues = []; wordsT = [];
    for (let i = 0; i < e.palabras.length; i += mx) {
      const ws = e.palabras.slice(i, i + mx);
      cues.push({ desde: ws[0].t, hasta: ws[ws.length - 1].fin, texto: ws.map(w => w.texto).join(' ') });
      wordsT.push(ws);
    }
  }
  const fontSpec = e.fuente ?? (M.clip.marca?.fuenteTitulo ? 'titulo' : { familia: 'Poppins', peso: 800, escala: 1 });
  const size = e.tamano ?? (P ? 78 : 64);
  const modo = e.modo ?? 'karaoke';
  const box = { x: S.caja.x, w: S.caja.w };
  const cy = e.posicion === 'centro' ? M.H * 0.5 : e.posicion === 'arriba' ? M.H * 0.22 : (P ? M.H * 0.68 : M.H * 0.8);
  const hl = e.colorResalta ? M.color(S, e.colorResalta) : M.style.amarillo;
  const fill = e.color ?? '#FFFFFF', stroke = e.contorno ?? '#111111';
  const base = S.start;
  cues.forEach((c, ci) => {
    const g = el('g', { style: 'display:none' }, S.plain);
    const mTxt = measureText(M, c.texto, { size, font: fontSpec, w: box.w, maxLines: 2, mayus: e.mayusculas ?? true, espacio: 1.6 });
    const T = M.text(S, g, c.texto, { x: box.x, y: cy - mTxt.h / 2, w: box.w, size, font: fontSpec, maxLines: 2, mayus: e.mayusculas ?? true, color: fill, espacio: 1.6 });
    T.words.forEach(w => { w.te.setAttribute('stroke', stroke); w.te.setAttribute('stroke-width', size * u * 0.16); w.te.setAttribute('paint-order', 'stroke'); w.te.setAttribute('stroke-linejoin', 'round'); });
    const a0 = base + c.desde, a1 = base + c.hasta;
    let times;
    if (wordsT) times = wordsT[ci].map(w => [base + w.t, base + w.fin]);
    else {
      const lens = T.words.map(w => w.t.length + 2), tot = lens.reduce((a, b) => a + b, 0);
      let acc = a0; times = lens.map(l => { const s = acc; acc += (a1 - a0) * l / tot; return [s, acc]; });
    }
    let lastState = '';
    M.every(Tm => {
      const vis = Tm >= a0 && Tm < a1 + (ci === cues.length - 1 ? 0.25 : 0);
      g.style.display = vis ? '' : 'none';
      if (!vis) return;
      const k = clamp((Tm - a0) / 0.12, 0, 1);
      g.setAttribute('transform', `translate(${M.W / 2},${cy}) scale(${(0.9 + 0.1 * k).toFixed(3)}) translate(${-M.W / 2},${-cy})`);
      let st = '';
      T.words.forEach((w, i) => {
        const [s0, s1] = times[i];
        const active = Tm >= s0 && Tm < s1, said = Tm >= s0;
        let sc = 1, op = 1, col = fill;
        if (modo === 'karaoke') { if (active) { sc = 1.07; col = hl; } }
        else if (modo === 'pop') { if (!said) op = 0; else { const q = clamp((Tm - s0) / 0.14, 0, 1); sc = 0.6 + 0.4 * (1 - Math.pow(1 - q, 3)) + Math.sin(q * Math.PI) * 0.12; } if (active) col = hl; }
        st += `${sc.toFixed(3)}${op}${col}|`;
        w._st = [sc, op, col];
      });
      if (st === lastState) return; lastState = st;
      T.words.forEach(w => {
        const [sc, op, col] = w._st, cx = w.x + w.w / 2, cyy = w.base - T.size * 0.35;
        w.g.setAttribute('transform', `translate(${cx},${cyy}) scale(${sc}) translate(${-cx},${-cyy})`);
        w.g.setAttribute('opacity', op); w.te.setAttribute('fill', col);
      });
    });
  });
  const endT = base + Math.max(...cues.map(c => c.hasta)) + 0.3;
  cues.forEach(c => { if (e.sonido) M.sfx('pop', base + c.desde, { vol: 0.25 }); });
  return { fin: endT, pausa: 0, camara: false, lleno: base + (cues[0].desde + cues[0].hasta) / 2 };
}

async function cta(M, S, e) {
  const mz = await setupMascot(M, S, e);
  const B = S.caja, u = M.u;
  const tOpts = { x: B.x, w: B.w, size: e.tamano ?? 130, font: 'titulo', maxLines: 3, resalta: e.resalta, h: B.h * 0.4 };
  const tt = { h: measureText(M, e.texto ?? '¿Te sirvió?', tOpts).h };
  const uu = { h: e.usuario ? 70 * u : 0 };
  const bh = 130 * u;
  const bb = { h: e.boton === false ? 0 : bh };
  const iconos = e.iconos ?? ['corazon', 'chat', 'compartir', 'guardar'];
  const ii = { h: iconos.length ? 130 * u : 0 };
  placeStack(M, B, [tt, uu, bb, ii], 50 * u, e.posicion);
  let t = S.t0;
  const T = M.text(S, S.g, e.texto ?? '¿Te sirvió?', { ...tOpts, y: tt.y });
  t = M.appear(S, T, t, efT(M, e)); t = M.mark(S, T, t);
  if (e.usuario) { const U = M.text(S, S.g, e.usuario, { x: B.x, y: uu.y, w: B.w, size: 56, font: 'texto', maxLines: 1, color: S.col.suave }); t = M.appear(S, U, t, 'fundido'); }
  if (e.boton !== false) {
    const label = e.boton ?? 'Seguir', done = e.botonHecho ?? 'Siguiendo ✓';
    const bw = Math.max(measureText(M, label, { size: 64, font: { familia: 'Poppins', peso: 800 } }).w, measureText(M, done, { size: 64, font: { familia: 'Poppins', peso: 800 } }).w) + 130 * u;
    const bx = B.x + (B.w - bw) / 2, by = bb.y, cx = bx + bw / 2, cy = by + bh / 2;
    const g = el('g', {}, S.plain);
    const ripple = el('circle', { cx, cy, r: 0, fill: 'none', stroke: S.col.acento, 'stroke-width': 10 * u, opacity: 0 }, g);
    const pill = el('path', { d: roundRect(bx, by, bw, bh, bh / 2), fill: S.col.acento, stroke: M.style.mano ? S.col.tinta : 'none', 'stroke-width': 5 * u }, g);
    const pill2 = el('path', { d: roundRect(bx, by, bw, bh, bh / 2), fill: S.col.bueno, opacity: 0 }, g);
    const tc = contrast('#FFFFFF', S.col.acento) > 2.4 ? '#FFFFFF' : '#111111';
    const t1 = el('text', { x: cx, y: cy + 22 * u, 'text-anchor': 'middle', 'font-family': '"Poppins"', 'font-weight': 800, 'font-size': 64 * u, fill: tc }, g); t1.textContent = label;
    const t2 = el('text', { x: cx, y: cy + 22 * u, 'text-anchor': 'middle', 'font-family': '"Poppins"', 'font-weight': 800, 'font-size': 64 * u, fill: '#FFFFFF', opacity: 0 }, g); t2.textContent = done;
    const a = M.anim(g, { pivot: [cx, cy], s: 0 });
    M.to(a, { s: 1, duration: 0.45, ease: 'back.out(2.2)' }, t); M.sfx('pop', t);
    // cursor que hace clic
    const cur = el('g', {}, S.plain);
    cur.insertAdjacentHTML('beforeend', `<g transform="scale(${1.5 * u})"><path d="M0,0 L0,52 L13,40 L23,62 L33,57 L23,36 L40,36 Z" fill="#FFFFFF" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/></g>`);
    const ca = M.anim(cur, { pivot: [0, 0], bx: cx + bw * 0.18, by: cy + 10 * u, x: 360 * u, y: 420 * u, o: 0 });
    const tClick = t + 0.9;
    M.to(ca, { o: 1, duration: 0.15 }, t + 0.3);
    M.to(ca, { x: 0, y: 0, duration: 0.55, ease: 'power3.out' }, t + 0.35);
    M.to(ca, { s: 0.82, duration: 0.08 }, tClick); M.to(ca, { s: 1, duration: 0.15 }, tClick + 0.08);
    M.to(a, { s: 0.92, duration: 0.08 }, tClick); M.to(a, { s: 1, duration: 0.35, ease: 'back.out(3)' }, tClick + 0.08);
    const rp = { r: 0, o: 0 };
    M.every(() => { ripple.setAttribute('r', rp.r); ripple.setAttribute('opacity', rp.o); });
    M.set(rp, { r: bh * 0.5, o: 0.9 }, tClick);
    M.to(rp, { r: bw * 0.75, o: 0, duration: 0.6, ease: 'power2.out' }, tClick);
    const sw = { o: 0 };
    M.every(() => { pill2.setAttribute('opacity', sw.o); t2.setAttribute('opacity', sw.o); t1.setAttribute('opacity', 1 - sw.o); });
    M.to(sw, { o: 1, duration: 0.2 }, tClick + 0.05);
    M.to(ca, { o: 0, x: 120 * u, y: 160 * u, duration: 0.4, ease: 'power2.in' }, tClick + 0.5);
    M.sfx('click', tClick); M.sfx('exito', tClick + 0.08, { vol: 0.6 });
    t = tClick + 0.4;
  }
  if (iconos.length) {
    const n = iconos.length, sz = Math.min(110 * u, B.w / n * 0.6), rowW = Math.min(B.w, n * 230 * u), rx = B.x + (B.w - rowW) / 2;
    iconos.forEach((name, i) => {
      const I = M.icon(S, S.g, name, rx + rowW * ((i + 0.5) / n), ii.y + ii.h / 2, sz);
      M.popIcon(S, I, t + i * 0.12, { sonido: i === 0 });
    });
    t += n * 0.12 + 0.4;
  }
  if (mz) t = Math.max(t, mz.run(S.t0, t));
  return { fin: t, palabras: words(e.texto) + 2 };
}

async function mascota(M, S, e) {
  const B = S.caja, u = M.u, P = portrait(M);
  const esc = e.escala ?? (P ? 1.5 : 1.2);
  const mh = 300 * u * esc;
  const x = B.x + B.w / 2, y = B.y + B.h - (P ? 40 * u : 0);
  const imagen = e.imagen ? await M.image(e.imagen) : null;
  const rig = M.mascot(S, S.g, x, y, { escala: esc, color: e.color ? M.color(S, e.color) : undefined, imagen, seed: S.i + 1 });
  let t = rig.entrar(S.t0);
  let fin = t;
  if (e.dice) {
    const bw = Math.min(B.w, 900 * u), bx = B.x + (B.w - bw) / 2;
    const avail = y - mh - B.y - 70 * u;
    const m = measureText(M, e.dice, { size: e.tamano ?? 76, font: 'titulo', w: bw - 90 * u, maxLines: 4, h: avail - 60 * u });
    const bh = m.h + 70 * u, by = y - mh - 60 * u - bh;
    const g = el('g', {}, S.g);
    M.bubble(S, g, bx, by, bw, bh, x - 40 * u, y - mh + 30 * u, { fill: '#FFFFFF', color: '#1E1B18' });
    const T = M.text(S, g, e.dice, { x: bx + 45 * u, y: by + 35 * u, w: bw - 90 * u, h: bh - 70 * u, size: e.tamano ?? 76, font: 'titulo', maxLines: 4, color: '#1E1B18', resalta: e.resalta, valign: 'middle' });
    const a = M.anim(g, { pivot: [x, y - mh], s: 0 });
    M.to(a, { s: 1, duration: 0.4, ease: 'back.out(2)' }, t - 0.15);
    M.sfx('pop', t - 0.15, { vol: 0.6 });
    const te = M.appear(S, T, t + 0.15, 'palabras');
    rig.hablar(t, te + 0.3);
    fin = Math.max(fin, M.mark(S, T, te));
  }
  const acc = e.accion ?? 'saludar';
  const end = acc === 'senalar' ? rig.senalar(t + 0.1, 1, 1.4, 125) : rig.accion(acc, t + 0.1);
  return { fin: Math.max(fin, end), palabras: words(e.dice) };
}

async function transicionSuelta(M, S, e) {
  const d = e.duracion ?? Math.max(0.8, TRANSITION_DUR[e.efecto ?? 'barrido'] ?? 0.8);
  transition(M, e.efecto ?? 'barrido', null, null, S.start, d, { color: e.color && M.color(S, e.color), color2: e.color2 && M.color(S, e.color2) });
  return { fin: S.start + d, pausa: 0, camara: false, lleno: S.start + d * 0.5 };
}

async function personalizada(M, S, e) {
  if (typeof e.construir !== 'function') throw new Error('La escena "personalizada" necesita construir: async (M, S, e) => tiempoFinal');
  const fin = await e.construir(M, S, e);
  return { fin: typeof fin === 'number' ? fin : S.t0 + 2, palabras: e.palabras ?? 4 };
}

export const COMPONENTS = { titulo, idea, flujo, lista, cifra, barras, comparacion, cita, imagen, rotulo, subtitulos, cta, mascota, transicion: transicionSuelta, personalizada };
