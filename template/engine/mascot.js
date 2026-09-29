// animaciones-video · mascota "Tinta": personaje simple que actúa (entra, saluda, señala, salta, celebra, piensa, habla)
import { el, clamp, mix } from './util.js';
import { confetti } from './draw.js';

let OUT = '#1E1B18';

/* Crea la mascota con los pies en (x, y) de `parent`.
 * o: { escala, color, imagen:{url,w,h} (logo/personaje propio en PNG), mirar: 1|-1 }
 */
export function mascot(M, S, parent, x, y, o = {}) {
  const k = (o.escala ?? 1) * M.u;
  const color = o.color ?? S.col.acento;
  OUT = S.col.oscuro ? mix(color, '#000000', 0.62) : '#1E1B18';
  const shadowG = el('g', {}, parent);
  const sh = el('ellipse', { cx: 0, cy: 0, rx: 100 * k, ry: 13 * k, fill: '#000', opacity: 0.16 }, shadowG);
  const root = el('g', {}, parent);
  const R = M.anim(root, { bx: x, by: y, pivot: [0, 0], s: 0, o: 1 });
  const shA = M.anim(shadowG, { bx: x, by: y + 2 * k, pivot: [0, 0], s: 0 });
  const kg = el('g', { transform: `scale(${k})` }, root);
  const rig = { M, S, root, R, shA, k, x, y, color, mouthEv: [{ t: -1, m: 'sonrisa' }], talk: [], look: { x: 0, y: 0, s: 1 }, parent };

  if (o.imagen) {
    const h = 300, w = (o.imagen.w / o.imagen.h) * h;
    const ig = el('g', {}, kg);
    el('image', { href: o.imagen.url, x: -w / 2, y: -h, width: w, height: h }, ig);
    rig.body = M.anim(ig, { pivot: [0, 0] });
    rig.armL = rig.armR = { r: 0 }; rig.custom = true;
    rig.height = 300 * k; rig.headY = -300 * k; rig.mouthY = -150 * k;
    return withActions(rig);
  }

  // piernas
  el('path', { d: 'M-42,-44 L-46,-8 M42,-44 L46,-8', stroke: OUT, 'stroke-width': 11, 'stroke-linecap': 'round' }, kg);
  el('ellipse', { cx: -52, cy: -4, rx: 24, ry: 10, fill: OUT }, kg);
  el('ellipse', { cx: 52, cy: -4, rx: 24, ry: 10, fill: OUT }, kg);
  // brazos (detrás del cuerpo)
  const armG = (side) => {
    const g = el('g', {}, kg);
    const sx = side * 100;
    el('path', { d: `M${sx},-150 C${sx + side * 26},-140 ${sx + side * 38},-118 ${sx + side * 40},-92`, stroke: OUT, 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: sx + side * 40, cy: -88, r: 15, fill: color, stroke: OUT, 'stroke-width': 5 }, g);
    return M.anim(g, { pivot: [sx, -150] });
  };
  rig.armL = armG(-1); rig.armR = armG(1);
  // cuerpo (respira)
  const bodyG = el('g', {}, kg);
  rig.body = M.anim(bodyG, { pivot: [0, -30] });
  const breath = el('g', {}, bodyG);
  el('path', { d: 'M0,-282 C74,-282 120,-226 120,-150 C120,-72 76,-28 0,-28 C-76,-28 -120,-72 -120,-150 C-120,-226 -74,-282 0,-282 Z', fill: color, stroke: OUT, 'stroke-width': 7 }, breath);
  el('ellipse', { cx: -52, cy: -232, rx: 24, ry: 11, fill: '#FFFFFF', opacity: 0.35, transform: 'rotate(-32 -52 -232)' }, breath);
  // cara
  const face = el('g', {}, breath);
  const eye = (cx) => {
    const g = el('g', {}, face);
    el('ellipse', { cx, cy: -178, rx: 25, ry: 30, fill: '#FFFFFF', stroke: OUT, 'stroke-width': 5 }, g);
    const pg = el('g', {}, g);
    el('circle', { cx: cx + 3, cy: -173, r: 12.5, fill: OUT }, pg);
    el('circle', { cx: cx - 1, cy: -178, r: 4, fill: '#FFFFFF' }, pg);
    return { g, pg, cx };
  };
  const eyes = [eye(-40), eye(40)];
  el('ellipse', { cx: -76, cy: -128, rx: 16, ry: 9, fill: '#FF8FA3', opacity: 0.55 }, face);
  el('ellipse', { cx: 76, cy: -128, rx: 16, ry: 9, fill: '#FF8FA3', opacity: 0.55 }, face);
  const mouths = {
    sonrisa: el('path', { d: 'M-24,-130 C-12,-112 12,-112 24,-130', stroke: OUT, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, face),
    abierta: el('path', { d: 'M-27,-133 C-23,-100 23,-100 27,-133 Z', fill: '#5A1E1E', stroke: OUT, 'stroke-width': 5, 'stroke-linejoin': 'round' }, face),
    o: el('ellipse', { cx: 0, cy: -118, rx: 11, ry: 14, fill: '#5A1E1E', stroke: OUT, 'stroke-width': 5 }, face),
    triste: el('path', { d: 'M-22,-110 C-10,-127 10,-127 22,-110', stroke: OUT, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, face),
    plana: el('path', { d: 'M-18,-120 L18,-120', stroke: OUT, 'stroke-width': 6, 'stroke-linecap': 'round' }, face),
  };
  rig.height = 290 * k; rig.headY = -282 * k; rig.mouthY = -120 * k;

  const blinkOff = (o.seed ?? 0) * 0.77;
  M.every(T => {
    // respiración
    const br = 1 + Math.sin((T + blinkOff) * 3.9) * 0.018;
    breath.setAttribute('transform', `translate(0,-30) scale(${(2 - br).toFixed(4)},${br.toFixed(4)}) translate(0,30)`);
    // parpadeo cada ~3.1 s
    const ph = ((T + blinkOff) % 3.1) / 0.16;
    const bl = ph < 1 ? 1 - Math.sin(ph * Math.PI) * 0.92 : 1;
    eyes.forEach(e => {
      e.g.setAttribute('transform', `translate(${e.cx},-178) scale(${rig.look.s},${(bl * rig.look.s).toFixed(3)}) translate(${-e.cx},178)`);
      e.pg.setAttribute('transform', `translate(${rig.look.x * 9},${rig.look.y * 10})`);
    });
    // boca
    let m = 'sonrisa';
    for (const ev of rig.mouthEv) if (ev.t <= T) m = ev.m;
    for (const [a, b] of rig.talk) if (T >= a && T <= b) m = Math.floor(T * 9) % 3 === 0 ? 'sonrisa' : Math.floor(T * 9) % 3 === 1 ? 'abierta' : 'o';
    for (const key in mouths) mouths[key].style.display = key === m ? '' : 'none';
  });
  return withActions(rig);
}

function withActions(rig) {
  const { M, R, shA } = rig;
  rig.cara = (m, t) => { rig.mouthEv.push({ t, m }); rig.mouthEv.sort((a, b) => a.t - b.t); };
  rig.hablar = (a, b) => rig.talk.push([a, b]);
  rig.entrar = (t) => {
    M.to(R, { s: 1, duration: 0.5, ease: 'back.out(1.9)' }, t);
    M.to(shA, { s: 1, duration: 0.4, ease: 'power2.out' }, t);
    R.y = 70 * M.u; M.to(R, { y: 0, duration: 0.45, ease: 'power3.out' }, t);
    M.sfx('burbuja', t, { vol: 0.7 });
    return t + 0.5;
  };
  rig.salir = (t) => { M.to(R, { s: 0, duration: 0.3, ease: 'back.in(2)' }, t); M.to(shA, { s: 0, duration: 0.3 }, t); return t + 0.3; };
  rig.saltar = (t, n = 1, h = 120) => {
    let at = t;
    for (let i = 0; i < n; i++) {
      M.to(R, { sy: 0.86, sx: 1.1, duration: 0.1, ease: 'power2.out' }, at);
      M.to(R, { sy: 1.08, sx: 0.94, y: -h * M.u, duration: 0.24, ease: 'power2.out' }, at + 0.1);
      M.to(shA, { s: 0.6, duration: 0.24 }, at + 0.1);
      M.to(R, { y: 0, sy: 1, sx: 1, duration: 0.22, ease: 'power2.in' }, at + 0.34);
      M.to(shA, { s: 1, duration: 0.22 }, at + 0.34);
      M.to(R, { sy: 0.9, sx: 1.07, duration: 0.07 }, at + 0.56);
      M.to(R, { sy: 1, sx: 1, duration: 0.25, ease: 'elastic.out(1,0.4)' }, at + 0.63);
      M.sfx('salto', at + 0.1, { vol: 0.6 });
      at += 0.75;
    }
    return at;
  };
  rig.saludar = (t) => {
    rig.cara('abierta', t); rig.cara('sonrisa', t + 1.2);
    M.to(rig.armR, { r: -125, duration: 0.25, ease: 'back.out(2)' }, t);
    for (let i = 0; i < 4; i++) M.to(rig.armR, { r: i % 2 ? -125 : -95, duration: 0.16, ease: 'sine.inOut' }, t + 0.25 + i * 0.16);
    M.to(rig.armR, { r: 0, duration: 0.3, ease: 'power2.inOut' }, t + 0.95);
    if (rig.custom) { M.to(R, { r: 8, duration: 0.2, yoyo: true, repeat: 3 }, t); }
    return t + 1.25;
  };
  rig.senalar = (t, dir = 1, hold = 1.2, ang = 58) => {
    const arm = dir > 0 ? rig.armR : rig.armL;
    M.to(arm, { r: dir * -ang, duration: 0.25, ease: 'back.out(2.5)' }, t);
    M.to(rig.body, { r: dir * 5, duration: 0.3 }, t);
    M.to(rig.look, { x: dir, y: -0.5, duration: 0.2 }, t);
    M.to(arm, { r: 0, duration: 0.3 }, t + hold);
    M.to(rig.body, { r: 0, duration: 0.3 }, t + hold);
    M.to(rig.look, { x: 0, y: 0, duration: 0.2 }, t + hold);
    return t + 0.35;
  };
  rig.celebrar = (t) => {
    rig.cara('abierta', t); rig.cara('sonrisa', t + 1.6);
    M.to(rig.armR, { r: -150, duration: 0.2 }, t); M.to(rig.armL, { r: 150, duration: 0.2 }, t);
    confetti(M, rig.parent, rig.x, rig.y + rig.headY, t + 0.1);
    const end = rig.saltar(t, 2, 90);
    M.to(rig.armR, { r: 0, duration: 0.3 }, end); M.to(rig.armL, { r: 0, duration: 0.3 }, end);
    return end;
  };
  rig.pensar = (t, hold = 1.4) => {
    rig.cara('plana', t); rig.cara('sonrisa', t + hold);
    M.to(rig.look, { x: -0.7, y: -0.9, duration: 0.25 }, t);
    M.to(rig.armL, { r: 95, duration: 0.3 }, t);
    M.to(rig.body, { r: -4, duration: 0.3 }, t);
    M.to(rig.look, { x: 0, y: 0, duration: 0.25 }, t + hold);
    M.to(rig.armL, { r: 0, duration: 0.3 }, t + hold);
    M.to(rig.body, { r: 0, duration: 0.3 }, t + hold);
    return t + 0.4;
  };
  rig.sorpresa = (t) => {
    rig.cara('o', t); rig.cara('sonrisa', t + 1.2);
    M.to(rig.look, { s: 1.22, duration: 0.12, ease: 'back.out(3)' }, t);
    M.to(rig.look, { s: 1, duration: 0.3 }, t + 1.1);
    M.to(R, { y: -40 * M.u, duration: 0.14, ease: 'power2.out' }, t);
    M.to(R, { y: 0, duration: 0.2, ease: 'bounce.out' }, t + 0.14);
    M.to(rig.armR, { r: -40, duration: 0.15 }, t); M.to(rig.armL, { r: 40, duration: 0.15 }, t);
    M.to(rig.armR, { r: 0, duration: 0.3 }, t + 1.0); M.to(rig.armL, { r: 0, duration: 0.3 }, t + 1.0);
    M.sfx('sorpresa', t, { vol: 0.6 });
    return t + 0.5;
  };
  rig.triste = (t, hold = 1.4) => { rig.cara('triste', t); rig.cara('sonrisa', t + hold); M.to(rig.look, { y: 0.8, duration: 0.3 }, t); M.to(rig.look, { y: 0, duration: 0.3 }, t + hold); return t + 0.4; };
  rig.feliz = (t) => { rig.cara('abierta', t); rig.cara('sonrisa', t + 1); return rig.saltar(t, 1, 60); };
  rig.accion = (nombre, t, dir) => {
    const fn = { saludar: rig.saludar, senalar: tt => rig.senalar(tt, dir), saltar: tt => rig.saltar(tt, 2), celebrar: rig.celebrar, pensar: rig.pensar, sorpresa: rig.sorpresa, triste: rig.triste, feliz: rig.feliz, hablar: tt => tt, ninguna: tt => tt }[nombre];
    if (!fn) throw new Error(`Acción de mascota desconocida "${nombre}" (saludar, senalar, saltar, celebrar, pensar, sorpresa, triste, feliz, hablar)`);
    return fn(t);
  };
  return rig;
}
