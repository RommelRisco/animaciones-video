// animaciones-video · motor principal
// Todo es función del tiempo: renderAt(t) posiciona la línea de tiempo (GSAP, pausada) y aplica los "updaters".
// Por eso cada cuadro se puede renderizar en cualquier orden y el resultado es idéntico siempre.
import { el, clamp, rng, toDataURL } from './util.js';
import { resolveStyle, installFilters, resolveBg, drawBackground, scenePalette, BUNDLED_FONTS } from './styles.js';
import * as TX from './text.js';
import * as DR from './draw.js';
import { mascot } from './mascot.js';
import { transition, pickTransition, TRANSITION_DUR } from './transitions.js';
import { COMPONENTS } from './components.js';

export const FORMATS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };

function safeArea(W, H, u, on = true) {
  if (!on) return { x: 60 * u, y: 60 * u, w: W - 120 * u, h: H - 120 * u };
  if (H / W > 1.5) return { x: 70 * u, y: 250 * u, w: W - 140 * u, h: H - 250 * u - 390 * u }; // 9:16: evita la UI de Reels/TikTok
  if (W > H) return { x: 130 * u, y: 100 * u, w: W - 260 * u, h: H - 210 * u };
  return { x: 80 * u, y: 100 * u, w: W - 160 * u, h: H - 210 * u };
}

