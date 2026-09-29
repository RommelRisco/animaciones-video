// Ejemplo: horizontal 16:9 (YouTube, presentaciones) en estilo minimal con datos, captura y cita.
// Las cifras de este ejemplo son DE MUESTRA: en un video real, usa solo datos con fuente verificable.
export default {
  nombre: 'datos-minimal',
  formato: '16:9',
  estilo: 'minimal',
  marca: { acento: '#4F46E5', acento2: '#06B6D4' },
  escenas: [
    { tipo: 'titulo', texto: 'Tu integración en 3 números', subtitulo: 'Resumen del mes (datos de ejemplo)', resalta: '3 números' },
    { tipo: 'cifra', titulo: 'Eventos entregados a la primera', valor: 98.6, sufijo: '%', anillo: true, etiqueta: 'Sin reintentos', fuente: 'Datos de ejemplo' },
    {
      tipo: 'barras', titulo: 'Tiempo de respuesta por endpoint', sufijo: ' ms', fuente: 'Datos de ejemplo',
      datos: [{ etiqueta: '/webhook', valor: 120, resaltar: true }, { etiqueta: '/pedidos', valor: 340 }, { etiqueta: '/clientes', valor: 510 }, { etiqueta: '/reportes', valor: 890 }],
    },
    {
      tipo: 'imagen', titulo: 'Revisa los eventos que fallan', src: 'assets/ejemplo-captura.png', marco: 'navegador',
      senalar: [{ x: 0.85, y: 0.72, texto: 'Aquí', radio: 0.07 }],
    },
    {
      tipo: 'comparacion', titulo: 'Reintento automático',
      antes: { titulo: 'Sin reintentos', items: ['Pierdes eventos', 'Soporte manual'] },
      despues: { titulo: 'Con reintentos', items: ['Nada se pierde', 'Menos tickets'] },
    },
    { tipo: 'cita', texto: 'Lo que no se mide, no se puede mejorar.', autor: 'Dicho popular en ingeniería' },
    { tipo: 'cta', texto: 'Suscríbete para más guías de integración', resalta: 'Suscríbete', boton: 'Suscribirme', botonHecho: 'Suscrito ✓', iconos: ['like', 'chat', 'compartir'] },
  ],
};
