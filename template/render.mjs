#!/usr/bin/env node
// animaciones-video · render determinista cuadro por cuadro → MP4 / MOV con alfa / WebM / PNG / GIF + pista de efectos.
//
//   node render.mjs clips/mi-clip.js                 video final (MP4, o MOV+WebM si el fondo es transparente)
//   node render.mjs clips/mi-clip.js --escenas       QA: una foto por escena + hoja de contacto
//   node render.mjs clips/mi-clip.js --cada 0.5      QA: una foto cada 0.5 s + hoja de contacto
//   node render.mjs clips/mi-clip.js --fotos 1.2,3   QA: fotos en esos segundos
//
// Opciones: --formato 9:16|16:9|1:1|4:5  --fps 30|60  --alfa  --croma  --png  --gif  --borrador
//           --musica audio/tema.mp3 [--volumen-musica 0.35]  --sin-audio  --desde 2 --hasta 6
//           --trabajadores 3  --salida carpeta
import { mkdir, rm, writeFile, rename, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { startServer } from './lib/server.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { synthSfx } from './lib/sfx.mjs';

const argv = process.argv.slice(2);
const flag = k => argv.includes('--' + k);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const clipArg = argv.find(a => !a.startsWith('--') && /\.m?js$/.test(a));
if (!clipArg) { console.error('Uso: node render.mjs clips/mi-clip.js [opciones]   (ver cabecera de render.mjs)'); process.exit(1); }
try { await access('index.html'); } catch { console.error('Ejecuta render.mjs desde la carpeta del proyecto (donde está index.html).'); process.exit(1); }

const run = (cmd, args) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('error', e => rej(new Error(`No pude ejecutar ${cmd}: ${e.message}. ¿Está instalado ffmpeg?`)));
  p.on('close', c => c === 0 ? res() : rej(new Error(`${cmd} terminó con código ${c}`)));
});
const ff = args => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args]);

const alphaReq = flag('alfa'), croma = flag('croma'), draft = flag('borrador');
const params = new URLSearchParams({ render: '1', clip: clipArg.replace(/\\/g, '/') });
if (opt('formato')) params.set('formato', opt('formato'));
if (opt('fps')) params.set('fps', opt('fps'));
if (alphaReq) params.set('alfa', '1');
if (croma) params.set('croma', '1');
if (opt('estilo')) params.set('estilo', opt('estilo'));

const srv = await startServer(process.cwd());
const browser = await launchBrowser();
const scale = draft ? 0.5 : 1;

async function openPage(viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  page.on('pageerror', e => console.error('ERROR EN LA PÁGINA:', e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.error(`[navegador] ${m.text()}`); });
  await page.goto(`${srv.url}/index.html?${params}`);
  await page.waitForFunction(() => window.READY === true || window.BOOT_ERROR, null, { timeout: 90000 });
  const err = await page.evaluate(() => window.BOOT_ERROR);
  if (err) { console.error('\n' + err); await browser.close(); srv.close(); process.exit(1); }
  return page;
}

let page = await openPage();
const INFO = await page.evaluate(() => window.INFO);
await page.setViewportSize({ width: INFO.W, height: INFO.H });
const alpha = INFO.alfa;
const fps = draft ? Math.min(INFO.fps, 15) : INFO.fps;
const outDir = path.resolve(opt('salida', path.join('salida', INFO.nombre)));
await mkdir(outDir, { recursive: true });
const base = path.join(outDir, INFO.nombre);
if (INFO.avisos.length) console.warn('⚠ Avisos:\n  - ' + INFO.avisos.join('\n  - '));
console.log(`${INFO.nombre}: ${INFO.W}×${INFO.H}${draft ? ' (borrador ½)' : ''} · ${INFO.duracion.toFixed(2)} s · ${fps} fps · estilo ${INFO.estilo}${alpha ? ' · fondo transparente' : ''}${croma ? ' · croma verde' : ''}`);
const shot = (pg, type) => pg.screenshot({ type, quality: type === 'jpeg' ? 94 : undefined, omitBackground: alpha, clip: { x: 0, y: 0, width: INFO.W, height: INFO.H }, animations: 'disabled', caret: 'initial' });

