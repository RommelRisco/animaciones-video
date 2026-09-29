// Hoja con todos los íconos disponibles: node render.mjs clips/catalogo-iconos.js --fotos 0.3
import { ICON_NAMES } from '../engine/icons.js';
export default {
  nombre: 'catalogo-iconos', formato: '16:9', estilo: 'pizarra', zonaSegura: false,
  escenas: [{ tipo: 'personalizada', camara: false, pausa: 0.5, construir: async (M, S) => {
    const cols = 9, cw = M.W / cols, ch = 150, u = M.u;
    ICON_NAMES.forEach((n, i) => {
      const cx = cw * (i % cols + 0.5), cy = 90 + Math.floor(i / cols) * (ch + 50);
      const ic = M.icon(S, S.g, n, cx, cy, 110 * u);
      ic.fills.forEach(f => f.setAttribute('opacity', 0.92));
      const t = M.el('text', { x: cx, y: cy + 95, 'text-anchor': 'middle', 'font-family': '"Kalam"', 'font-size': 30, fill: '#555' }, S.g); t.textContent = n;
    });
    return S.t0 + 0.1;
  } }],
};
