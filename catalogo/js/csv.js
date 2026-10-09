// Created: 23:55 07-Oct-2026
export function parsearCSV(entrada) {
  if (typeof entrada !== 'string') throw new Error('El CSV debe ser texto.');
  const texto = entrada.replace(/^\uFEFF/, '');
  const filas = [];
  let fila = [], celda = '', estado = 'inicio';
  const cerrarCelda = () => { fila.push(celda); celda = ''; estado = 'inicio'; };
  const cerrarFila = () => {
    cerrarCelda();
    if (fila.length > 1 || fila[0] !== '') filas.push(fila);
    fila = [];
  };
  for (let indice = 0; indice < texto.length; indice += 1) {
    const caracter = texto[indice];
    if (estado === 'comillas') {
      if (caracter === '"') {
        if (texto[indice + 1] === '"') { celda += '"'; indice += 1; }
        else estado = 'cerrada';
      } else celda += caracter;
      continue;
    }
    if (caracter === ',') { cerrarCelda(); continue; }
    if (caracter === '\n' || caracter === '\r') {
      cerrarFila();
      if (caracter === '\r' && texto[indice + 1] === '\n') indice += 1;
      continue;
    }
    if (estado === 'cerrada') throw new Error('CSV inválido: hay texto después de cerrar las comillas.');
    if (caracter === '"') {
      if (estado !== 'inicio') throw new Error('CSV inválido: comillas en mitad de una celda.');
      estado = 'comillas';
    } else { celda += caracter; estado = 'texto'; }
  }
  if (estado === 'comillas') throw new Error('CSV inválido: faltan comillas de cierre.');
  if (fila.length || celda || estado === 'cerrada') cerrarFila();
  if (!filas.length) return [];
  const encabezados = filas.shift().map(valor => valor.trim());
  if (encabezados.some(valor => !valor) || new Set(encabezados).size !== encabezados.length) {
    throw new Error('El CSV tiene encabezados vacíos o repetidos.');
  }
  return filas.map((valores, indice) => {
    if (valores.length !== encabezados.length) throw new Error(`La fila ${indice + 2} no tiene el número correcto de columnas.`);
    return Object.fromEntries(encabezados.map((nombre, posicion) => [nombre, valores[posicion]]));
  });
}
