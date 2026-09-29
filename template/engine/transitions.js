// animaciones-video · transiciones entre escenas (y como clips sueltos con alfa)
import { el, rng, smoothPath, nextId, mix } from './util.js';

export const TRANSITION_DUR = { corte: 0, fundido: 0.5, empuje: 0.55, deslizar: 0.55, zoom: 0.5, circulo: 0.6, barrido: 0.7, tinta: 0.8, persiana: 0.7, borrador: 0.8, voltear: 0.5 };
export const TRANSITION_NAMES = Object.keys(TRANSITION_DUR);

// Solo se ve durante [a, b]
function during(M, node, a, b) { M.every(T => { node.style.display = T >= a && T <= b ? '' : 'none'; }); }

function blobPath(cx, cy, r, seed = 4) {
  const R = rng(seed), n = 14, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (R() - 0.5) * 0.28; pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]); }
  return smoothPath(pts, true);
}

// Máscara con un "agujero" circular que crece (para descubrir lo de abajo)
function holeMask(M, cx, cy) {
  const id = nextId('av-mask');
  const m = el('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: M.W, height: M.H }, M.defs);
  el('rect', { width: M.W, height: M.H, fill: '#fff' }, m);
  const c = el('circle', { cx, cy, r: 0, fill: '#000' }, m);
  const p = { r: 0 };
  M.every(() => c.setAttribute('r', Math.max(0, p.r).toFixed(1)));
  return { id, p };
}

/* A → B en [s, s+td]. A o B pueden ser null (transición suelta para editar encima de un corte). */
export function transition(M, name, A, B, s, td, o = {}) {
  const { W, H } = M, D = Math.hypot(W, H);
  const c1 = o.color ?? (M.style.mano ? M.style.tinta : M.style.acento);
  const c2 = o.color2 ?? (M.style.mano ? M.style.acento : M.style.acento2);
  const mid = s + td * 0.5;
  const showB = t => { if (B) { B.wp.o = 0; M.set(B.wp, { o: 1 }, t); } };
  const ease = 'power3.inOut';
  switch (name) {
    case 'corte': return;
    case 'fundido': if (B) { B.wp.o = 0; M.to(B.wp, { o: 1, duration: td, ease: 'none' }, s); } return;
    case 'empuje':
      if (B) { B.wp.x = W; M.to(B.wp, { x: 0, duration: td, ease }, s); }
      if (A) M.to(A.wp, { x: -W, duration: td, ease }, s);
      M.sfx('whoosh', s, { dur: td }); return;
    case 'deslizar':
      if (B) { B.wp.y = H; M.to(B.wp, { y: 0, duration: td, ease }, s); }
      if (A) M.to(A.wp, { y: -H, duration: td, ease }, s);
      M.sfx('whoosh', s, { dur: td }); return;
    case 'zoom':
      if (A) M.to(A.wp, { s: 1.6, o: 0, duration: td, ease: 'power2.in' }, s);
      if (B) { B.wp.s = 0.82; B.wp.o = 0; M.to(B.wp, { s: 1, o: 1, duration: td, ease: 'power2.out' }, s + td * 0.15); }
      M.sfx('whoosh', s, { dur: td, tono: 1.3 }); return;
    case 'voltear':
      if (A) M.to(A.wp, { sx: 0, duration: td / 2, ease: 'power2.in' }, s);
      if (B) { B.wp.sx = 0; M.to(B.wp, { sx: 1, duration: td / 2, ease: 'power2.out' }, mid); }
      M.sfx('whoosh', s, { dur: td, tono: 1.6, vol: 0.6 }); return;
    case 'circulo': {
      const cx = o.x ?? W / 2, cy = o.y ?? H / 2;
      if (A && B) {
        const id = nextId('av-clip');
        const cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, M.defs);
        const c = el('circle', { cx, cy, r: 0 }, cp);
        B.wrap.setAttribute('clip-path', `url(#${id})`);
        const p = { r: 0 };
        M.every(() => c.setAttribute('r', p.r.toFixed(1)));
        M.to(p, { r: D, duration: td, ease: 'power2.in' }, s);
        const ring = el('circle', { cx, cy, r: 0, fill: 'none', stroke: c2, 'stroke-width': 26 * M.u }, M.layers.overlay);
        M.every(() => ring.setAttribute('r', p.r.toFixed(1)));
        during(M, ring, s, s + td);
        M.sfx('whoosh', s, { dur: td }); return;
      }
      name = 'tinta'; o = { ...o, circulo: true };
    }
    // falls through
    case 'tinta': {
      const cx = o.x ?? W / 2, cy = o.y ?? H / 2;
      const g = el('g', {}, M.layers.overlay);
      const hole = holeMask(M, cx, cy);
      g.setAttribute('mask', `url(#${hole.id})`);
      const r0 = D * 0.62;
      const b2 = el('path', { d: o.circulo ? `M${cx - r0},${cy} a${r0},${r0} 0 1,0 ${2 * r0},0 a${r0},${r0} 0 1,0 ${-2 * r0},0` : blobPath(cx, cy, r0, 7), fill: c2 }, g);
      const b1 = el('path', { d: o.circulo ? `M${cx - r0},${cy} a${r0},${r0} 0 1,0 ${2 * r0},0 a${r0},${r0} 0 1,0 ${-2 * r0},0` : blobPath(cx, cy, r0, 3), fill: c1 }, g);
      const a2 = M.anim(b2, { pivot: [cx, cy], s: 0 }), a1 = M.anim(b1, { pivot: [cx, cy], s: 0 });
      M.to(a2, { s: 1.12, duration: td * 0.5, ease: 'power2.in' }, s);
      M.to(a1, { s: 1.12, duration: td * 0.45, ease: 'power2.in' }, s + td * 0.07);
      M.to(hole.p, { r: D * 0.75, duration: td * 0.48, ease: 'power2.out' }, mid);
      during(M, g, s, s + td);
      showB(mid);
      M.sfx('whoosh', s, { dur: td, tono: 0.7 }); return;
    }
    case 'barrido': {
      const g = el('g', {}, M.layers.overlay);
      const sk = H * 0.18;
      const mk = (fill) => el('path', { d: `M${-sk},0 L${W + sk},0 L${W},${H} L${-2 * sk},${H} Z`, fill }, g);
      const p2 = mk(c2), p1 = mk(c1);
      const a2 = M.anim(p2, { pivot: [0, 0], x: -W - 2 * sk }), a1 = M.anim(p1, { pivot: [0, 0], x: -W - 2 * sk });
      M.to(a2, { x: 0, duration: td * 0.45, ease: 'power3.in' }, s);
      M.to(a1, { x: 0, duration: td * 0.42, ease: 'power3.in' }, s + td * 0.08);
      M.to(a1, { x: W + 2 * sk, duration: td * 0.45, ease: 'power3.out' }, mid + 0.02);
      M.to(a2, { x: W + 2 * sk, duration: td * 0.45, ease: 'power3.out' }, mid + 0.08);
      during(M, g, s, s + td + 0.1);
      showB(mid);
      M.sfx('whoosh', s, { dur: td }); return;
    }
    case 'persiana': {
      const g = el('g', {}, M.layers.overlay), n = 6, bh = H / n;
      for (let i = 0; i < n; i++) {
        const r = el('rect', { x: 0, y: i * bh - 1, width: W, height: bh + 2, fill: i % 2 ? c2 : c1 }, g);
        const a = M.anim(r, { pivot: [0, i * bh], sx: 0 });
        M.to(a, { sx: 1, duration: td * 0.38, ease: 'power2.in' }, s + i * td * 0.02);
        // sale hacia la derecha: el borde derecho queda fijo mientras se encoge
        M.to(a, { sx: 0, x: W, duration: td * 0.38, ease: 'power2.out' }, mid + i * td * 0.02);
      }
      during(M, g, s, s + td + 0.15);
      showB(mid);
      M.sfx('whoosh', s, { dur: td, tono: 1.2 }); return;
    }
    case 'borrador': {
      if (A && !A.bg.color) return transition(M, 'fundido', A, B, s, td, o);
      const color = A ? A.bg.color : (o.color ?? M.style.papel);
      const g = el('g', {}, M.layers.overlay);
      const r = el('rect', { x: 0, y: 0, height: H, width: 0, fill: color }, g);
      const u = M.u, ew = 230 * u, eh = 110 * u;
      const er = el('g', {}, g);
      er.insertAdjacentHTML('beforeend', `<g transform="translate(${-ew / 2},${-eh / 2})">
        <rect x="6" y="10" width="${ew}" height="${eh}" rx="${14 * u}" fill="#000" opacity=".15"/>
        <rect width="${ew}" height="${eh}" rx="${14 * u}" fill="#3B6FB6" stroke="#1E1B18" stroke-width="${4 * u}"/>
        <rect y="${eh * 0.62}" width="${ew}" height="${eh * 0.38}" rx="${10 * u}" fill="#EDE6D6" stroke="#1E1B18" stroke-width="${4 * u}"/></g>`);
      const p = { v: 0 };
      M.every(T => {
        const x = p.v * (W + ew);
        r.setAttribute('width', Math.max(0, x - ew * 0.2).toFixed(1));
        const y = H / 2 + Math.sin(T * 26) * H * 0.38;
        er.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(-12 + Math.sin(T * 26) * 8).toFixed(1)})`);
      });
      M.to(p, { v: 1, duration: td, ease: 'power1.inOut' }, s);
      during(M, g, s, s + td);
      if (B) { B.wp.o = 0; M.set(B.wp, { o: 1 }, s + td * 0.98); }
      M.sfx('borrador', s, { dur: td }); return;
    }
    default: throw new Error(`Transición desconocida "${name}". Usa: ${TRANSITION_NAMES.join(', ')}`);
  }
}

// Elige transición: 'auto' rota las del estilo sin repetir la anterior
export function pickTransition(M, want, i) {
  if (want && want !== 'auto') return want;
  const list = M.style.transiciones;
  let t = list[i % list.length];
  if (t === M._lastTrans) t = list[(i + 1) % list.length];
  M._lastTrans = t;
  return t;
}
export { mix };
