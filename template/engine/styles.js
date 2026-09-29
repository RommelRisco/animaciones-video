// animaciones-video · estilos (paleta + tipografía + fondo + herramienta + transiciones)
import { el, mix, isDark, contrast, hexToRgb } from './util.js';

// Fuentes incluidas (se instalan con npm vía @fontsource → funcionan sin internet)
export const BUNDLED_FONTS = {
  'Caveat': { pkg: 'caveat', weights: [400, 700] },
  'Kalam': { pkg: 'kalam', weights: [400, 700] },
  'Patrick Hand': { pkg: 'patrick-hand', weights: [400] },
  'Poppins': { pkg: 'poppins', weights: [400, 600, 800] },
  'Bebas Neue': { pkg: 'bebas-neue', weights: [400] },
  'JetBrains Mono': { pkg: 'jetbrains-mono', weights: [500, 700] },
};

const BASE = { malo: '#D93A2F', bueno: '#16A34A', amarillo: '#FFD23F' };

export const STYLES = {
  pizarra: {
    ...BASE, nombre: 'Pizarra blanca (plumón)', fondo: 'papel', papel: '#FAF8F3', tinta: '#1E1B18',
    acento: '#F2542D', acento2: '#2F6FDE', acento3: '#16A34A', suave: '#8C857B', resaltador: '#FFE066',
    titulo: { familia: 'Caveat', peso: 700, escala: 1.3 }, texto: { familia: 'Kalam', peso: 400, escala: 1 },
    num: { familia: 'Caveat', peso: 700, escala: 1.3 },
    herramienta: 'marcador', mano: true, grano: 0.14, trazo: 7, mayus: false,
    efectoTitulo: 'escribir', efectoTexto: 'escribir', marca: 'subrayado', relleno: 'trama',
    transiciones: ['borrador', 'barrido', 'circulo', 'empuje', 'tinta'],
  },
  pizarron: {
    ...BASE, nombre: 'Pizarrón verde (tiza)', fondo: 'pizarron', papel: '#22332D', tinta: '#F2EFE6',
    acento: '#FFB547', acento2: '#86CBFF', acento3: '#A5E38F', suave: '#A5B5AD', resaltador: '#FFE27A',
    malo: '#FF8F80', bueno: '#A5E38F', amarillo: '#FFE27A',
    titulo: { familia: 'Caveat', peso: 700, escala: 1.3 }, texto: { familia: 'Kalam', peso: 400, escala: 1 },
    num: { familia: 'Caveat', peso: 700, escala: 1.3 },
    herramienta: 'tiza', mano: true, tiza: true, grano: 0.2, trazo: 7, mayus: false,
    efectoTitulo: 'escribir', efectoTexto: 'escribir', marca: 'circulo', relleno: 'trama',
    transiciones: ['borrador', 'circulo', 'empuje', 'barrido', 'persiana'],
  },
  cuaderno: {
    ...BASE, nombre: 'Cuaderno (lápiz y marcatextos)', fondo: 'cuaderno', papel: '#FFFDF5', tinta: '#26324B',
    acento: '#FF4F81', acento2: '#2F80ED', acento3: '#27AE60', suave: '#8D93A5', resaltador: '#FFF06A',
    malo: '#EB5757', bueno: '#27AE60', amarillo: '#FFE14D',
    titulo: { familia: 'Patrick Hand', peso: 400, escala: 1.1 }, texto: { familia: 'Patrick Hand', peso: 400, escala: 1 },
    num: { familia: 'Patrick Hand', peso: 400, escala: 1.1 },
    herramienta: 'lapiz', mano: true, grano: 0.1, trazo: 6, mayus: false,
    efectoTitulo: 'escribir', efectoTexto: 'escribir', marca: 'resaltador', relleno: 'solido',
    transiciones: ['empuje', 'borrador', 'persiana', 'circulo', 'voltear'],
  },
  kraft: {
    ...BASE, nombre: 'Cartón kraft (marcador y sellos)', fondo: 'kraft', papel: '#C9A57C', tinta: '#2A1E16',
    acento: '#C81D25', acento2: '#1B4D89', acento3: '#2E7D32', suave: '#6E5845', resaltador: '#FFF3B0',
    amarillo: '#FFD166', malo: '#C81D25', bueno: '#2E7D32',
    titulo: { familia: 'Caveat', peso: 700, escala: 1.3 }, texto: { familia: 'Patrick Hand', peso: 400, escala: 1 },
    num: { familia: 'Caveat', peso: 700, escala: 1.3 },
    herramienta: 'marcador', mano: true, grano: 0.2, trazo: 7, mayus: false,
    efectoTitulo: 'escribir', efectoTexto: 'escribir', marca: 'circulo', relleno: 'trama',
    transiciones: ['barrido', 'tinta', 'empuje', 'persiana', 'circulo'],
  },
  minimal: {
    ...BASE, nombre: 'Minimal blanco (limpio, editorial)', fondo: 'minimal', papel: '#FFFFFF', tinta: '#111114',
    acento: '#4F46E5', acento2: '#06B6D4', acento3: '#10B981', suave: '#6B7280', resaltador: '#C7D2FE',
    malo: '#EF4444', bueno: '#10B981', amarillo: '#F59E0B',
    titulo: { familia: 'Poppins', peso: 800, escala: 1 }, texto: { familia: 'Poppins', peso: 400, escala: 1 },
    num: { familia: 'Poppins', peso: 800, escala: 1 },
    herramienta: null, mano: false, grano: 0, trazo: 8, mayus: false,
    efectoTitulo: 'palabras', efectoTexto: 'deslizar', marca: 'resaltador', relleno: 'solido',
    transiciones: ['empuje', 'zoom', 'circulo', 'persiana', 'fundido'],
  },
  oscuro: {
    ...BASE, nombre: 'Oscuro tech (neón, cinético)', fondo: 'oscuro', papel: '#0D0E12', tinta: '#F4F4F6',
    acento: '#8B5CF6', acento2: '#22D3EE', acento3: '#34D399', suave: '#9CA3AF', resaltador: '#8B5CF6',
    malo: '#F87171', bueno: '#34D399', amarillo: '#FACC15',
    titulo: { familia: 'Bebas Neue', peso: 400, escala: 1.2 }, texto: { familia: 'Poppins', peso: 400, escala: 1 },
    num: { familia: 'Bebas Neue', peso: 400, escala: 1.25 },
    herramienta: null, mano: false, grano: 0.05, trazo: 8, mayus: true,
    efectoTitulo: 'golpe', efectoTexto: 'deslizar', marca: 'subrayado', relleno: 'solido',
    transiciones: ['zoom', 'barrido', 'persiana', 'circulo', 'empuje'],
  },
};

