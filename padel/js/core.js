// Created: 22:11 16-Oct-2026
// Updated: 22:11 16-Oct-2026
// Updated: 13:00 17-Oct-2026 (whatsapp "elegir" para la demo pública)
const normalizar = (valor) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const lista = (valor) => Array.isArray(valor) ? valor : [];
const stockDe = (producto) => Math.max(0, Math.floor(Number(producto?.stock) || 0));
const precioDe = (producto) => Number.isFinite(Number(producto?.precio)) ? Number(producto.precio) : 0;
const coincide = (valor, seleccion) => !lista(seleccion).length || seleccion.some((opcion) => normalizar(opcion) === normalizar(valor));

/** Aplica todos los criterios conjuntamente y conserva el orden original. */
export function filtrarProductos(productos, filtros = {}) {
  const busqueda = normalizar(filtros.busqueda);
  const minimo = filtros.precioMin === '' || filtros.precioMin == null ? -Infinity : Number(filtros.precioMin);
  const maximo = filtros.precioMax === '' || filtros.precioMax == null ? Infinity : Number(filtros.precioMax);
  return lista(productos).filter((producto) => {
    const precio = precioDe(producto);
    return (!busqueda || normalizar(`${producto.nombre} ${producto.marca}`).includes(busqueda))
      && coincide(producto.marca, filtros.marcas)
      && coincide(producto.forma, filtros.formas)
      && coincide(producto.nivel, filtros.niveles)
      && precio >= (Number.isNaN(minimo) ? -Infinity : minimo)
      && precio <= (Number.isNaN(maximo) ? Infinity : maximo)
      && (!filtros.disponibles || stockDe(producto) > 0)
      && (!filtros.ofertas || Number(producto.precioAnterior) > precio);
  });
}

export function ordenarProductos(productos, orden = 'relevancia') {
  const comparadores = {
    'precio-asc': (a, b) => precioDe(a) - precioDe(b),
    'precio-desc': (a, b) => precioDe(b) - precioDe(a),
    novedades: (a, b) => Number(Boolean(b.novedad)) - Number(Boolean(a.novedad)),
  };
  const resultado = [...lista(productos)];
  return Object.hasOwn(comparadores, orden) ? resultado.sort(comparadores[orden]) : resultado;
}

/** Descarta IDs desconocidos y cantidades corruptas; limita cada unidad al stock. */
export function sanearCarrito(productos, carrito) {
  if (!carrito || typeof carrito !== 'object' || Array.isArray(carrito)) return {};
  const catalogo = new Map(lista(productos).map((producto) => [String(producto.id), producto]));
  return Object.fromEntries(Object.entries(carrito).flatMap(([id, cantidad]) => {
    const stock = stockDe(catalogo.get(id));
    if (!Number.isSafeInteger(cantidad) || cantidad <= 0 || stock <= 0) return [];
    return [[id, Math.min(cantidad, stock)]];
  }));
}

export function cambiarCantidad(productos, carrito, id, cantidad) {
  const resultado = sanearCarrito(productos, carrito);
  const clave = String(id);
  if (cantidad === 0) {
    delete resultado[clave];
    return resultado;
  }
  if (!Number.isSafeInteger(cantidad) || cantidad < 0) return resultado;
  return sanearCarrito(productos, { ...resultado, [clave]: cantidad });
}

export function calcularCarrito(productos, carrito) {
  const limpio = sanearCarrito(productos, carrito);
  const items = lista(productos).filter((producto) => Object.hasOwn(limpio, String(producto.id))).map((producto) => {
    const cantidad = limpio[String(producto.id)];
    return { producto, cantidad, subtotal: precioDe(producto) * cantidad };
  });
  return {
    items,
    cantidad: items.reduce((total, item) => total + item.cantidad, 0),
    total: items.reduce((total, item) => total + item.subtotal, 0),
  };
}

export function moneda(valor, currency = 'ARS') {
  const monto = Number.isFinite(Number(valor)) ? Number(valor) : 0;
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(monto).replace(/\s/g, ' ');
  } catch {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto).replace(/\s/g, ' ');
  }
}

/** Genera el pedido legible. El resumen debe provenir de calcularCarrito. */
export function armarMensaje(tienda, resumen, baseUrl) {
  const currency = tienda?.moneda ?? 'ARS';
  const base = String(baseUrl ?? '').split('#')[0];
  const lineas = [
    `¡Hola, ${tienda?.nombre ?? 'tienda'}! Quiero consultar este pedido.`,
    'DEMO: pedido de demostración, sin compra ni pago real.',
    '',
  ];
  lista(resumen?.items).forEach(({ producto, cantidad, subtotal }) => {
    lineas.push(
      `• ${producto.marca} ${producto.nombre}`,
      `Precio unitario: ${moneda(producto.precio, currency)} · Cantidad: ${cantidad}`,
      `Subtotal: ${moneda(subtotal, currency)}`,
      `${base}#producto=${encodeURIComponent(producto.id)}`,
      '',
    );
  });
  lineas.push(`Total: ${moneda(resumen?.total ?? 0, currency)}`, '¿Me confirman disponibilidad?');
  return lineas.join('\n');
}

export function enlaceCanal(tienda, mensaje) {
  if (tienda?.canal === 'telegram') {
    const usuario = String(tienda.telegramUsuario ?? '').replace(/^@/, '');
    return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(usuario) ? `https://t.me/${usuario}` : '';
  }
  const original = String(tienda?.whatsapp ?? '').trim();
  // Demo pública: sin número fijo, quien prueba elige el chat (puede mandárselo a sí mismo).
  if (original === 'elegir') return `https://wa.me/?text=${encodeURIComponent(String(mensaje ?? ''))}`;
  if (!/^\+?[\d\s().-]+$/.test(original)) return '';
  const numero = original.replace(/\D/g, '');
  return /^\d{8,15}$/.test(numero) ? `https://wa.me/${numero}?text=${encodeURIComponent(String(mensaje ?? ''))}` : '';
}
