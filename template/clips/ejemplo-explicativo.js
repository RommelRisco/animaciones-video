// Ejemplo: explicativo vertical (Reels/TikTok/Shorts) en estilo pizarra con mascota.
// Vista previa:  node preview.mjs clips/ejemplo-explicativo.js
// Render:        node render.mjs clips/ejemplo-explicativo.js
export default {
  nombre: 'que-es-un-webhook',
  formato: '9:16',
  estilo: 'pizarra',
  // marca: { acento: '#FF5A1F', fuenteTitulo: 'Caveat' },   // ← colores y fuentes de tu marca
  transicion: 'auto',
  escenas: [
    {
      tipo: 'titulo',
      texto: '¿Tu app pregunta cada 5 segundos si hay algo nuevo?',
      resalta: 'cada 5 segundos',
      mascota: { accion: 'pensar', lado: 'derecha' },
    },
    {
      tipo: 'idea',
      titulo: 'Eso se llama polling',
      resalta: 'polling',
      icono: 'reloj',
      texto: 'Gasta peticiones aunque no haya pasado nada',
    },
    {
      tipo: 'flujo',
      titulo: 'Un webhook funciona al revés',
      resalta: 'al revés',
      pasos: [
        { icono: 'rayo', texto: 'Pasa algo: un pago, un mensaje' },
        { icono: 'compartir', texto: 'El servicio te avisa con un POST' },
        { icono: 'check', texto: 'Tu app reacciona al instante' },
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Polling vs. webhook',
      izquierda: { titulo: 'Polling', items: ['Muchas peticiones vacías', 'Te enteras tarde'] },
      derecha: { titulo: 'Webhook', items: ['Solo cuando hay algo', 'Casi en tiempo real'] },
    },
    {
      tipo: 'lista',
      titulo: 'Tu endpoint, bien hecho',
      marcador: 'check',
      items: ['Responde 200 rápido', 'Verifica la firma', 'Procesa en segundo plano'],
      fondo: 'cuaderno',
      herramienta: 'lapiz',
    },
    {
      tipo: 'cta',
      texto: '¿Te sirvió? Guárdalo para tu próxima integración',
      resalta: 'Guárdalo',
      usuario: '@tu_usuario',
      boton: 'Seguir',
      mascota: { accion: 'celebrar', lado: 'izquierda' },
      iconos: [],
    },
  ],
};