// Mezcla estilo + marca del cliente (colores, fuentes, herramienta…)
export function resolveStyle(name = 'pizarra', marca = {}) {
  const base = STYLES[name];
  if (!base) throw new Error(`Estilo desconocido "${name}". Usa: ${Object.keys(STYLES).join(', ')}`);
  const s = structuredClone(base);
  s.id = name;
  for (const k of ['papel', 'tinta', 'acento', 'acento2', 'acento3', 'suave', 'resaltador', 'malo', 'bueno', 'amarillo', 'herramienta', 'mayus', 'efectoTitulo', 'efectoTexto', 'marca', 'grano'])
    if (marca[k] !== undefined) s[k] = marca[k];
  if (marca.fondo) s.papel = marca.fondo;
  if (marca.fuenteTitulo) s.titulo = { familia: marca.fuenteTitulo, peso: marca.pesoTitulo ?? 700, escala: marca.escalaTitulo ?? 1 };
  if (marca.fuenteTexto) s.texto = { familia: marca.fuenteTexto, peso: marca.pesoTexto ?? 400, escala: marca.escalaTexto ?? 1 };
  if (marca.fuenteNumeros) s.num = { familia: marca.fuenteNumeros, peso: marca.pesoNumeros ?? 700, escala: 1 };
  else if (marca.fuenteTitulo) s.num = { ...s.titulo };
  return s;
}

