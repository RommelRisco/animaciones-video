#!/usr/bin/env node
// Vista previa en vivo: node preview.mjs clips/mi-clip.js  → abre la URL que imprime (se recarga con F5)
import { startServer } from './lib/server.mjs';
const clip = (process.argv[2] || 'clips/ejemplo-explicativo.js').replace(/\\/g, '/');
const port = Number(process.env.PORT || 5173);
let srv;
try { srv = await startServer(process.cwd(), port); } catch { srv = await startServer(process.cwd(), 0); }
console.log(`Vista previa: ${srv.url}/index.html?clip=${encodeURI(clip)}`);
console.log('Espacio = reproducir/pausa · ←/→ = cuadro a cuadro (Shift = 1 s) · G = zona segura · Ctrl+C para salir');