/* ---------- QA: fotos ---------- */
let times = null;
if (flag('escenas')) times = INFO.escenas.map(s => s.lleno);
if (opt('cada')) { times = []; for (let x = 0.2; x < INFO.duracion; x += Number(opt('cada'))) times.push(+x.toFixed(3)); }
if (opt('fotos')) times = opt('fotos').split(',').map(Number);
if (times) {
  const qa = path.join(outDir, 'qa');
  await rm(qa, { recursive: true, force: true }); await mkdir(qa, { recursive: true });
  if (alpha) await page.evaluate(() => { document.documentElement.style.background = '#7a7a7a'; document.body.style.background = '#7a7a7a'; });
  const list = [];
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.renderAt(t), times[i]);
    const f = path.join(qa, `f-${String(i + 1).padStart(3, '0')}.jpg`);
    await writeFile(f, await page.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: INFO.W, height: INFO.H } }));
    list.push(`${path.basename(f)}  t=${times[i].toFixed(2)}s`);
  }
  const cols = Math.min(times.length, INFO.W > INFO.H ? 3 : 5), rows = Math.ceil(times.length / cols);
  const tw = INFO.W > INFO.H ? 640 : 300;
  await ff(['-framerate', '1', '-i', path.join(qa, 'f-%03d.jpg'), '-vf', `scale=${tw}:-2,pad=iw+8:ih+8:4:4:white,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', path.join(qa, 'contacto.jpg')]);
  await writeFile(path.join(qa, 'indice.txt'), list.join('\n') + '\n');
  console.log(`QA listo: ${times.length} fotos → ${path.relative(process.cwd(), qa)}/ (abre contacto.jpg)`);
  await browser.close(); srv.close(); process.exit(0);
}

/* ---------- video ---------- */
const from = Number(opt('desde', 0)), to = Math.min(Number(opt('hasta', INFO.duracion)), INFO.duracion);
const f0 = Math.floor(from * fps), f1 = Math.ceil(to * fps);
const total = f1 - f0;
const imgType = alpha || flag('png') ? 'png' : 'jpeg';
const ext = imgType === 'png' ? 'png' : 'jpg';
const frames = path.join(outDir, '.cuadros');
await rm(frames, { recursive: true, force: true }); await mkdir(frames, { recursive: true });
const nW = Math.max(1, Math.min(Number(opt('trabajadores', Math.min(4, Math.max(1, os.cpus().length - 1)))), Math.ceil(total / 30)));
const pages = [page];
for (let i = 1; i < nW; i++) { const p = await openPage({ width: INFO.W, height: INFO.H }); pages.push(p); }
const t0 = Date.now(); let done = 0, lastLog = 0;
const chunk = Math.ceil(total / nW);
await Promise.all(pages.map(async (pg, w) => {
  const a = f0 + w * chunk, b = Math.min(f1, a + chunk);
  for (let f = a; f < b; f++) {
    await pg.evaluate(t => window.renderAt(t), f / fps);
    await writeFile(path.join(frames, `${String(f - f0).padStart(6, '0')}.${ext}`), await shot(pg, imgType));
    done++;
    if (Date.now() - lastLog > 3000) { lastLog = Date.now(); const s = (Date.now() - t0) / 1000; console.log(`  cuadros ${done}/${total} · ${s.toFixed(0)} s · faltan ~${((total - done) * s / done).toFixed(0)} s`); }
  }
}));
await browser.close(); srv.close();
console.log(`cuadros listos en ${((Date.now() - t0) / 1000).toFixed(1)} s`);

// audio: efectos sintetizados (+ música opcional)
const dur = total / fps;
let audio = null;
const shifted = INFO.sfx.filter(e => e.t >= from && e.t < to).map(e => ({ ...e, t: e.t - from }));
if (!flag('sin-audio') && (shifted.length || opt('musica'))) {
  const sfxWav = `${base}-sfx.wav`;
  await writeFile(sfxWav, synthSfx(shifted, dur));
  audio = sfxWav;
  if (opt('musica')) {
    const mix = `${base}-audio.wav`, vol = opt('volumen-musica', '0.35');
    await ff(['-i', sfxWav, '-i', opt('musica'), '-filter_complex',
      `[1:a]volume=${vol},afade=t=out:st=${Math.max(0, dur - 1.5).toFixed(2)}:d=1.5[m];[0:a][m]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
      '-map', '[a]', '-ar', '48000', '-t', dur.toFixed(3), mix]);
    audio = mix;
  }
}

const seq = ['-framerate', String(fps), '-i', path.join(frames, `%06d.${ext}`)];
const even = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
const outputs = [];
if (alpha) {
  await ff([...seq, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-alpha_bits', '16', `${base}.mov`]);
  outputs.push(`${base}.mov  (ProRes 4444 con transparencia: Premiere, DaVinci, Final Cut, After Effects)`);
  if (!flag('sin-webm')) {
    await ff([...seq, '-vf', even, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', draft ? '38' : '30', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-auto-alt-ref', '0', `${base}.webm`]);
    outputs.push(`${base}.webm (VP9 con transparencia: web, OBS, editores que lean WebM)`);
  }
} else {
  const a = audio ? ['-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : [];
  await ff([...seq, ...a, '-vf', even, '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '26' : '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}.mp4`]);
  outputs.push(`${base}.mp4  (H.264${audio ? ' + audio' : ''})`);
}
if (audio && alpha) outputs.push(`${audio}  (efectos de sonido para poner en tu editor)`);
if (flag('gif')) {
  const pal = alpha ? 'palettegen=reserve_transparent=1:stats_mode=diff' : 'palettegen=stats_mode=diff';
  const use = alpha ? 'paletteuse=alpha_threshold=128:dither=bayer:bayer_scale=4' : 'paletteuse=dither=bayer:bayer_scale=4';
  await ff([...seq, '-vf', `fps=15,scale=${INFO.W > INFO.H ? 640 : 400}:-1:flags=lanczos,split[a][b];[a]${pal}[p];[b][p]${use}`, '-loop', '0', `${base}.gif`]);
  outputs.push(`${base}.gif  (vista previa ligera)`);
}
if (flag('png')) {
  const dst = `${base}-png`;
  await rm(dst, { recursive: true, force: true }); await rename(frames, dst);
  outputs.push(`${dst}/  (${total} PNG numerados${alpha ? ' con transparencia' : ''})`);
} else await rm(frames, { recursive: true, force: true });

await writeFile(`${base}-marcas.json`, JSON.stringify({ nombre: INFO.nombre, ancho: INFO.W, alto: INFO.H, fps, duracion: dur, desde: from, escenas: INFO.escenas }, null, 2));
console.log('\nLISTO:\n  ' + outputs.map(o => path.relative(process.cwd(), o.split('  ')[0]) + '  ' + (o.split('  ')[1] || '')).join('\n  '));
console.log(`  ${path.relative(process.cwd(), base)}-marcas.json  (inicio y fin de cada escena, para tu línea de tiempo)`);