// Colores de una escena según su fondo (garantiza contraste del texto)
export function scenePalette(style, bgColor) {
  const c = { ...style, fondoColor: bgColor };
  if (!bgColor) return c; // transparente: se asume video debajo; el texto usa la tinta del estilo
  if (contrast(c.tinta, bgColor) < 4) c.tinta = isDark(bgColor) ? '#FFFFFF' : '#141414';
  const pick = (...opts) => opts.find(o => o && contrast(o, bgColor) >= 2.2 && o.toLowerCase() !== bgColor.toLowerCase()) || c.tinta;
  c.acento = pick(style.acento, style.amarillo, style.acento2, c.tinta);
  c.acento2 = pick(style.acento2, style.acento3, c.tinta);
  c.acento3 = pick(style.acento3, style.acento2, c.tinta);
  c.suave = contrast(style.suave, bgColor) >= 2 ? style.suave : mix(c.tinta, bgColor, 0.35);
  c.oscuro = isDark(bgColor);
  return c;
}

// Filtros SVG compartidos (se crean una vez en <defs>)
export function installFilters(defs, u) {
  defs.insertAdjacentHTML('beforeend', `
  <filter id="av-boil" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence id="av-boilT" type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(3.4 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="av-tiza" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence id="av-tizaT" type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="1" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(4 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.62" result="m"/>
    <feComposite in="d" in2="m" operator="in"/>
  </filter>
  <filter id="av-grano" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/>
    <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 0 0.22  0 0 0 -1.2 0.66"/>
  </filter>
  <filter id="av-papel" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="4"/>
    <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.38  0 0 0 -1.6 0.9"/>
  </filter>
  <filter id="av-fibras" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.005 0.16" numOctaves="3" seed="3"/>
    <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.18  0 0 0 0 0.08  0 0 0 -1.4 0.8"/>
  </filter>
  <filter id="av-manchas" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" seed="9"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.25"/>
  </filter>
  <filter id="av-sombra" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="${(10 * u).toFixed(1)}" stdDeviation="${(14 * u).toFixed(1)}" flood-color="#000" flood-opacity="0.22"/>
  </filter>
  <filter id="av-sombraH" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(7 * u).toFixed(1)}"/></filter>
  <filter id="av-brillo" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="${(18 * u).toFixed(1)}"/>
  </filter>`);
}

// Trama de relleno "a mano" (líneas diagonales) por color
const hatchCache = new Map();
export function hatch(defs, color, u = 1) {
  const key = color + u;
  if (hatchCache.has(key)) return `url(#${hatchCache.get(key)})`;
  const id = 'av-h' + hatchCache.size;
  const s = 9 * u, line = mix(color, '#000000', 0.35);
  defs.insertAdjacentHTML('beforeend', `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${s}" height="${s}" patternTransform="rotate(40)">
      <rect width="${s}" height="${s}" fill="${color}"/>
      <line x1="${s * 0.2}" y1="0" x2="${s * 0.2}" y2="${s}" stroke="${line}" stroke-width="${1.6 * u}" opacity=".35"/>
    </pattern>`);
  hatchCache.set(key, id);
  return `url(#${id})`;
}

// Resuelve la especificación de fondo de una escena → { kind, color }
export function resolveBg(spec, style) {
  if (spec === 'transparente' || spec === false) return { kind: 'transparente', color: null };
  if (!spec || spec === 'estilo') return { kind: style.fondo, color: style.papel };
  if (typeof spec === 'string' && spec.startsWith('#')) return { kind: 'solido', color: spec };
  if (['acento', 'acento2', 'acento3', 'tinta', 'amarillo'].includes(spec)) return { kind: 'solido', color: style[spec] };
  if (spec === 'degradado') return { kind: 'degradado', color: mix(style.acento, style.acento2, 0.5) };
  if (STYLES[spec]) return { kind: STYLES[spec].fondo, color: STYLES[spec].papel };
  if (spec === 'papel') return { kind: 'papel', color: STYLES.pizarra.papel };
  if (spec === 'croma') return { kind: 'solido', color: '#00FF00' };
  throw new Error(`Fondo desconocido "${spec}"`);
}

