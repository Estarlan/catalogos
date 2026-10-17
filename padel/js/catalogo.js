// Created: 22:11 16-Oct-2026
import { moneda } from './core.js';
import { $, escapar as e, etiqueta, imagenHTML } from './ui.js';
import { estado } from './estado.js';
const fondos = { 'Volea Pro': '#e5eadd', 'Smash Lab': '#ece4da', Bandeja: '#e9e9d9', Globo: '#e0e7e4' };
export function renderCatalogo(productos) {
  $('#result-count').innerHTML = `<strong>${productos.length}</strong> ${productos.length === 1 ? 'paleta' : 'paletas'} de ${estado.productos.length}`;
  $('#empty-state').hidden = productos.length > 0;
  $('#product-grid').innerHTML = productos.map((producto) => {
    const oferta = producto.precioAnterior > producto.precio;
    const descuento = Math.round((1 - producto.precio / producto.precioAnterior) * 100);
    return `<article class="product-card" data-id="${e(producto.id)}">
      <button class="product-image-wrap" style="--card-bg:${fondos[producto.marca] ?? '#e5eadd'}" data-action="quick" aria-label="Vista rápida de ${e(producto.nombre)}">
        <span class="product-badges">${oferta ? `<span class="badge badge-sale">−${descuento}%</span>` : ''}${producto.novedad ? '<span class="badge">NUEVA</span>' : ''}${!producto.stock ? '<span class="badge badge-stock">SIN STOCK</span>' : ''}</span>
        ${imagenHTML(producto)}<span class="quick-hint" aria-hidden="true">↗</span>
      </button>
      <div class="product-info"><p class="product-brand">${e(producto.marca)}</p><h3><button class="product-name" data-action="quick">${e(producto.nombre)}</button></h3>
        <p class="product-meta">${e(etiqueta(producto.forma))} <span aria-hidden="true">·</span> ${e(etiqueta(producto.nivel))}</p>
        <div class="product-prices"><strong>${e(moneda(producto.precio, estado.tienda.moneda))}</strong>${oferta ? `<del>${e(moneda(producto.precioAnterior, estado.tienda.moneda))}</del>` : ''}</div>
        <div class="product-actions"><button class="add-button" data-action="add" ${!producto.stock ? 'disabled' : ''}>${producto.stock ? 'Agregar a la bolsa +' : 'Sin stock'}</button><button class="contact-button" data-action="contact" aria-label="Consultar ${e(producto.nombre)} por ${estado.tienda.canal === 'telegram' ? 'Telegram' : 'WhatsApp'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.6 7.2L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/><path d="M8.5 7.5c0 4 3 7 7 7M8.5 7.5l2 2-1 1m6 4-2-2-1 1"/></svg></button></div>
      </div></article>`;
  }).join('');
}
