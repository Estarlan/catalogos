// Created: 00:30 08-Oct-2026
// Barra inferior del carrito, líneas del pedido y formulario de entrega/pago.
import { porId, nodo } from './dom.js';
import { moneda } from './utilidades.js';
import { controlCantidad } from './vista-productos.js';

export function pintarBarra(resumen) {
  const boton = porId('abrir-carrito');
  boton.disabled = resumen.cantidad === 0;
  porId('cantidad-carrito').textContent = String(resumen.cantidad);
  porId('total-carrito').textContent = moneda(resumen.total);
  const referencias = resumen.items.length;
  porId('detalle-carrito').textContent = resumen.cantidad === 0
    ? 'Agrega algo que te guste'
    : referencias === 1 ? '1 producto distinto' : `${referencias} productos distintos`;
  boton.setAttribute('aria-label', resumen.cantidad === 0 ? 'Tu pedido está vacío' : `Ver mi pedido: ${resumen.cantidad} unidades, ${moneda(resumen.total)}`);
}

export function pintarLineas(resumen, cambiar) {
  const lineas = resumen.items.map(({ producto, cantidad, subtotal }) => {
    const linea = nodo('div', 'cart-line');
    linea.dataset.id = producto.id;
    const info = nodo('div');
    info.append(nodo('h3', '', producto.nombre));
    info.append(nodo('p', '', [producto.presentacion, `${moneda(producto.precio)} c/u`].filter(Boolean).join(' · ')));
    const quitar = nodo('button', 'remove-button', 'Quitar');
    quitar.type = 'button';
    quitar.setAttribute('aria-label', `Quitar ${producto.nombre} del pedido`);
    quitar.addEventListener('click', () => cambiar(producto.id, 0, 'quitar'));
    linea.append(info, nodo('strong', '', moneda(subtotal)), controlCantidad(producto, cantidad, cambiar), quitar);
    return linea;
  });
  if (!lineas.length) lineas.push(nodo('p', 'field-note', 'Tu pedido está vacío. Agrega productos del catálogo.'));
  porId('lineas-carrito').replaceChildren(...lineas);
}

export function prepararFormulario(negocio) {
  const opciones = [negocio.entrega.domicilio && ['domicilio', 'Domicilio'], negocio.entrega.recoger && ['recoger', 'Recojo en el local']].filter(Boolean);
  porId('entrega-opciones').replaceChildren(...opciones.map(([valor, texto], indice) => {
    const etiqueta = nodo('label');
    const radio = nodo('input');
    radio.type = 'radio';
    radio.name = 'entrega';
    radio.value = valor;
    radio.checked = indice === 0;
    radio.addEventListener('change', () => actualizarEntrega(negocio));
    etiqueta.append(radio, document.createTextNode(texto));
    return etiqueta;
  }));
  porId('pago').replaceChildren(...negocio.metodosPago.map(metodo => {
    const opcion = nodo('option', '', metodo);
    opcion.value = metodo;
    return opcion;
  }));
  actualizarEntrega(negocio);
}

export function entregaElegida() {
  return document.querySelector('input[name="entrega"]:checked')?.value || 'recoger';
}

function actualizarEntrega(negocio) {
  const domicilio = entregaElegida() === 'domicilio';
  porId('direccion-grupo').hidden = !domicilio;
  porId('direccion').required = domicilio;
  porId('nota-domicilio').textContent = domicilio ? negocio.entrega.notaCosto : '';
  porId('resumen-entrega').textContent = domicilio ? 'El valor del domicilio no está incluido en este total.' : 'Recoges tu pedido en el local.';
}

export function pintarTotales(negocio, resumen) {
  porId('pedido-total').textContent = moneda(resumen.total);
  const falta = negocio.pedidoMinimo - resumen.total;
  const aviso = porId('minimo-aviso');
  aviso.hidden = !(negocio.pedidoMinimo > 0 && falta > 0);
  if (!aviso.hidden) aviso.textContent = `El pedido mínimo es ${moneda(negocio.pedidoMinimo)}. Te faltan ${moneda(falta)}.`;
  porId('enviar-pedido').disabled = resumen.cantidad === 0 || !aviso.hidden;
}

export function leerFormulario() {
  return {
    nombre: porId('cliente').value,
    entrega: entregaElegida(),
    direccion: porId('direccion').value,
    pago: porId('pago').value,
    notas: porId('notas').value,
  };
}
