// Efectos de sonido sintetizados con código (sin archivos ni licencias de terceros).
// synthSfx(eventos, duración) → Buffer WAV estéreo 48 kHz / 16 bits.
const SR = 48000;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const buf = sec => new Float32Array(Math.max(1, Math.ceil(sec * SR)));
const TAU = Math.PI * 2;

// filtro de estado variable: devuelve pasa-banda (o pasa-bajo) con frecuencia que puede variar en el tiempo
function svf(x, fc, damp = 0.8, mode = 'band') {
  const y = new Float32Array(x.length); let low = 0, band = 0;
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(0.45 * SR, typeof fc === 'function' ? fc(i / SR) : fc) / SR);
    const high = x[i] - low - damp * band; band += f * high; low += f * band;
    y[i] = mode === 'low' ? low : mode === 'high' ? high : band;
  }
  return y;
}
function noise(sec, r) { const b = buf(sec); for (let i = 0; i < b.length; i++) b[i] = r() * 2 - 1; return b; }
function sweep(sec, f0, f1, env, shape = 'sin') {
  const b = buf(sec); let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR, k = t / sec, f = f0 * Math.pow(f1 / f0, k);
    ph += TAU * f / SR;
    const s = shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
    b[i] = s * env(t, k);
  }
  return b;
}
const expEnv = (tau, att = 0.002) => t => (t < att ? t / att : Math.exp(-(t - att) / tau));

// "rayones" de plumón/tiza/lápiz: ruido filtrado con ráfagas irregulares
function scribble(sec, r, { f0, f1, gain, grit = 0 }) {
  const n = noise(sec, r);
  const fc = t => f0 + (f1 - f0) * (0.5 + 0.5 * Math.sin(t * 23 + r() * 0.01));
  const y = svf(svf(n, fc, 0.22), 900, 0.7, 'high');
  // envolvente de trazos: pulsos de 60–140 ms
  const env = buf(sec); let t = 0;
  while (t < sec) {
    const len = 0.06 + r() * 0.08, amp = 0.55 + r() * 0.45;
    const a = Math.floor(t * SR), b = Math.min(env.length, Math.floor((t + len) * SR));
    for (let i = a; i < b; i++) { const k = (i - a) / (b - a); env[i] = Math.max(env[i], amp * Math.sin(Math.PI * k) ** 0.6); }
    t += len * (0.75 + r() * 0.4);
  }
  for (let i = 0; i < y.length; i++) {
    let v = y[i] * env[i];
    if (grit && r() < grit) v += (r() - 0.5) * 0.9 * env[i];
    const edge = Math.min(1, i / (0.02 * SR), (y.length - i) / (0.03 * SR));
    y[i] = v * gain * edge;
  }
  return y;
}

