// animaciones-video · reproductor de vista previa (solo en el navegador, no afecta el render)
import { el } from './util.js';

export function player(M) {
  const I = window.INFO, D = I.duracion, svg = M.svg;
  const css = document.createElement('style');
  css.textContent = `
    #avp-bar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;padding:10px 16px;background:#0e0e11ee;border-top:1px solid #2a2a30;flex-wrap:wrap}
    #avp-bar button{background:#2a2a33;color:#fff;border:0;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit}
    #avp-bar button:hover{background:#3a3a46} #avp-bar input[type=range]{flex:1;min-width:200px;accent-color:#8b5cf6}
    #avp-time{font-variant-numeric:tabular-nums;min-width:110px;text-align:right;color:#bbb}
    #avp-scenes{display:flex;gap:6px;flex-wrap:wrap;width:100%} #avp-scenes button{padding:4px 9px;font-size:12px;background:#1f1f26}
    #avp-scenes button.on{background:#8b5cf6} #avp-warn{color:#ffcf70;font-size:12px;width:100%}`;
  document.head.appendChild(css);
  const bar = document.createElement('div'); bar.id = 'avp-bar';
  bar.innerHTML = `<button id="avp-play">▶︎ Reproducir</button><input id="avp-seek" type="range" min="0" max="${D}" step="0.001" value="0">
    <span id="avp-time"></span><button id="avp-guia" title="Tecla G">Zona segura</button><button id="avp-loop">Repetir: sí</button>
    <div id="avp-scenes"></div>${I.avisos.length ? `<div id="avp-warn">⚠ ${I.avisos.join(' · ')}</div>` : ''}`;
  document.body.appendChild(bar);
  const $ = id => document.getElementById(id);
  const sc = $('avp-scenes');
  I.escenas.forEach(s => { const b = document.createElement('button'); b.textContent = `${s.n}. ${s.tipo}`; b.title = s.titulo; b.onclick = () => go(s.inicio + 0.01); sc.appendChild(b); });

  // guía de zona segura (UI de Reels/TikTok)
  const S0 = M.safe;
  const guide = el('rect', { x: S0.x, y: S0.y, width: S0.w, height: S0.h, fill: 'none', stroke: '#00E5FF', 'stroke-width': 3 * M.u, 'stroke-dasharray': `${14 * M.u} ${10 * M.u}` }, M.layers.guides);
  M.layers.guides.style.display = 'none';
  const toggleGuide = () => { M.layers.guides.style.display = M.layers.guides.style.display === 'none' ? '' : 'none'; };
  $('avp-guia').onclick = toggleGuide;
  void guide;

  const fit = () => {
    const k = Math.min((innerWidth - 40) / M.W, (innerHeight - bar.offsetHeight - 30) / M.H);
    svg.style.width = (M.W * k) + 'px'; svg.style.height = (M.H * k) + 'px'; svg.style.marginBottom = bar.offsetHeight + 'px';
  };
  addEventListener('resize', fit); fit();

  let t = 0, playing = false, loop = true, t0 = 0, p0 = 0;
  const show = () => {
    window.renderAt(t);
    $('avp-seek').value = t; $('avp-time').textContent = `${t.toFixed(2)} / ${D.toFixed(2)} s`;
    const cur = I.escenas.findIndex(s => t >= s.inicio && t < s.fin);
    [...sc.children].forEach((b, i) => b.classList.toggle('on', i === cur));
  };
  const go = v => { t = Math.max(0, Math.min(D - 0.001, v)); if (playing) { t0 = performance.now(); p0 = t; } show(); };
  const setPlay = v => { playing = v; $('avp-play').textContent = v ? '❚❚ Pausa' : '▶︎ Reproducir'; if (v) { if (t >= D - 0.01) t = 0; t0 = performance.now(); p0 = t; requestAnimationFrame(tick); } };
  const tick = () => {
    if (!playing) return;
    t = p0 + (performance.now() - t0) / 1000;
    if (t >= D) { if (loop) { t0 = performance.now(); p0 = 0; t = 0; } else { t = D - 0.001; setPlay(false); } }
    show(); requestAnimationFrame(tick);
  };
  $('avp-play').onclick = () => setPlay(!playing);
  $('avp-seek').oninput = e => go(+e.target.value);
  $('avp-loop').onclick = () => { loop = !loop; $('avp-loop').textContent = `Repetir: ${loop ? 'sí' : 'no'}`; };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
    if (e.key === 'ArrowRight') go(t + (e.shiftKey ? 1 : 1 / I.fps));
    if (e.key === 'ArrowLeft') go(t - (e.shiftKey ? 1 : 1 / I.fps));
    if (e.key.toLowerCase() === 'g') toggleGuide();
  });
  const q = new URLSearchParams(location.search);
  if (q.has('t')) go(+q.get('t')); else { show(); setPlay(true); }
}
