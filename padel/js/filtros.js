// Created: 22:11 16-Oct-2026
import { filtrarProductos, ordenarProductos } from './core.js';
import { $, escapar as e, etiqueta } from './ui.js';
import { estado } from './estado.js';
import { renderCatalogo } from './catalogo.js';
function seleccion(nombre) { return [...document.querySelectorAll(`input[name="${nombre}"]:checked`)].map((input) => input.value); }
export function aplicarFiltros() {
  const filtros = {
    busqueda: $('#search').value, marcas: seleccion('marca'), formas: seleccion('forma'), niveles: seleccion('nivel'),
    precioMin: $('#price-min').value, precioMax: $('#price-max').value,
    disponibles: $('#available-only').checked, ofertas: $('#offers-only').checked,
  };
  renderCatalogo(ordenarProductos(filtrarProductos(estado.productos, filtros), $('#sort').value));
  const chips = [...document.querySelectorAll('#filters input:checked')].map((input) => ({ id: input.id, nombre: input.name, valor: input.value, texto: input.name ? etiqueta(input.value) : input.id === 'offers-only' ? 'Ofertas' : 'Con stock' }));
  if (filtros.busqueda) chips.push({ id: 'search', texto: `“${filtros.busqueda}”` });
  if (filtros.precioMin !== '') chips.push({ id: 'price-min', texto: `Desde $ ${filtros.precioMin}` });
  if (filtros.precioMax !== '') chips.push({ id: 'price-max', texto: `Hasta $ ${filtros.precioMax}` });
  $('#active-filters').innerHTML = chips.map((chip) => `<button data-input="${e(chip.id)}" data-name="${e(chip.nombre ?? '')}" data-value="${e(chip.valor ?? '')}" aria-label="Quitar filtro ${e(chip.texto)}">${e(chip.texto)} <span aria-hidden="true">×</span></button>`).join('');
  const cuenta = chips.length;
  $('#toggle-filters').innerHTML = `Filtros${cuenta ? ` (${cuenta})` : ''} <span aria-hidden="true">☷</span>`;
}
export function limpiarFiltros() {
  document.querySelectorAll('#filters input').forEach((input) => { if (input.type === 'checkbox') input.checked = false; else input.value = ''; });
  $('#search').value = '';
  $('#sort').value = 'relevancia';
  aplicarFiltros();
}
export function prepararFiltros() {
  const marcas = [...new Set(estado.productos.map((producto) => producto.marca))];
  $('#brand-options').innerHTML = marcas.map((marca, index) => `<label><input id="marca-${index}" type="checkbox" name="marca" value="${e(marca)}">${e(marca)}<span class="brand-count">${estado.productos.filter((producto) => producto.marca === marca).length}</span></label>`).join('');
  $('#filters').addEventListener('input', aplicarFiltros);
  $('#search').addEventListener('input', aplicarFiltros);
  $('#sort').addEventListener('change', aplicarFiltros);
  $('#clear-filters').addEventListener('click', limpiarFiltros);
  $('#reset-empty').addEventListener('click', limpiarFiltros);
  $('#toggle-filters').addEventListener('click', () => {
    const abierto = $('#filters').classList.toggle('is-open');
    $('#toggle-filters').setAttribute('aria-expanded', String(abierto));
    if (abierto) $('#filters input')?.focus({ preventScroll: true });
  });
  $('#active-filters').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const input = button.dataset.input ? document.getElementById(button.dataset.input) : [...document.querySelectorAll('#filters input')].find((item) => item.name === button.dataset.name && item.value === button.dataset.value);
    if (input) { if (input.type === 'checkbox') input.checked = false; else input.value = ''; }
    aplicarFiltros();
  });
  aplicarFiltros();
}
