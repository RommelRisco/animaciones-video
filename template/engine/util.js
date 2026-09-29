// animaciones-video · utilidades compartidas (navegador)
export const NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// PRNG determinista (mulberry32): el mismo seed da el mismo video siempre.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => lerp(v, B[i], t))); };
export function luminance(hex) {
  const c = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export const isDark = hex => luminance(hex) < 0.22;
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// normaliza una palabra para comparar ("¡Ahorra!" → "ahorra")
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}%$€]+/gu, '');

let uid = 0;
export const nextId = p => `${p}${++uid}`;

// círculo/elipse "a mano": cierra un poco pasado el inicio, como cuando se encierra algo con plumón
export function wobblyEllipse(cx, cy, rx, ry, seed = 3, turns = 1.12) {
  const r = rng(seed); const pts = []; const n = 28;
  const a0 = -Math.PI * 0.6 + r() * 0.4;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 * turns;
    const k = 1 + (r() - 0.5) * 0.06 + (i / n) * 0.05;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothPath(pts);
}

// Catmull-Rom → Bézier: curva suave que pasa por todos los puntos
export function smoothPath(pts, closed = false) {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f(p[1][0])},${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + ' Z' : d;
}
const f = v => Math.round(v * 10) / 10;

// línea "a mano": un poco curva y con temblor leve
export function handLine(x1, y1, x2, y2, seed = 5, wob = 1) {
  const r = rng(seed); const n = 6; const pts = [];
  const len = Math.hypot(x2 - x1, y2 - y1); const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
  const bow = (r() - 0.5) * len * 0.03 * wob;
  for (let i = 0; i <= n; i++) {
    const t = i / n; const b = Math.sin(t * Math.PI) * bow + (i && i < n ? (r() - 0.5) * 2.2 * wob : 0);
    pts.push([x1 + (x2 - x1) * t + nx * b, y1 + (y2 - y1) * t + ny * b]);
  }
  return smoothPath(pts);
}

// rectángulo redondeado como path (sirve para dibujarlo con trazo animado)
export function roundRect(x, y, w, h, r = 20) {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
}

// rectángulo "a mano" (esquinas que se pasan un poco)
export function handRect(x, y, w, h, seed = 7) {
  const r = rng(seed); const j = () => (r() - 0.5) * 6;
  return `M${x + j()},${y + j()} L${x + w + j()},${y + j()} L${x + w + j()},${y + h + j()} L${x + j()},${y + h + j()} Z`;
}

export async function toDataURL(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`No encuentro la imagen: ${src}`);
  const blob = await res.blob();
  const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  const img = new Image(); img.src = url; await img.decode();
  return { url, w: img.naturalWidth, h: img.naturalHeight };
}
