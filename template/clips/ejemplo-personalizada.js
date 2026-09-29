// Ejemplo: cuadrado 1:1 en estilo oscuro con la mascota como presentadora y una escena hecha a mano con el API.
// Ver references/api-motor.md para todo lo que ofrece M.
export default {
  nombre: 'personalizada-oscuro',
  formato: '1:1',
  estilo: 'oscuro',
  marca: { acento: '#22C55E', acento2: '#38BDF8' },
  escenas: [
    { tipo: 'mascota', dice: '¡Hola! Te muestro cómo viaja un mensaje', resalta: 'viaja', accion: 'saludar' },
    {
      tipo: 'personalizada',
      palabras: 6,
      // Escena propia: un "sobre" que viaja de la app al servidor por una línea que se dibuja sola.
      construir: async (M, S) => {
        const { caja: B, g } = S, u = M.u;
        let t = S.t0;
        const T = M.text(S, g, 'App → Servidor', { x: B.x, y: B.y, w: B.w, size: 120, font: 'titulo', resalta: 'Servidor' });
        t = M.appear(S, T, t, 'golpe');
        const y = B.y + B.h * 0.62, x1 = B.x + 150 * u, x2 = B.x + B.w - 150 * u;
        const a = M.icon(S, g, 'telefono', x1, y, 200 * u), b = M.icon(S, g, 'chip', x2, y, 200 * u);
        M.popIcon(S, a, t); t = M.popIcon(S, b, t + 0.15);
        const line = M.path(g, `M${x1 + 120 * u},${y} C${(x1 + x2) / 2},${y - 180 * u} ${(x1 + x2) / 2},${y + 180 * u} ${x2 - 120 * u},${y}`, { color: S.col.acento2, w: 8 * u });
        t = M.draw(S, line, t, 0.6);
        const env = M.icon(S, g, 'correo', 0, 0, 110 * u, { color: S.col.acento });
        const len = line.getTotalLength(), p = { v: 0 };
        let a2;
        // los updaters corren en el orden en que se registran: primero movemos el proxy, luego M.anim lo aplica
        M.every(() => { const pt = line.getPointAtLength(len * p.v); a2.x = pt.x; a2.y = pt.y; });
        a2 = M.anim(env.g, { pivot: [0, 0], o: 0 });
        M.to(a2, { o: 1, duration: 0.15 }, t);
        M.to(p, { v: 1, duration: 1.4, ease: 'power1.inOut' }, t);
        M.sfx('whoosh', t, { dur: 1.4 });
        t += 1.4;
        M.to(a2, { s: 0, duration: 0.25, ease: 'back.in(2)' }, t);
        const ok = M.icon(S, g, 'check', x2, y - 170 * u, 120 * u, { color: S.col.bueno });
        t = M.popIcon(S, ok, t + 0.1);
        M.sfx('exito', t);
        return t + 0.3;
      },
    },
    { tipo: 'lista', titulo: 'Si falla, revisa:', marcador: 'numeros', items: ['La URL', 'El token', 'El formato del JSON'] },
    { tipo: 'mascota', dice: '¡Listo! Ya sabes depurarlo', accion: 'celebrar' },
  ],
};