let gradN = 0;
export function drawBackground(M, g, bg, style) {
  const { W, H, u } = M;
  const { kind, color } = bg;
  if (kind === 'transparente') return;
  el('rect', { width: W, height: H, fill: color }, g);
  if (kind === 'papel') {
    el('rect', { width: W, height: H, filter: 'url(#av-papel)', opacity: 0.2 }, g);
    vignette(M, g, '#6B5A45', 0.12);
  } else if (kind === 'pizarron') {
    el('rect', { width: W, height: H, filter: 'url(#av-manchas)', opacity: 0.1 }, g);
    vignette(M, g, '#000000', 0.45);
  } else if (kind === 'cuaderno') {
    const step = 64 * u, top = 150 * u;
    let d = '';
    for (let y = top; y < H; y += step) d += `M0,${y.toFixed(1)} L${W},${y.toFixed(1)} `;
    el('path', { d, stroke: '#B9CFF0', 'stroke-width': 2 * u, fill: 'none' }, g);
    const mx = (M.W > M.H ? 150 : 96) * u;
    el('path', { d: `M${mx},0 L${mx},${H}`, stroke: '#F4A3A3', 'stroke-width': 3 * u }, g);
    el('rect', { width: W, height: H, filter: 'url(#av-papel)', opacity: 0.18 }, g);
  } else if (kind === 'kraft') {
    el('rect', { width: W, height: H, filter: 'url(#av-fibras)', opacity: 0.55 }, g);
    el('rect', { width: W, height: H, filter: 'url(#av-papel)', opacity: 0.3 }, g);
    vignette(M, g, '#3A2512', 0.3);
  } else if (kind === 'minimal') {
    const id = 'av-g' + (++gradN);
    M.defs.insertAdjacentHTML('beforeend', `<radialGradient id="${id}" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#F3F3F8"/><stop offset="1" stop-color="${color}"/></radialGradient>`);
    el('rect', { width: W, height: H, fill: `url(#${id})` }, g);
  } else if (kind === 'oscuro') {
    const id = 'av-g' + (++gradN), s = 72 * u;
    M.defs.insertAdjacentHTML('beforeend', `
      <pattern id="${id}p" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="M${s},0 L0,0 0,${s}" fill="none" stroke="#FFFFFF" stroke-opacity=".05" stroke-width="${1.5 * u}"/></pattern>
      <radialGradient id="${id}a" cx="50%" cy="8%" r="60%"><stop offset="0" stop-color="${style.acento}" stop-opacity=".32"/><stop offset="1" stop-color="${style.acento}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}b" cx="0%" cy="100%" r="70%"><stop offset="0" stop-color="${style.acento2}" stop-opacity=".16"/><stop offset="1" stop-color="${style.acento2}" stop-opacity="0"/></radialGradient>`);
    el('rect', { width: W, height: H, fill: `url(#${id}p)` }, g);
    el('rect', { width: W, height: H, fill: `url(#${id}a)` }, g);
    el('rect', { width: W, height: H, fill: `url(#${id}b)` }, g);
  } else if (kind === 'degradado') {
    const id = 'av-g' + (++gradN);
    M.defs.insertAdjacentHTML('beforeend', `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${style.acento}"/><stop offset="1" stop-color="${style.acento2}"/></linearGradient>`);
    el('rect', { width: W, height: H, fill: `url(#${id})` }, g);
  }
}

function vignette(M, g, color, amount) {
  const id = 'av-g' + (++gradN);
  M.defs.insertAdjacentHTML('beforeend', `<radialGradient id="${id}" cx="50%" cy="48%" r="75%"><stop offset="0.55" stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity="${amount}"/></radialGradient>`);
  el('rect', { width: M.W, height: M.H, fill: `url(#${id})` }, g);
}

export const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
