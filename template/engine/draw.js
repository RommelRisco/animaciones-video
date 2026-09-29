// animaciones-video · trazos, íconos, flechas, globos y herramientas (plumón, tiza, lápiz, cursor)
import { el, clamp, handLine, roundRect, smoothPath, rng } from './util.js';
import { ICONS } from './icons.js';
import { hatch, rgba } from './styles.js';

export function colorOf(M, S, c) {
  if (!c) return S.col.tinta;
  if (c.startsWith?.('#') || c.startsWith?.('rgb') || c.startsWith?.('url')) return c;
  return S.col[c] ?? M.style[c] ?? c;
}

// Dibuja un <path> con trazo animado; la herramienta de la escena sigue la punta.
export function draw(M, S, p, t, dur = 0.6, o = {}) {
  const len = p.getTotalLength();
  if (!len) return t;
  p.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${len.toFixed(2)}`);
  const prog = { v: 0 };
  let last = -1;
  M.every(() => {
    if (prog.v === last) return; last = prog.v;
    p.setAttribute('stroke-dashoffset', (len * (1 - prog.v)).toFixed(2));
    p.style.visibility = prog.v <= 0.002 ? 'hidden' : '';
  });
  M.to(prog, { v: 1, duration: dur, ease: o.ease ?? 'power1.inOut' }, t);
  const tool = o.herramienta !== undefined ? o.herramienta : S?.herramienta;
  if (tool) M.toolSeg(tool, t, t + dur, () => { const pt = p.getPointAtLength(len * prog.v); return [pt.x, pt.y, p]; });
  if (o.sonido !== false && tool) M.sfx(tool === 'tiza' ? 'tiza' : tool === 'lapiz' ? 'lapiz' : 'escritura', t, { dur, vol: 0.8 });
  return t + dur;
}

export function path(parent, d, o = {}) {
  return el('path', {
    d, fill: o.fill ?? 'none', stroke: o.color ?? 'none', 'stroke-width': o.w ?? 6,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.opacity,
  }, parent);
}

// Ícono doodle centrado en (cx, cy) de tamaño `size` (px)
export function icon(M, S, parent, name, cx, cy, size, o = {}) {
  const def = ICONS[name];
  if (!def) throw new Error(`Ícono desconocido "${name}". Disponibles: ${Object.keys(ICONS).join(', ')}`);
  const k = size / 100;
  const g = el('g', {}, parent);
  const inner = el('g', { transform: `translate(${(cx - 50 * k).toFixed(1)},${(cy - 50 * k).toFixed(1)}) scale(${k.toFixed(4)})` }, g);
  const sw = ((o.trazo ?? M.style.trazo) * M.u * clamp(size / (220 * M.u), 0.75, 1.7)) / k;
  const color = colorOf(M, S, o.color);
  const fills = (o.rellenar === false ? [] : def.rellenos || []).map(f => {
    const fc = colorOf(M, S, o.colorRelleno ?? f.c);
    const fill = M.style.relleno === 'trama' ? hatch(M.defs, fc, M.u / k) : fc;
    return el('path', { d: f.d, fill, opacity: 0, transform: M.style.mano ? 'translate(3,3)' : null }, inner);
  });
  const strokes = def.trazos.map(d => path(inner, d, { color, w: sw }));
  return { g, inner, strokes, fills, cx, cy, size, name };
}

export function drawIcon(M, S, ic, t, dur = 1, o = {}) {
  const lens = ic.strokes.map(p => Math.max(8, p.getTotalLength()));
  const total = lens.reduce((a, b) => a + b, 0);
  let at = t;
  ic.strokes.forEach((p, i) => { at = draw(M, S, p, at, Math.max(0.07, (dur * lens[i]) / total), { ...o, sonido: false }); });
  const tool = o.herramienta !== undefined ? o.herramienta : S.herramienta;
  if (tool && o.sonido !== false) M.sfx(S.herramienta === 'tiza' ? 'tiza' : S.herramienta === 'lapiz' ? 'lapiz' : 'escritura', t, { dur: at - t, vol: 0.7 });
  ic.fills.forEach(f => { const a = { o: 0 }; M.every(() => f.setAttribute('opacity', a.o)); M.to(a, { o: 0.92, duration: 0.3 }, at - 0.05); });
  return at + (ic.fills.length ? 0.2 : 0);
}

// Ícono que aparece con rebote (sin dibujarse)
export function popIcon(M, S, ic, t, o = {}) {
  ic.fills.forEach(f => f.setAttribute('opacity', 0.92));
  const a = M.anim(ic.g, { pivot: [ic.cx, ic.cy], s: 0, r: o.r ?? -12 });
  M.to(a, { s: 1, r: 0, duration: 0.5, ease: 'back.out(2.4)' }, t);
  if (o.sonido !== false) M.sfx('pop', t, { vol: 0.6 });
  return t + 0.4;
}

// Flecha (curva suave en estilos a mano)
export function arrow(M, S, parent, x1, y1, x2, y2, o = {}) {
  const color = colorOf(M, S, o.color);
  const w = (o.w ?? M.style.trazo) * M.u;
  const g = el('g', {}, parent);
  let d;
  if (o.curva) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
    const c = o.curva * Math.hypot(x2 - x1, y2 - y1);
    d = `M${x1},${y1} Q${mx + (nx / L) * c},${my + (ny / L) * c} ${x2},${y2}`;
  } else d = M.style.mano ? handLine(x1, y1, x2, y2, o.seed ?? 3, 0.8) : `M${x1},${y1} L${x2},${y2}`;
  const shaft = path(g, d, { color, w });
  const len = shaft.getTotalLength();
  const a = shaft.getPointAtLength(len), b = shaft.getPointAtLength(Math.max(0, len - 6));
  const ang = Math.atan2(a.y - b.y, a.x - b.x), hl = (o.cabeza ?? 34) * M.u, sp = 0.5;
  const head = path(g, `M${a.x - Math.cos(ang - sp) * hl},${a.y - Math.sin(ang - sp) * hl} L${a.x},${a.y} L${a.x - Math.cos(ang + sp) * hl},${a.y - Math.sin(ang + sp) * hl}`, { color, w });
  return { g, shaft, head };
}
export function drawArrow(M, S, ar, t, dur = 0.5, o = {}) {
  let at = draw(M, S, ar.shaft, t, dur * 0.75, o);
  return draw(M, S, ar.head, at, dur * 0.25, { ...o, sonido: false });
}

// Globo de diálogo con colita apuntando a (tx, ty)
export function bubble(M, S, parent, x, y, w, h, tx, ty, o = {}) {
  const r = Math.min(40 * M.u, h / 2);
  const cx = clamp(tx, x + r * 1.5, x + w - r * 1.5);
  const below = ty > y + h;
  const bw = 26 * M.u;
  let d = roundRect(x, y, w, h, r);
  if (below) d = `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${cx + bw},${y + h} L${tx},${ty} L${cx - bw},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
  else if (ty < y) d = `M${x + r},${y} L${cx - bw},${y} L${tx},${ty} L${cx + bw},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
  else {
    const cy = clamp(ty, y + r, y + h - r), side = tx > x + w ? x + w : x, dir = tx > x + w ? 1 : -1;
    d = roundRect(x, y, w, h, r) + ` M${side},${cy - bw} L${tx},${ty} L${side},${cy + bw}`;
    const g = el('g', {}, parent);
    el('path', { d: `M${side - dir * 2},${cy - bw} L${tx},${ty} L${side - dir * 2},${cy + bw} Z`, fill: o.fill ?? '#FFFFFF', stroke: o.color ?? S.col.tinta, 'stroke-width': 5 * M.u, 'stroke-linejoin': 'round' }, g);
    el('path', { d: roundRect(x, y, w, h, r), fill: o.fill ?? '#FFFFFF', stroke: o.color ?? S.col.tinta, 'stroke-width': 5 * M.u }, g);
    el('path', { d: `M${side - dir * 4},${cy - bw + 4} L${side - dir * 4},${cy + bw - 4}`, stroke: o.fill ?? '#FFFFFF', 'stroke-width': 8 * M.u }, g);
    return g;
  }
  return el('path', { d, fill: o.fill ?? '#FFFFFF', stroke: o.color ?? S.col.tinta, 'stroke-width': 5 * M.u, 'stroke-linejoin': 'round' }, parent);
}

/* ------------------------- herramientas ------------------------- */
// Cada herramienta tiene la punta en (0,0) y el cuerpo hacia arriba-derecha.
export function buildTools(M, layer) {
  const u = M.u, tinta = M.style.tinta, acc = M.style.acento;
  const mk = (inner, rot = -52) => {
    const g = el('g', { style: 'display:none' }, layer);
    g.insertAdjacentHTML('beforeend', `<g transform="scale(${u}) rotate(${rot})">${inner}</g>`);
    return g;
  };
  const shadow = w => `<rect x="30" y="${-w / 2}" width="240" height="${w}" rx="${w / 2}" fill="#000" opacity=".16" transform="translate(10,34)" filter="url(#av-sombraH)"/>`;
  const tools = {
    marcador: mk(`${shadow(46)}
      <path d="M0,0 L20,-9 L34,-12 L34,12 L20,9 Z" fill="${tinta}"/>
      <rect x="32" y="-19" width="22" height="38" rx="4" fill="#D9D9D9" stroke="#2B2B2B" stroke-width="3"/>
      <rect x="52" y="-24" width="186" height="48" rx="8" fill="#F7F7F5" stroke="#2B2B2B" stroke-width="3"/>
      <rect x="150" y="-24" width="36" height="48" fill="${acc}"/>
      <rect x="232" y="-26" width="44" height="52" rx="10" fill="${acc}" stroke="#2B2B2B" stroke-width="3"/>
      <rect x="62" y="-16" width="80" height="7" rx="3" fill="#FFFFFF" opacity=".8"/>`),
    tiza: mk(`${shadow(30)}
      <rect x="0" y="-15" width="130" height="30" rx="13" fill="#F4F2EA"/>
      <rect x="10" y="-8" width="110" height="5" rx="2" fill="#FFFFFF" opacity=".7"/>
      <ellipse cx="4" cy="0" rx="6" ry="14" fill="#E6E2D6"/>`, -40),
    lapiz: mk(`${shadow(34)}
      <path d="M0,0 L14,-5 L14,5 Z" fill="#3A3A3A"/>
      <path d="M14,-5 L46,-17 L46,17 L14,5 Z" fill="#EBC592" stroke="#2B2B2B" stroke-width="2.5"/>
      <rect x="46" y="-17" width="190" height="34" fill="#FFC83D" stroke="#2B2B2B" stroke-width="2.5"/>
      <rect x="46" y="-6" width="190" height="4" fill="#E0A21C"/>
      <rect x="236" y="-18" width="24" height="36" fill="#C4C4C4" stroke="#2B2B2B" stroke-width="2.5"/>
      <rect x="258" y="-18" width="30" height="36" rx="8" fill="#F28DA6" stroke="#2B2B2B" stroke-width="2.5"/>`),
    cursor: mk(`<path d="M0,0 L0,52 L13,40 L23,62 L33,57 L23,36 L40,36 Z" fill="#FFFFFF" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>`, 0),
  };
  return tools;
}

// Actualiza la herramienta visible según los segmentos registrados (M.toolSeg)
export function toolUpdater(M, tools) {
  const segs = M._toolSegs.sort((a, b) => a.a - b.a);
  const stageInv = () => M.svg.getScreenCTM().inverse();
  const conv = r => {
    if (!r) return null;
    const [x, y, node] = r;
    const m = node.getScreenCTM?.();
    if (!m) return null;
    const pt = M.svg.createSVGPoint(); pt.x = x; pt.y = y;
    const q = pt.matrixTransform(m).matrixTransform(stageInv());
    return [q.x, q.y];
  };
  const U = M.u;
  let lastKind = null;
  return T => {
    let kind = null, pos = null, alpha = 1, off = 0;
    const cur = segs.find(s => T >= s.a && T <= s.b);
    if (cur) { kind = cur.kind; pos = conv(cur.fn(T)); }
    else {
      let prev = null, next = null;
      for (const s of segs) { if (s.b < T) prev = s; else if (s.a > T) { next = s; break; } }
      if (prev && next && next.kind === prev.kind && next.a - prev.b < 0.55) {
        const p0 = conv(prev.fn(prev.b)), p1 = conv(next.fn(next.a));
        if (p0 && p1) {
          const k = (T - prev.b) / (next.a - prev.b), e = k * k * (3 - 2 * k);
          pos = [p0[0] + (p1[0] - p0[0]) * e, p0[1] + (p1[1] - p0[1]) * e - Math.sin(Math.PI * k) * 40 * U];
          kind = prev.kind;
        }
      } else if (prev && T - prev.b < 0.3) { kind = prev.kind; pos = conv(prev.fn(prev.b)); off = (T - prev.b) / 0.3; }
      else if (next && next.a - T < 0.25) { kind = next.kind; pos = conv(next.fn(next.a)); off = (next.a - T) / 0.25; }
    }
    if (lastKind && lastKind !== kind) tools[lastKind].style.display = 'none';
    if (!kind || !pos || !tools[kind]) { lastKind = null; return; }
    const e = off * off;
    const x = pos[0] + e * 160 * U, y = pos[1] + e * 220 * U;
    alpha = 1 - e;
    const g = tools[kind];
    g.style.display = '';
    g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(Math.sin(T * 7) * 2).toFixed(2)})`);
    g.setAttribute('opacity', alpha.toFixed(3));
    lastKind = kind;
  };
}

