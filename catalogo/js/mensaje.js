// Created: 23:55 07-Oct-2026
import { moneda } from './utilidades.js';

export function armarMensaje(negocio, resumen, formulario) {
  const entrega = formulario.entrega === 'domicilio' ? `Domicilio — ${formulario.direccion.trim()}` : 'Recoge en el local';
  const lineas = [
    `*Nuevo pedido — ${negocio.nombre}*`, `Cliente: ${formulario.nombre.trim()}`,
    `Entrega: ${entrega}`, `Pago: ${formulario.pago}`, '',
    ...resumen.items.map(({ producto, cantidad, subtotal }) => {
      const detalle = [producto.nombre, producto.presentacion].filter(Boolean).join(' ');
      return `• ${cantidad} x ${detalle} — ${moneda(subtotal)}`;
    }), '', `*Total: ${moneda(resumen.total)}*`,
  ];
  if (formulario.notas?.trim()) lineas.push(`Notas: ${formulario.notas.trim()}`);
  lineas.push('_Pedido hecho desde el catálogo web_');
  return lineas.join('\n');
}

export function enlaceWhatsApp(numero, mensaje) {
  if (!/^\d{8,15}$/.test(String(numero))) throw new Error('El número de WhatsApp no es válido.');
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
