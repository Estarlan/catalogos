// Created: 23:55 07-Oct-2026
export function calcularCarrito(productos, cantidades) {
  const resumen = { items: [], cantidad: 0, total: 0 };
  const vistos = new Set();
  for (const producto of Array.isArray(productos) ? productos : []) {
    if (!producto || !producto.disponible || vistos.has(producto.id)) continue;
    vistos.add(producto.id);
    if (!cantidades || !Object.hasOwn(cantidades, producto.id)) continue;
    const valor = cantidades[producto.id];
    if (!Number.isSafeInteger(valor) || valor <= 0 || !Number.isSafeInteger(producto.precio) || producto.precio < 0) continue;
    const cantidad = Math.min(valor, 999), subtotal = cantidad * producto.precio;
    if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(resumen.total + subtotal)) continue;
    resumen.items.push({ producto, cantidad, subtotal });
    resumen.cantidad += cantidad;
    resumen.total += subtotal;
  }
  return resumen;
}

export function leerCarrito(clave) {
  try {
    const datos = JSON.parse(localStorage.getItem(clave) || '{}');
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {};
    return Object.fromEntries(Object.entries(datos).filter(([, cantidad]) => Number.isSafeInteger(cantidad) && cantidad > 0));
  } catch { return {}; }
}

export function guardarCarrito(clave, cantidades) {
  try { localStorage.setItem(clave, JSON.stringify(cantidades)); return true; }
  catch { return false; }
}