async function loadFonts(M, clip) {
  const st = M.style;
  const wanted = new Map();
  wanted.set('Poppins', new Set([400, 800])); // fuente de interfaz (botones, subtítulos, comillas)
  for (const f of [st.titulo, st.texto, st.num]) {
    if (!wanted.has(f.familia)) wanted.set(f.familia, new Set());
    wanted.get(f.familia).add(f.peso);
  }
  const custom = new Map((clip.fuentes || []).map(f => [f.familia, f]));
  const links = [];
  const addLink = href => new Promise(res => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
    l.onload = res; l.onerror = () => { M.warn(`No pude cargar la fuente ${href}`); res(); };
    document.head.appendChild(l);
  });
  for (const [fam, weights] of wanted) {
    if (custom.has(fam)) {
      const f = custom.get(fam);
      const face = new FontFace(fam, `url(${f.archivo})`, { weight: String(f.peso ?? 400) });
      try { document.fonts.add(await face.load()); } catch { M.warn(`No pude cargar ${f.archivo}`); }
    } else if (BUNDLED_FONTS[fam]) {
      const b = BUNDLED_FONTS[fam];
      for (const w of weights) {
        const near = b.weights.reduce((a, c) => Math.abs(c - w) < Math.abs(a - w) ? c : a);
        links.push(addLink(`node_modules/@fontsource/${b.pkg}/${near}.css`));
      }
    } else {
      const ws = [...new Set([400, ...weights])].sort((a, b) => a - b).join(';');
      links.push(addLink(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}:wght@${ws}&display=block`));
    }
  }
  await Promise.all(links);
  const loads = [];
  for (const [fam, weights] of wanted) for (const w of weights) loads.push(document.fonts.load(`${w} 64px "${fam}"`, 'Aá1ñ'));
  await Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, 12000))]);
  for (const [fam, weights] of wanted) for (const w of weights)
    if (!document.fonts.check(`${w} 64px "${fam}"`)) M.warn(`La fuente "${fam}" (${w}) no cargó; se usará una de reserva.`);
}

export async function boot(clip, opts = {}) {
  const gsap = window.gsap;
  if (!gsap) throw new Error('GSAP no cargó (¿corriste npm install?)');
  const q = opts.query || new URLSearchParams(location.search);
  const fmt = q.get('formato') || clip.formato || '9:16';
  const [W, H] = typeof fmt === 'object' ? [fmt.ancho, fmt.alto] : (FORMATS[fmt] || fmt.split('x').map(Number));
  if (!W || !H) throw new Error(`Formato inválido "${fmt}". Usa 9:16, 16:9, 1:1, 4:5 o 1280x720.`);
  const u = Math.min(W, H) / 1080;
  const croma = q.get('croma') === '1';
  const alpha = !croma && (q.get('alfa') === '1' || clip.fondo === 'transparente');
  const speed = clip.velocidad ?? 1;
  const style = resolveStyle(q.get('estilo') || clip.estilo || 'pizarra', clip.marca || {});
  const tl = gsap.timeline({ paused: true });

  const svg = document.getElementById('stage');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '<defs></defs>';
  const defs = svg.querySelector('defs');
  const layers = {};
  for (const k of ['scenes', 'tools', 'overlay', 'grain', 'guides']) layers[k] = el('g', { id: 'av-' + k }, svg);
  if (alpha) document.documentElement.classList.add('alfa');

  const updaters = [];
  const M = {
    gsap, tl, svg, defs, layers, W, H, u, style, clip, speed, alpha, croma,
    fps: Number(q.get('fps') || clip.fps || 30), warnings: [], _toolSegs: [], _sfx: [], scenes: [],
    rand: rng(clip.semilla ?? 7), el,
  };
  M.warn = msg => { M.warnings.push(msg); console.warn('[animaciones-video]', msg); };
  M.every = fn => updaters.push(fn);
  M.to = (p, vars, t) => { tl.to(p, { duration: 0.5, ease: 'power2.out', ...vars }, Math.max(0, t)); return t + (vars.duration ?? 0.5); };
  M.set = (p, vars, t) => { tl.set(p, vars, Math.max(0, t)); return t; };
  M.sfx = (tipo, t, o = {}) => { if (M._mute) return; M._sfx.push({ tipo, t, dur: o.dur ?? null, vol: o.vol ?? 1, n: o.n ?? null, tono: o.tono ?? 1 }); };
  M.toolSeg = (kind, a, b, fn) => { if (kind && kind !== 'ninguna') M._toolSegs.push({ kind, a, b, fn }); };
  M.anim = (node, o = {}) => {
    let pivot = o.pivot;
    if (!pivot) { const b = node.getBBox(); pivot = [b.x + b.width / 2, b.y + b.height / 2]; }
    const p = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1 };
    for (const k in p) if (o[k] !== undefined) p[k] = o[k];
    const bx = o.bx || 0, by = o.by || 0, [px, py] = pivot;
    let lastT = '', lastO = null;
    updaters.push(() => {
      const tr = `translate(${(bx + p.x + px).toFixed(2)},${(by + p.y + py).toFixed(2)}) rotate(${p.r.toFixed(2)}) scale(${(p.s * p.sx).toFixed(4)},${(p.s * p.sy).toFixed(4)}) translate(${(-px).toFixed(2)},${(-py).toFixed(2)})`;
      if (tr !== lastT) { node.setAttribute('transform', tr); lastT = tr; }
      const op = clamp(p.o, 0, 1);
      if (op !== lastO) { node.setAttribute('opacity', op.toFixed(3)); lastO = op; }
    });
    return p;
  };
  M.shake = (S, t, amp = 8) => {
    const a = amp * u, kf = [[a, -a * 0.6], [-a * 0.8, a * 0.5], [a * 0.5, a * 0.4], [-a * 0.3, -a * 0.2], [0, 0]];
    kf.forEach(([x, y], i) => tl.to(S.shk, { x, y, duration: 0.045, ease: 'none' }, t + i * 0.045));
  };
  // atajos del API (ver references/api-motor.md)
  M.text = (S, parent, text, o) => TX.makeText(M, parent, text, o);
  M.appear = (S, T, t, efecto, o) => TX.aparecer(M, S, T, t, efecto, o);
  M.mark = (S, T, t, o) => TX.marcar(M, S, T, t, o);
  M.draw = (S, p, t, d, o) => DR.draw(M, S, p, t, d, o);
  M.path = (parent, d, o) => DR.path(parent, d, o);
  M.icon = (S, parent, name, cx, cy, size, o) => DR.icon(M, S, parent, name, cx, cy, size, o);
  M.drawIcon = (S, ic, t, d, o) => DR.drawIcon(M, S, ic, t, d, o);
  M.popIcon = (S, ic, t, o) => DR.popIcon(M, S, ic, t, o);
  M.arrow = (S, parent, x1, y1, x2, y2, o) => DR.arrow(M, S, parent, x1, y1, x2, y2, o);
  M.drawArrow = (S, ar, t, d, o) => DR.drawArrow(M, S, ar, t, d, o);
  M.bubble = (S, parent, x, y, w, h, tx, ty, o) => DR.bubble(M, S, parent, x, y, w, h, tx, ty, o);
  M.mascot = (S, parent, x, y, o) => mascot(M, S, parent, x, y, o);
  M.confetti = (parent, x, y, t, o) => DR.confetti(M, parent, x, y, t, o);
  M.image = src => toDataURL(src);
  M.color = (S, c) => DR.colorOf(M, S, c);

  await loadFonts(M, clip);
  installFilters(defs, u);
  const tools = DR.buildTools(M, layers.tools);
  M.tools = tools;

  const escenas = clip.escenas || [];
  if (!escenas.length) throw new Error('El clip no tiene escenas');
  const safe = safeArea(W, H, u, clip.zonaSegura !== false);
  M.safe = safe;
  let prev = null;
  for (let i = 0; i < escenas.length; i++) {
    const spec = escenas[i];
    const comp = COMPONENTS[spec.tipo];
    if (!comp) throw new Error(`Escena ${i + 1}: tipo desconocido "${spec.tipo}". Usa: ${Object.keys(COMPONENTS).join(', ')}`);
    const tName = prev ? pickTransition(M, prev.spec.transicion ?? clip.transicion ?? (alpha || clip.fondo === 'transparente' ? 'corte' : 'auto'), i) : null;
    const td = prev ? (prev.spec.duracionTransicion ?? TRANSITION_DUR[tName] ?? 0.5) : 0;
    const start = prev ? prev.end - td : 0;

    const wrap = el('g', { 'data-escena': i + 1 }, layers.scenes);
    const bgG = el('g', {}, wrap);
    const cam = el('g', {}, wrap);
    const plain = el('g', {}, cam);
    const g = el('g', {}, cam);
    const bgSpec = alpha ? 'transparente' : croma ? 'croma' : (spec.fondo ?? clip.fondo);
    const bg = resolveBg(bgSpec, style);
    drawBackground(M, bgG, bg, style);
    const col = scenePalette(style, bg.color);
    if (style.mano && spec.textura !== false) g.setAttribute('filter', style.tiza && (bg.kind === 'pizarron' || !bg.color) ? 'url(#av-tiza)' : 'url(#av-boil)');
    const S = {
      i, spec, wrap, bgG, cam, g, plain, bg, col, W, H, u, start,
      caja: { ...safe, ...(spec.caja || {}) }, mano: style.mano,
      herramienta: spec.herramienta !== undefined ? spec.herramienta : style.herramienta,
      t0: start + (prev ? td * 0.55 : 0.12), shk: { x: 0, y: 0 },
    };
    M.col = col; M.S = S;
    S.wp = M.anim(wrap, { pivot: [W / 2, H / 2] });
    M._mute = spec.sonido === false || clip.sonido === false;
    const res = (await comp(M, S, spec)) || {};
    M._mute = false;
    const fin = res.fin ?? S.t0 + 1;
    const hold = spec.pausa ?? res.pausa ?? clamp(0.4 + (res.palabras ?? 4) * 0.07, 0.8, 2.2);
    let end = spec.duracion != null ? start + spec.duracion : fin + hold;
    if (spec.duracion != null && fin > end + 0.05) M.warn(`Escena ${i + 1} (${spec.tipo}): su animación dura ${(fin - start).toFixed(1)} s pero "duracion" es ${spec.duracion}s; se corta.`);
    if (clip.ritmo?.bpm) { // cae en el pulso de la música (tiempo real)
      const beat = 60 / clip.ritmo.bpm, off = clip.ritmo.desfase ?? 0, real = end / speed;
      end = (off + Math.max(1, Math.round((real - off) / beat + 0.25)) * beat) * speed;
    }
    S.end = end; S.full = res.lleno != null ? Math.min(res.lleno, end - 0.02) : Math.min(fin + 0.15, end - 0.05);
    if (prev) transition(M, tName, prev, S, start, td, prev.spec.transicionOpc || {});
    // cámara: acercamiento lento + sacudidas
    const zoom = spec.camara === false || res.camara === false ? 0 : (typeof spec.camara === 'number' ? spec.camara : 0.035);
    M.every(T => {
      const vis = T >= S.start - 1e-6 && T < S.end;
      wrap.style.display = vis ? '' : 'none';
      if (!vis) return;
      const k = 1 + zoom * clamp((T - S.start) / (S.end - S.start), 0, 1);
      cam.setAttribute('transform', `translate(${(W / 2 + S.shk.x).toFixed(2)},${(H / 2 + S.shk.y).toFixed(2)}) scale(${k.toFixed(5)}) translate(${-W / 2},${-H / 2})`);
    });
    M.scenes.push(S);
    prev = S;
  }
  const last = M.scenes[M.scenes.length - 1];
  if (clip.cierre === 'fundido') M.to(last.wp, { o: 0, duration: 0.45, ease: 'none' }, last.end - 0.45);
  const DUR = last.end;

  // grano de papel encima de todo (solo con fondo opaco)
  if (!alpha && !croma && style.grano > 0) el('rect', { width: W, height: H, filter: 'url(#av-grano)', opacity: style.grano, 'pointer-events': 'none' }, layers.grain);

  // "hervor" de líneas dibujadas a mano: cambia la semilla del ruido ~8 veces por segundo
  const boilT = defs.querySelector('#av-boilT'), tizaT = defs.querySelector('#av-tizaT');
  M.every(T => { const s = 1 + (Math.floor(T * 8) % 5); boilT.setAttribute('seed', s); tizaT.setAttribute('seed', s); });
  M.every(DR.toolUpdater(M, tools));

  function renderAt(real) {
    const T = clamp(real * speed, 0, DUR - 1e-4);
    tl.seek(T, true);
    for (const f of updaters) f(T);
  }
  // inicializa todos los tweens en orden (evita saltos al hacer seek hacia atrás)
  tl.seek(tl.duration(), true); tl.seek(0, true);
  renderAt(0);

  window.renderAt = renderAt;
  window.INFO = {
    nombre: clip.nombre || 'clip', W, H, fps: M.fps, alfa: alpha, croma, duracion: DUR / speed, estilo: style.id,
    escenas: M.scenes.map(S => ({ n: S.i + 1, tipo: S.spec.tipo, inicio: +(S.start / speed).toFixed(3), fin: +(S.end / speed).toFixed(3), lleno: +(S.full / speed).toFixed(3), titulo: S.spec.titulo || S.spec.texto || S.spec.nombre || '' })),
    sfx: M._sfx.filter(e => e.t / speed < DUR / speed).map(e => ({ ...e, t: +(e.t / speed).toFixed(4), dur: e.dur != null ? e.dur / speed : null })),
    avisos: M.warnings,
  };
  window.READY = true;
  return M;
}
