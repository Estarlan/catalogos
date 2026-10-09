// Created: 00:30 08-Oct-2026
// Updated: 00:43 08-Oct-2026 (aviso si no se puede abrir WhatsApp)
// Arranque del catálogo: carga datos, conecta eventos y envía el pedido a WhatsApp.
import { cargarCatalogo } from './datos.js';
import { calcularCarrito, leerCarrito, guardarCarrito } from './carrito.js';
import { armarMensaje, enlaceWhatsApp } from './mensaje.js';
import { normalizarNumero } from './utilidades.js';
import { porId, nodo, avisar, prepararDialogos, abrirDialogo, compartir } from './dom.js';
import { pintarNegocio, pintarCategorias, marcarCategoria, pintarProductos, pintarAcciones, filtrar } from './vista-productos.js';
import { pintarBarra, pintarLineas, prepararFormulario, pintarTotales, leerFormulario } from './vista-carrito.js';

const estado = { negocio: null, productos: [], porId: new Map(), clave: '', cantidades: {}, categoria: 'Todas', busqueda: '', mensaje: '' };

function resumen() { return calcularCarrito(estado.productos, estado.cantidades); }

function cambiarCantidad(id, valor, origen) {
  const producto = estado.porId.get(id);
  if (!producto || !producto.disponible) return;
  const cantidad = Math.max(0, Math.min(999, valor));
  const { [id]: _anterior, ...resto } = estado.cantidades;
  estado.cantidades = cantidad > 0 ? { ...resto, [id]: cantidad } : resto;
  guardarCarrito(estado.clave, estado.cantidades);
  const tarjeta = porId('productos').querySelector(`[data-id="${CSS.escape(id)}"] .product-actions`);
  const teniaFoco = tarjeta?.contains(document.activeElement);
  if (tarjeta) pintarAcciones(tarjeta, producto, cantidad, cambiarCantidad);
  if (teniaFoco) enfocar(tarjeta, cantidad, origen);
  refrescarPedido();
  if (porId('carrito-dialog').open) enfocarLinea(id, origen);
}

function enfocar(contenedor, cantidad, origen) {
  const accion = cantidad === 0 ? 'agregar' : origen === 'menos' ? 'menos' : 'mas';
  (contenedor.querySelector(`[data-accion="${accion}"]`) || contenedor.querySelector('button'))?.focus();
}

function enfocarLinea(id, origen) {
  const linea = porId('lineas-carrito').querySelector(`[data-id="${CSS.escape(id)}"]`);
  const destino = linea?.querySelector(`[data-accion="${origen === 'menos' ? 'menos' : 'mas'}"]`)
    || porId('lineas-carrito').querySelector('button') || porId('cliente');
  destino.focus();
}

function refrescarPedido() {
  const datos = resumen();
  pintarBarra(datos);
  pintarTotales(estado.negocio, datos);
  if (porId('carrito-dialog').open) pintarLineas(datos, cambiarCantidad);
}

function elegirCategoria(categoria) {
  estado.categoria = categoria;
  marcarCategoria(categoria);
  filtrar(estado.categoria, estado.busqueda);
}

function enviarPedido(event) {
  event.preventDefault();
  const formulario = porId('pedido-form');
  if (!formulario.reportValidity()) return;
  const datos = resumen();
  if (!datos.cantidad) return avisar('Agrega al menos un producto.');
  estado.mensaje = armarMensaje(estado.negocio, datos, leerFormulario());
  if (estado.negocio.modoDemo) {
    porId('mensaje-preview').textContent = estado.mensaje;
    abrirDialogo('demo-dialog');
    return;
  }
  abrirWhatsApp(estado.negocio.whatsapp);
}

function abrirWhatsApp(numero) {
  let enlace;
  try { enlace = enlaceWhatsApp(numero, estado.mensaje); }
  catch { avisar('No pudimos abrir WhatsApp: el número del negocio no es válido.'); return; }
  // Con 'noopener' window.open siempre devuelve null; por eso se corta el opener a mano.
  const ventana = window.open(enlace, '_blank');
  if (ventana) ventana.opener = null;
  else window.location.href = enlace;
  avisar('Abrimos WhatsApp con tu pedido. Solo toca enviar.');
}

function enviarDemo(event) {
  event.preventDefault();
  const campo = porId('demo-numero');
  try {
    const numero = normalizarNumero(campo.value);
    campo.setCustomValidity('');
    porId('demo-dialog').close();
    abrirWhatsApp(numero);
  } catch (error) {
    campo.setCustomValidity(error.message);
    campo.reportValidity();
  }
}

function conectarEventos() {
  prepararDialogos();
  porId('buscar').addEventListener('input', event => { estado.busqueda = event.target.value; filtrar(estado.categoria, estado.busqueda); });
  porId('limpiar-filtros').addEventListener('click', () => { porId('buscar').value = ''; estado.busqueda = ''; elegirCategoria('Todas'); });
  porId('compartir').addEventListener('click', () => compartir(estado.negocio?.nombre || 'Catálogo'));
  porId('abrir-carrito').addEventListener('click', () => { pintarLineas(resumen(), cambiarCantidad); abrirDialogo('carrito-dialog'); });
  porId('pedido-form').addEventListener('submit', enviarPedido);
  porId('demo-form').addEventListener('submit', enviarDemo);
  porId('demo-numero').addEventListener('input', event => event.target.setCustomValidity(''));
}

function mostrarError(error) {
  const grilla = porId('productos');
  grilla.setAttribute('aria-busy', 'false');
  const caja = nodo('div', 'empty-state');
  const reintentar = nodo('button', 'secondary', 'Intentar de nuevo');
  reintentar.type = 'button';
  reintentar.addEventListener('click', () => location.reload());
  caja.append(nodo('h3', '', 'No pudimos cargar el catálogo'), nodo('p', '', 'Revisa tu conexión a internet e intenta de nuevo.'), reintentar);
  grilla.replaceChildren(caja);
  porId('conteo').textContent = '';
  console.error(error);
}

async function iniciar() {
  conectarEventos();
  try {
    const slug = new URLSearchParams(location.search).get('n');
    const { negocio, productos, clave, aviso } = await cargarCatalogo(slug);
    Object.assign(estado, { negocio, productos, clave, porId: new Map(productos.map(p => [p.id, p])) });
    estado.cantidades = Object.fromEntries(Object.entries(leerCarrito(clave)).filter(([id]) => estado.porId.get(id)?.disponible));
    pintarNegocio(negocio);
    pintarCategorias(productos, elegirCategoria);
    pintarProductos(productos, estado.cantidades, cambiarCantidad);
    prepararFormulario(negocio);
    filtrar(estado.categoria, estado.busqueda);
    refrescarPedido();
    if (aviso) { porId('aviso-datos').textContent = aviso; porId('aviso-datos').hidden = false; }
  } catch (error) {
    mostrarError(error);
  }
}

iniciar();
