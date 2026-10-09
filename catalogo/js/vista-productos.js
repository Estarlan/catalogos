// Created: 00:30 08-Oct-2026
// Encabezado, filtros y tarjetas de producto. Todo texto externo entra con textContent (nunca innerHTML).
import { porId, nodo } from './dom.js';
import { moneda, quitarTildes, imagenSegura } from './utilidades.js';

const TINTAS = [['#ebefe5', '#35492c'], ['#f6e7d8', '#7a3f12'], ['#e3edf4', '#1f4a66'], ['#f3e3ea', '#7a2747'],
  ['#efeadb', '#5d4c12'], ['#e2f0ec', '#1d5a4a'], ['#ece6f4', '#4a3473'], ['#f4e9e1', '#6b3a2a']];

function tintaDe(categoria) {
  let hash = 0;
  for (const letra of categoria) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return TINTAS[hash % TINTAS.length];
}

export function pintarNegocio(negocio) {
  const color = negocio.colorPrincipal;
  document.documentElement.style.setProperty('--brand', color);
  document.documentElement.style.setProperty('--brand-soft', `color-mix(in srgb, ${color} 9%, #ffffff)`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  document.title = `${negocio.nombre} · Haz tu pedido`;
  const logo = porId('logo');
  logo.replaceChildren();
  if (imagenSegura(negocio.logo)) {
    const img = nodo('img');
    img.src = negocio.logo;
    img.alt = '';
    logo.append(img);
  } else logo.textContent = negocio.nombre.trim().charAt(0).toUpperCase();
  porId('nombre-negocio').textContent = negocio.nombre;
  porId('ciudad').textContent = negocio.ciudad || 'Compra local, compra fácil';
  if (negocio.eslogan) porId('eslogan').textContent = negocio.eslogan;
  porId('horario').textContent = negocio.horario;
  porId('horario').hidden = !negocio.horario;
  const entregas = [negocio.entrega.domicilio && 'Domicilio', negocio.entrega.recoger && 'Recoger en el local'].filter(Boolean);
  porId('opciones-entrega').textContent = entregas.join(' · ');
  porId('footer-nombre').textContent = negocio.nombre;
  porId('footer-direccion').textContent = negocio.direccion;
  porId('footer-horario').textContent = negocio.horario;
  pintarCredito(negocio.credito);
  porId('demo-strip').hidden = !negocio.modoDemo;
}

function pintarCredito(credito) {
  const destino = porId('credito');
  destino.replaceChildren();
  if (!credito.texto) return;
  if (/^https:\/\//i.test(credito.url)) {
    const enlace = nodo('a', '', credito.texto);
    enlace.href = credito.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    destino.append(enlace);
  } else destino.textContent = credito.texto;
}

export function pintarCategorias(productos, alElegir) {
  const contenedor = porId('categorias');
  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))];
  contenedor.replaceChildren(...categorias.map(categoria => {
    const chip = nodo('button', 'chip', categoria);
    chip.type = 'button';
    chip.dataset.categoria = categoria;
    chip.setAttribute('aria-pressed', String(categoria === 'Todas'));
    chip.addEventListener('click', () => alElegir(categoria));
    return chip;
  }));
  contenedor.hidden = categorias.length <= 2;
}

export function marcarCategoria(categoria) {
  porId('categorias').querySelectorAll('.chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.categoria === categoria)));
}

function arte(producto) {
  const caja = nodo('div', 'product-art');
  const [fondo, tinta] = tintaDe(producto.categoria);
  caja.style.setProperty('--art-bg', fondo);
  caja.style.setProperty('--art-ink', tinta);
  if (imagenSegura(producto.imagen)) {
    const img = nodo('img');
    img.src = producto.imagen;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    caja.append(img);
  } else caja.append(nodo('span', 'product-initial', producto.nombre.charAt(0).toUpperCase()));
  caja.append(nodo('span', 'category-label', producto.categoria));
  if (!producto.disponible) caja.append(nodo('span', 'sold-tag', 'Agotado'));
  return caja;
}

export function controlCantidad(producto, cantidad, cambiar) {
  const control = nodo('div', 'quantity');
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', `Cantidad de ${producto.nombre}`);
  const menos = nodo('button', '', '−');
  menos.type = 'button';
  menos.dataset.accion = 'menos';
  menos.setAttribute('aria-label', `Quitar uno de ${producto.nombre}`);
  menos.addEventListener('click', () => cambiar(producto.id, cantidad - 1, 'menos'));
  const valor = nodo('output', '', String(cantidad));
  valor.setAttribute('aria-live', 'polite');
  const mas = nodo('button', '', '+');
  mas.type = 'button';
  mas.dataset.accion = 'mas';
  mas.disabled = cantidad >= 999;
  mas.setAttribute('aria-label', `Agregar otro de ${producto.nombre}`);
  mas.addEventListener('click', () => cambiar(producto.id, cantidad + 1, 'mas'));
  control.append(menos, valor, mas);
  return control;
}

export function pintarAcciones(destino, producto, cantidad, cambiar) {
  if (!producto.disponible) {
    const agotado = nodo('button', 'add-button', 'Agotado');
    agotado.type = 'button';
    agotado.disabled = true;
    destino.replaceChildren(agotado);
    return;
  }
  if (cantidad > 0) {
    destino.replaceChildren(controlCantidad(producto, cantidad, cambiar));
    return;
  }
  const agregar = nodo('button', 'add-button');
  agregar.type = 'button';
  agregar.dataset.accion = 'agregar';
  agregar.setAttribute('aria-label', `Agregar ${producto.nombre} al pedido`);
  agregar.append(nodo('span', '', '+'), document.createTextNode('Agregar'));
  agregar.addEventListener('click', () => cambiar(producto.id, 1, 'agregar'));
  destino.replaceChildren(agregar);
}

export function pintarProductos(productos, cantidades, cambiar) {
  const tarjetas = productos.map(producto => {
    const tarjeta = nodo('article', producto.disponible ? 'product-card' : 'product-card sold-out');
    tarjeta.dataset.id = producto.id;
    tarjeta.dataset.busqueda = quitarTildes([producto.nombre, producto.categoria, producto.presentacion, producto.descripcion].join(' '));
    tarjeta.dataset.categoria = producto.categoria;
    const contenido = nodo('div', 'product-content');
    contenido.append(nodo('h3', '', producto.nombre));
    if (producto.presentacion) contenido.append(nodo('p', 'product-presentation', producto.presentacion));
    if (producto.descripcion) contenido.append(nodo('p', 'product-description', producto.descripcion));
    contenido.append(nodo('p', 'product-price', moneda(producto.precio)));
    const acciones = nodo('div', 'product-actions');
    pintarAcciones(acciones, producto, cantidades[producto.id] || 0, cambiar);
    contenido.append(acciones);
    tarjeta.append(arte(producto), contenido);
    return tarjeta;
  });
  const grilla = porId('productos');
  grilla.replaceChildren(...tarjetas);
  grilla.setAttribute('aria-busy', 'false');
}

export function filtrar(categoria, busqueda) {
  const termino = quitarTildes(busqueda).trim();
  let visibles = 0;
  porId('productos').querySelectorAll('.product-card').forEach(tarjeta => {
    const ver = (categoria === 'Todas' || tarjeta.dataset.categoria === categoria) && (!termino || tarjeta.dataset.busqueda.includes(termino));
    tarjeta.hidden = !ver;
    if (ver) visibles += 1;
  });
  porId('conteo').textContent = visibles === 1 ? '1 producto' : `${visibles} productos`;
  porId('sin-resultados').hidden = visibles > 0;
}
