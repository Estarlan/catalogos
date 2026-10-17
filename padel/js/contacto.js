// Created: 22:11 16-Oct-2026
// Updated: 22:11 16-Oct-2026
// Updated: 13:03 17-Oct-2026 (nota del modo "elegir")
import { armarMensaje, calcularCarrito, enlaceCanal } from './core.js';
import { $, abrirDialogo, avisar } from './ui.js';
import { estado } from './estado.js';
async function copiarPedido() {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Portapapeles no disponible');
    await navigator.clipboard.writeText($('#order-text').value);
    $('#order-status').textContent = estado.tienda.canal === 'telegram' ? 'Pedido copiado, pégalo en el chat' : 'Pedido copiado al portapapeles.';
    return true;
  } catch {
    $('#order-status').textContent = 'No pudimos copiar automáticamente. Seleccioná el mensaje y copialo para pegarlo en el chat.';
    $('#order-text').focus();
    $('#order-text').select();
    return false;
  }
}
export async function prepararPedido(id, cantidad = 1) {
  let resumen;
  if (id) {
    const producto = estado.productos.find((item) => item.id === id);
    if (!producto) return;
    const unidades = Math.max(1, Math.min(producto.stock || 1, Math.floor(Number(cantidad) || 1)));
    resumen = { items: [{ producto, cantidad: unidades, subtotal: producto.precio * unidades }], cantidad: unidades, total: producto.precio * unidades };
  } else resumen = calcularCarrito(estado.productos, estado.carrito);
  if (!resumen.cantidad) { avisar('Agregá una paleta para armar tu pedido.'); return; }
  const mensaje = armarMensaje(estado.tienda, resumen, location.href);
  const url = enlaceCanal(estado.tienda, mensaje);
  if (!url) { avisar('Revisá el número o usuario del canal en datos/tienda.json.'); return; }
  $('#order-text').value = mensaje;
  $('#open-chat').href = url;
  $('#open-chat').textContent = `Abrir ${estado.tienda.canal === 'telegram' ? 'Telegram' : 'WhatsApp'} ↗`;
  $('#order-status').textContent = 'Pedido preparado. Si el chat no se abrió, usá el botón de abajo.';
  abrirDialogo('#order-dialog');
  if (estado.tienda.canal === 'telegram') {
    const copia = copiarPedido();
    window.open(url, '_blank', 'noopener,noreferrer');
    await copia;
  } else window.open(url, '_blank', 'noopener,noreferrer');
}
export function prepararContacto() {
  const telegram = estado.tienda.canal === 'telegram';
  $('#checkout-label').textContent = `Enviar por ${telegram ? 'Telegram' : 'WhatsApp'}`;
  const elegir = !telegram && String(estado.tienda.whatsapp ?? '').trim() === 'elegir';
  document.querySelector('.checkout-note').textContent = elegir
    ? 'Tienda de muestra · elegís a qué chat mandarlo (podés mandártelo a vos).'
    : `${telegram ? 'Usuario' : 'Número'} de prueba · Esta es una tienda de muestra.`;
  $('#checkout').addEventListener('click', () => prepararPedido());
  document.addEventListener('pedido', (event) => prepararPedido(event.detail.id, event.detail.cantidad));
  $('#copy-order').addEventListener('click', copiarPedido);
}
