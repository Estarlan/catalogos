// Created: 22:11 16-Oct-2026
// Updated: 22:11 16-Oct-2026
import { sanearCarrito } from './core.js';
import { avisar } from './ui.js';
export const estado = { productos: [], tienda: {}, carrito: {} };
const clave = 'punto-padel-carrito-v1';
export function cargarCarrito() {
  try { estado.carrito = sanearCarrito(estado.productos, JSON.parse(localStorage.getItem(clave) ?? '{}')); }
  catch { estado.carrito = {}; }
}
let almacenamientoAvisado = false;
export function guardarCarrito() {
  try { localStorage.setItem(clave, JSON.stringify(estado.carrito)); }
  catch {
    if (!almacenamientoAvisado) avisar('Tu bolsa funciona, pero este navegador no permite guardarla al recargar.');
    almacenamientoAvisado = true;
  }
}
export async function cargarDatos() {
  const respuestas = await Promise.all(['datos/tienda.json', 'datos/productos.json'].map((ruta) => fetch(ruta)));
  if (respuestas.some((respuesta) => !respuesta.ok)) throw new Error('Datos no disponibles');
  const [tienda, datos] = await Promise.all(respuestas.map((respuesta) => respuesta.json()));
  if (!Array.isArray(datos.productos) || !tienda.nombre) throw new Error('Formato de datos incorrecto');
  const ids = new Set();
  for (const producto of datos.productos) {
    if (!producto || typeof producto.id !== 'string' || !/^[a-z0-9-]+$/.test(producto.id)
      || ids.has(producto.id) || !Number.isSafeInteger(producto.stock) || producto.stock < 0
      || !Number.isSafeInteger(producto.precio) || producto.precio < 0
      || !['nombre', 'marca', 'descripcion', 'peso', 'materiales'].every((campo) => typeof producto[campo] === 'string')
      || !['redonda', 'lagrima', 'diamante'].includes(producto.forma)
      || !['inicial', 'intermedio', 'avanzado'].includes(producto.nivel)) throw new Error('Producto inválido');
    ids.add(producto.id);
  }
  estado.tienda = tienda;
  estado.productos = datos.productos;
  cargarCarrito();
}