// Confeti determinista (celebraciones)
export function confetti(M, parent, x, y, t, o = {}) {
  const r = rng(o.seed ?? 21), n = o.n ?? 28, U = M.u;
  const colors = o.colores ?? [M.style.acento, M.style.acento2, M.style.acento3, M.style.amarillo];
  const parts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.9, v = (700 + r() * 700) * U;
    const e = el('rect', { width: (10 + r() * 10) * U, height: (6 + r() * 6) * U, fill: colors[i % colors.length], style: 'display:none' }, parent);
    return { e, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: r() * 360, vr: (r() - 0.5) * 900 };
  });
  const life = o.vida ?? 1.7, g = 2200 * U;
  M.every(T => {
    const dt = T - t;
    parts.forEach(p => {
      if (dt < 0 || dt > life) { p.e.style.display = 'none'; return; }
      p.e.style.display = '';
      const px = x + p.vx * dt * 0.8, py = y + p.vy * dt + 0.5 * g * dt * dt;
      p.e.setAttribute('transform', `translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${(p.rot + p.vr * dt).toFixed(1)})`);
      p.e.setAttribute('opacity', clamp((life - dt) / 0.4, 0, 1).toFixed(2));
    });
  });
  M.sfx('exito', t, { vol: 0.7 });
}

export { smoothPath, rgba };
