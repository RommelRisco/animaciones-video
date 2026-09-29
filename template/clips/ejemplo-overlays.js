// Ejemplo: gráficos para poner ENCIMA de tu video (fondo transparente).
// El render sale como .mov (ProRes 4444 con alfa) + .webm (VP9 con alfa). Si tu editor no lee alfa: --croma
export default {
  nombre: 'overlays',
  formato: '16:9',
  estilo: 'minimal',
  fondo: 'transparente',
  zonaSegura: false,
  escenas: [
    { tipo: 'rotulo', nombre: 'Rommel Risco', cargo: 'Ingeniero de integraciones', permanencia: 3 },
    {
      tipo: 'subtitulos', modo: 'karaoke',
      lineas: [
        { desde: 0.0, hasta: 1.8, texto: 'Hoy te explico qué es un webhook' },
        { desde: 1.8, hasta: 3.6, texto: 'y por qué es mejor que preguntar cada rato' },
      ],
      // o: srt: 'assets/mi-video.srt'
      // o: palabras: [{ t: 0.0, fin: 0.3, texto: 'Hoy' }, …]   (tiempos exactos por palabra)
    },
  ],
};
