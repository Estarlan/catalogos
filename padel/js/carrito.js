// Created: 22:11 16-Oct-2026
import { calcularCarrito, cambiarCantidad, moneda } from './core.js';
import { $, escapar as e, abrirDialogo, avisar, imagenHTML } from './ui.js';
import { estado, guardarCarrito } from './estado.js';
export function renderCarrito() {
  const resumen = calcularCarrito(estado.productos, estado.carrito);
  $('#cart-count').textContent = resumen.cantidad;
  $('#cart-heading-count').textContent = `(${resumen.cantidad})`;
  $('#open-cart').setAttribute('aria-label', `Abrir carrito, ${resumen.cantidad} productos`);
  $('#cart-total').textContent = moneda(resumen.total, estado.tienda.moneda);
  $('#cart-summary').hidden = resumen.cantidad === 0;
  $('#checkout').disabled = resumen.cantidad === 0;
  $('#cart-items').innerHTML = resumen.items.length ? resumen.items.map(({ producto, cantidad, subtotal }) => `<article class="cart-item" data-id="${e(producto.id)}">
    <div class="cart-item-image">${imagenHTML(producto, 'cart-photo')}</div><div><p class="product-brand">${e(producto.marca)}</p><h3>${e(producto.nombre)}</h3><p class="cart-item-price">${e(moneda(producto.precio, estado.tienda.moneda))} / unidad</p>
    <div class="cart-item-bottom"><div class="quantity"><button data-step="-1" aria-label="Restar una unidad de ${e(producto.nombre)}">−</button><input type="number" min="1" max="${producto.stock}" value="${cantidad}" aria-label="Cantidad de ${e(producto.nombre)}"><button data-step="1" ${cantidad >= producto.stock ? 'disabled' : ''} aria-label="Sumar una unidad de ${e(producto.nombre)}">+</button></div><button class="remove-item" data-remove aria-label="Quitar ${e(producto.nombre)}">Quitar</button></div><strong class="cart-subtotal">Subtotal: ${e(moneda(subtotal, estado.tienda.moneda))}</strong></div></article>`).join('') : '<div class="cart-empty"><span aria-hidden="true">p.</span><h3>Tu próximo punto empieza acá.</h3><p>Sumá una paleta a la bolsa y después coordiná tu pedido por chat.</p><button class="primary-button" data-close>Explorar paletas ↗</button></div>';
}
export function agregar(id, cantidad = 1) {
  const producto = estado.productos.find((item) => item.id === id);
  if (!producto?.stock) return;
  const anterior = estado.carrito[id] ?? 0;
  estado.carrito = cambiarCantidad(estado.productos, estado.carrito, id, anterior + cantidad);
  guardarCarrito();
  renderCarrito();
  if (estado.carrito[id] === anterior) avisar('Ya agregaste todas las unidades disponibles.');
  else avisar(`${producto.nombre} se sumó a tu bolsa.`);
}
export function prepararCarrito() {
  $('#open-cart').addEventListener('click', () => abrirDialogo('#cart-dialog'));
  $('#cart-items').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const item = button?.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;
    const cantidad = button.hasAttribute('data-remove') ? 0 : (estado.carrito[id] ?? 0) + Number(button.dataset.step);
    estado.carrito = cambiarCantidad(estado.productos, estado.carrito, id, cantidad);
    guardarCarrito();
    renderCarrito();
    const reemplazo = [...$('#cart-items').querySelectorAll('[data-id]')].find((fila) => fila.dataset.id === id);
    const siguiente = button.hasAttribute('data-remove') ? $('#cart-items button') : reemplazo?.querySelector(`[data-step="${button.dataset.step}"]:not(:disabled)`);
    (siguiente ?? reemplazo?.querySelector('input') ?? $('#cart-dialog [data-close]')).focus();
  });
  $('#cart-items').addEventListener('change', (event) => {
    const input = event.target.closest('input');
    const item = input?.closest('[data-id]');
    if (!item) return;
    estado.carrito = cambiarCantidad(estado.productos, estado.carrito, item.dataset.id, Number(input.value));
    guardarCarrito();
    renderCarrito();
    const reemplazo = [...$('#cart-items').querySelectorAll('[data-id]')].find((fila) => fila.dataset.id === item.dataset.id);
    (reemplazo?.querySelector('input') ?? $('#cart-dialog [data-close]')).focus();
  });
  renderCarrito();
}
