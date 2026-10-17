// Created: 22:11 16-Oct-2026
import { moneda } from './core.js';
import { $, escapar as e, etiqueta, imagenHTML, abrirDialogo } from './ui.js';
import { estado } from './estado.js';
import { agregar } from './carrito.js';
export function abrirProducto(id) {
  const producto = estado.productos.find((item) => item.id === id);
  if (!producto) return;
  const campos = [['Forma', etiqueta(producto.forma)], ['Nivel', etiqueta(producto.nivel)], ['Balance', etiqueta(producto.balance)], ['Peso', producto.peso], ['Materiales', producto.materiales]];
  $('#quick-content').innerHTML = `<div class="quick-layout"><div class="quick-image">${imagenHTML(producto, 'quick-photo')}</div><div class="quick-details"><button class="icon-button quick-close" data-close aria-label="Cerrar vista rápida">×</button><p class="product-brand">${e(producto.marca)}</p><h2 id="quick-title">${e(producto.nombre)}</h2><div class="product-prices"><strong>${e(moneda(producto.precio, estado.tienda.moneda))}</strong>${producto.precioAnterior > producto.precio ? `<del>${e(moneda(producto.precioAnterior, estado.tienda.moneda))}</del>` : ''}</div><p class="quick-description">${e(producto.descripcion)}</p><p class="stock-label">${producto.stock ? `● Disponible · ${producto.stock} unidades` : 'Sin stock · Consultanos por el próximo ingreso'}</p><dl class="specs">${campos.map(([nombre, valor]) => `<div><dt>${nombre}</dt><dd>${e(valor)}</dd></div>`).join('')}</dl><div class="quick-purchase"><div class="quantity"><button data-quick-step="-1" aria-label="Restar cantidad" ${!producto.stock ? 'disabled' : ''}>−</button><input id="quick-quantity" aria-label="Cantidad a agregar" type="number" min="1" max="${producto.stock || 1}" value="1" ${!producto.stock ? 'disabled' : ''}><button data-quick-step="1" aria-label="Sumar cantidad" ${!producto.stock ? 'disabled' : ''}>+</button></div><button id="quick-add" class="primary-button" ${!producto.stock ? 'disabled' : ''}>${producto.stock ? 'Agregar a la bolsa +' : 'Sin stock'}</button></div><button id="quick-contact" class="secondary-button quick-contact">Consultar por ${estado.tienda.canal === 'telegram' ? 'Telegram' : 'WhatsApp'} ↗</button></div></div>`;
  const cantidad = () => Math.max(1, Math.min(producto.stock || 1, Math.floor(Number($('#quick-quantity').value) || 1)));
  $('#quick-content').querySelectorAll('[data-quick-step]').forEach((button) => button.addEventListener('click', () => {
    $('#quick-quantity').value = Math.max(1, Math.min(producto.stock, cantidad() + Number(button.dataset.quickStep)));
  }));
  $('#quick-quantity').addEventListener('change', () => { $('#quick-quantity').value = cantidad(); });
  $('#quick-add').addEventListener('click', () => agregar(id, cantidad()));
  $('#quick-contact').addEventListener('click', () => document.dispatchEvent(new CustomEvent('pedido', { detail: { id, cantidad: cantidad() } })));
  abrirDialogo('#quick-view');
}
export function abrirDesdeEnlace() {
  if (!location.hash.startsWith('#producto=')) return;
  try { abrirProducto(decodeURIComponent(location.hash.slice(10))); } catch { /* Un enlace incompleto no interrumpe el catálogo. */ }
}