const SYN = {
  pop: (e, r) => sweep(0.1, 900 * e.tono, 280 * e.tono, expEnv(0.028)).map(v => v * 0.55),
  burbuja: (e, r) => sweep(0.14, 280 * e.tono, 1100 * e.tono, (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.1)) * (1 - k)).map(v => v * 0.45),
  salto: (e, r) => sweep(0.18, 200 * e.tono, 720 * e.tono, (t, k) => Math.sin(Math.PI * k) * 0.9, 'tri').map(v => v * 0.35),
  sorpresa: (e, r) => sweep(0.22, 600, 1600, (t, k) => Math.sin(Math.PI * k), 'tri').map(v => v * 0.2),
  whoosh: (e, r) => {
    const d = Math.max(0.25, e.dur ?? 0.5) * 1.1, n = noise(d, r);
    const y = svf(n, t => (350 + 2600 * Math.sin(Math.PI * Math.min(1, t / d))) * e.tono, 0.9);
    return y.map((v, i) => v * Math.sin(Math.PI * (i / y.length)) ** 1.6 * 0.55);
  },
  escritura: (e, r) => scribble(Math.max(0.15, e.dur ?? 0.5), r, { f0: 2600, f1: 4200, gain: 0.12 }),
  tiza: (e, r) => scribble(Math.max(0.15, e.dur ?? 0.5), r, { f0: 1700, f1: 3300, gain: 0.13, grit: 0.004 }),
  lapiz: (e, r) => scribble(Math.max(0.15, e.dur ?? 0.5), r, { f0: 4500, f1: 6500, gain: 0.1 }),
  resaltador: (e, r) => scribble(Math.max(0.2, e.dur ?? 0.35), r, { f0: 1400, f1: 2100, gain: 0.12 }),
  borrador: (e, r) => {
    const d = Math.max(0.3, e.dur ?? 0.8), y = svf(noise(d, r), 700, 0.7, 'low');
    return y.map((v, i) => { const t = i / SR; return v * (0.55 + 0.45 * Math.abs(Math.sin(t * 13))) * Math.min(1, t / 0.05, (d - t) / 0.08) * 0.9; });
  },
  tecla: (e, r) => {
    const d = Math.max(0.1, e.dur ?? 0.5), n = Math.max(1, e.n ?? Math.round(d * 20)), out = buf(d + 0.1);
    for (let k = 0; k < n; k++) {
      const at = Math.floor(((k + r() * 0.35) / n) * d * SR);
      const click = svf(noise(0.012, r), 3200 + r() * 1500, 0.6, 'high');
      const th = sweep(0.02, 190, 120, expEnv(0.006));
      for (let i = 0; i < click.length && at + i < out.length; i++) out[at + i] += click[i] * Math.exp(-i / (0.0025 * SR)) * 0.5 + (th[i] || 0) * 0.35;
    }
    return out;
  },
  click: (e, r) => {
    const out = buf(0.12);
    [0, 0.055].forEach((s, j) => { const c = svf(noise(0.01, r), 2600, 0.5, 'high'); const at = Math.floor(s * SR); c.forEach((v, i) => { out[at + i] += v * Math.exp(-i / (0.0018 * SR)) * (j ? 0.45 : 0.75); }); });
    return out;
  },
  ding: (e, r) => {
    const d = 0.9, b = buf(d), f = 1318 * e.tono;
    for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(TAU * f * t) + 0.45 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t / 0.15) + 0.2 * Math.sin(TAU * f * 3.02 * t) * Math.exp(-t / 0.08)) * Math.exp(-t / 0.28) * Math.min(1, t / 0.003) * 0.26; }
    return b;
  },
  exito: (e, r) => {
    const out = buf(0.9);
    [[1047, 0], [1568, 0.1], [2093, 0.2]].forEach(([f, s]) => { const at = Math.floor(s * SR); for (let i = 0; at + i < out.length; i++) { const t = i / SR; out[at + i] += Math.sin(TAU * f * t) * Math.exp(-t / 0.2) * Math.min(1, t / 0.003) * 0.18; } });
    return out;
  },
  error: (e, r) => {
    const out = buf(0.35);
    [[330, 0], [247, 0.12]].forEach(([f, s]) => { const at = Math.floor(s * SR); for (let i = 0; i < 0.16 * SR && at + i < out.length; i++) { const t = i / SR; out[at + i] += (2 / Math.PI) * Math.asin(Math.sin(TAU * f * t)) * Math.exp(-t / 0.08) * 0.16; } });
    return svf(out, 2500, 0.9, 'low');
  },
  golpe: (e, r) => {
    const d = 0.35, b = sweep(d, 120, 42, expEnv(0.09)), n = svf(noise(d, r), 900, 0.8, 'low');
    return b.map((v, i) => (v * 0.8 + n[i] * Math.exp(-i / (0.03 * SR)) * 0.9) * 0.8);
  },
  conteo: (e, r) => {
    const d = Math.max(0.3, e.dur ?? 1), out = buf(d + 0.05); let t = 0, k = 0;
    while (t < d) { const at = Math.floor(t * SR); for (let i = 0; i < 0.012 * SR && at + i < out.length; i++) out[at + i] += Math.sin(TAU * 2900 * i / SR) * Math.exp(-i / (0.002 * SR)) * 0.22; t += 0.035 + 0.1 * (t / d) ** 2; k++; }
    return out;
  },
};
export const SFX_NAMES = Object.keys(SYN);

export function synthSfx(events, duration, { seed = 11, volumen = 1 } = {}) {
  const N = Math.ceil((duration + 0.05) * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  events.forEach((e, idx) => {
    const fn = SYN[e.tipo]; if (!fn) return;
    const r = rng(seed * 1000 + idx);
    const b = fn({ tono: 1, ...e }, r);
    const at = Math.floor(e.t * SR), g = (e.vol ?? 1) * volumen, pan = (r() - 0.5) * 0.3;
    const gl = g * (1 - pan), gr = g * (1 + pan);
    for (let i = 0; i < b.length && at + i < N; i++) { if (at + i < 0) continue; L[at + i] += b[i] * gl; R[at + i] += b[i] * gr; }
  });
  // limitador suave
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const k = peak > 0.7 ? 0.7 / peak : 1;
  const out = Buffer.alloc(44 + N * 4);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    out.writeInt16LE(Math.round(Math.tanh(L[i] * k * 1.2) / Math.tanh(1.2) * 32767 * 0.98), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.tanh(R[i] * k * 1.2) / Math.tanh(1.2) * 32767 * 0.98), 46 + i * 4);
  }
  return out;
}
