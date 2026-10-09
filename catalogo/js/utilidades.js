// Created: 23:55 07-Oct-2026
// Updated: 00:30 08-Oct-2026
const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const moneda = valor => formatoCOP.format(typeof valor === 'number' && Number.isFinite(valor) ? valor : 0);
export const quitarTildes = texto => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const validarSlug = slug => typeof slug === 'string' && /^[a-z0-9-]{1,40}$/.test(slug);

export function normalizarNumero(valor) {
  const texto = String(valor ?? '').trim();
  if (!/^\+?[\d\s()-]+$/.test(texto)) throw new Error('Escribe un celular colombiano válido de 10 dígitos.');
  const digitos = texto.replace(/\D/g, '');
  const nacional = digitos.startsWith('57') && digitos.length === 12 ? digitos.slice(2) : digitos;
  if (!/^3\d{9}$/.test(nacional)) throw new Error('El celular debe tener 10 dígitos y comenzar por 3.');
  return `57${nacional}`;
}

export function imagenSegura(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return false;
  const ruta = valor.trim();
  if (/[\\\u0000-\u001f\u007f]/.test(ruta) || ruta.startsWith('//')) return false;
  if (/^https:\/\//i.test(ruta)) {
    try { return new URL(ruta).protocol === 'https:'; } catch { return false; }
  }
  return !/^[a-z][a-z0-9+.-]*:/i.test(ruta);
}

// Precios como los escribe la gente en Colombia ("$12.500", "12.500,00", "$12,500.00"). En COP no hay centavos.
export function normalizarPrecio(valor) {
  if (typeof valor === 'number') return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
  if (typeof valor !== 'string') return null;
  const texto = valor.trim().replace(/^\$\s*/, '').replace(/[.,]00$/, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)$/.test(texto)) return null;
  const numero = Number(texto.replace(/[.,]/g, ''));
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}
export const normalizarClave = texto => quitarTildes(texto).trim().replace(/\s+/g, ' ');
export const idDesdeNombre = nombre => quitarTildes(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'producto';
