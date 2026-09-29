// Ejemplo: transiciones sueltas con fondo transparente para poner sobre un corte en tu editor.
// Cada una tapa toda la pantalla justo a la mitad: alinea ese punto con el corte.
export default {
  nombre: 'transiciones',
  formato: '9:16',
  estilo: 'kraft',
  fondo: 'transparente',
  transicion: 'corte',
  escenas: [
    { tipo: 'transicion', efecto: 'tinta', duracion: 1.0 },
    { tipo: 'transicion', efecto: 'barrido', duracion: 0.9 },
    { tipo: 'transicion', efecto: 'persiana', duracion: 0.9 },
    { tipo: 'transicion', efecto: 'circulo', duracion: 0.9, color: 'acento', color2: 'amarillo' },
  ],
};
