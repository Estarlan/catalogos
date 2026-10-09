// Created: 23:55 07-Oct-2026
// Updated: 00:30 08-Oct-2026
// Updated: 00:43 08-Oct-2026 (WhatsApp y pedido mínimo como número o texto)
import { validarSlug, normalizarPrecio, normalizarClave, idDesdeNombre } from './utilidades.js';
import { parsearCSV } from './csv.js';

function texto(valor, defecto = '') { return typeof valor === 'string' ? valor.trim() : defecto; }
const DISPONIBLE = { true: true, '1': true, 'sí': true, si: true, '': true, false: false, '0': false, no: false };
function leerDisponible(valor) {
  if (typeof valor === 'boolean') return valor;
  if (valor === undefined || valor === null) return true;
  return DISPONIBLE[String(valor).trim().toLowerCase()];
}
function idUnico(base, usados) {
  let id = base, sufijo = 2;
  while (usados.has(id)) id = `${base}-${sufijo++}`;
  usados.add(id);
  return id;
}
// Una fila mala (precio vacío, nombre en blanco) se omite; solo falla si no queda ningún producto.
export function validarProductos(datos) {
  if (!Array.isArray(datos)) throw new Error('La lista de productos está vacía o no es válida.');
  const usados = new Set(), productos = [];
  datos.forEach((dato, indice) => {
    const nombre = dato && typeof dato === 'object' ? texto(dato.nombre) : '';
    const precio = nombre ? normalizarPrecio(dato.precio) : null;
    const disponible = nombre ? leerDisponible(dato.disponible) : undefined;
    if (!nombre || precio === null || typeof disponible !== 'boolean') {
      if (typeof console !== 'undefined') console.warn(`Producto ${indice + 1} omitido: revisa nombre, precio y disponible.`);
      return;
    }
    productos.push({
      id: idUnico(texto(dato.id) || idDesdeNombre(nombre), usados), nombre,
      categoria: texto(dato.categoria) || 'General', presentacion: texto(dato.presentacion),
      descripcion: texto(dato.descripcion), imagen: texto(dato.imagen), precio, disponible,
    });
  });
  if (!productos.length) throw new Error('La lista de productos está vacía o no es válida.');
  return productos;
}
export function validarNegocio(dato) {
  const whatsapp = dato && typeof dato === 'object' ? String(dato.whatsapp ?? '').trim() : '';
  if (!dato || typeof dato !== 'object' || !texto(dato.nombre) || !/^[1-9]\d{7,14}$/.test(whatsapp)) throw new Error('Revisa el nombre y el WhatsApp del negocio (solo dígitos con indicativo).');
  const entrega = { domicilio: dato.entrega?.domicilio === true, recoger: dato.entrega?.recoger === true, notaCosto: texto(dato.entrega?.notaCosto, 'El costo de domicilio se confirma por WhatsApp.') };
  const metodosPago = Array.isArray(dato.metodosPago) ? [...new Set(dato.metodosPago.map(valor => texto(valor)).filter(Boolean))] : [];
  if ((!entrega.domicilio && !entrega.recoger) || !metodosPago.length) throw new Error('Configura al menos una opción de entrega y un método de pago.');
  const crudo = dato.pedidoMinimo ?? 0;
  const pedidoMinimo = crudo === '' || crudo === 0 ? 0 : normalizarPrecio(crudo);
  if (pedidoMinimo === null) throw new Error('El pedido mínimo debe ser un número positivo o cero.');
  return { ...Object.fromEntries(['nombre', 'eslogan', 'logo', 'direccion', 'horario', 'ciudad', 'sheetCsvUrl'].map(campo => [campo, texto(dato[campo])])), whatsapp, colorPrincipal: /^#[0-9a-f]{6}$/i.test(dato.colorPrincipal) ? dato.colorPrincipal : '#23533c', entrega, metodosPago, pedidoMinimo, modoDemo: dato.modoDemo !== false, credito: { texto: texto(dato.credito?.texto), url: texto(dato.credito?.url) } };
}
async function solicitar(url, tipo, fetcher) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const respuesta = await fetcher(url, { signal: controller.signal });
    if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo. Revisa el enlace o intenta de nuevo.');
    return await respuesta[tipo]();
  } finally { clearTimeout(timer); }
}
export async function cargarCatalogo(slug, fetcher = fetch) {
  const valido = validarSlug(slug);
  const base = valido ? `datos/${slug}/` : 'datos/';
  const negocio = validarNegocio(await solicitar(`${base}negocio.json`, 'json', fetcher));
  let productos, aviso = '';
  if (negocio.sheetCsvUrl) {
    try {
      if (!/^https:\/\//i.test(negocio.sheetCsvUrl)) throw new Error('Usa una dirección HTTPS para la hoja.');
      const filas = parsearCSV(await solicitar(negocio.sheetCsvUrl, 'text', fetcher));
      productos = validarProductos(filas.map(fila => Object.fromEntries(Object.entries(fila).map(([clave, valor]) => [normalizarClave(clave), valor]))));
    } catch { aviso = 'No pudimos actualizar los precios desde la hoja. Mostramos el catálogo guardado; confirma los precios por WhatsApp.'; }
  }
  if (!productos) productos = validarProductos(await solicitar(`${base}productos.json`, 'json', fetcher));
  return { negocio, productos, clave: `catalogo:${valido ? slug : 'default'}`, aviso };
}
