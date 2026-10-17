// Created: 22:11 16-Oct-2026
export const $ = (selector, root = document) => root.querySelector(selector);
export const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const etiqueta = (valor) => ({ lagrima: 'Lágrima', redonda: 'Redonda', diamante: 'Diamante', inicial: 'Inicial', intermedio: 'Intermedio', avanzado: 'Avanzado', bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }[valor] ?? valor);
export const silueta = (producto) => `imagenes/${['redonda', 'lagrima', 'diamante'].includes(producto.forma) ? producto.forma : 'redonda'}_221105-16Oct2026.svg`;
export function foto(producto) {
  try {
    if (!producto.imagen?.trim()) return '';
    const url = new URL(producto.imagen, document.baseURI);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
export function imagenHTML(producto, clase = 'product-image') {
  const real = foto(producto);
  return `<img class="${clase}${real ? ' real-photo' : ''}" src="${escapar(real || silueta(producto))}" data-fallback="${silueta(producto)}" alt="${escapar(real ? `${producto.marca} ${producto.nombre}` : `Silueta ilustrativa: forma ${etiqueta(producto.forma)}`)}" loading="lazy" width="220" height="340"><span class="photo-pending" ${real ? 'hidden' : ''}>Foto pendiente</span>`;
}
let toastTimer;
export function avisar(mensaje) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  (document.querySelector('dialog[open]') ?? document.body).append(toast);
  toast.textContent = mensaje;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}
export function abrirDialogo(id) {
  const dialogo = $(id);
  document.querySelectorAll('dialog[open]').forEach((abierto) => { if (abierto !== dialogo) abierto.close(); });
  if (!dialogo.open) dialogo.showModal();
}
export function prepararDialogos() {
  document.querySelectorAll('dialog').forEach((dialogo) => {
    dialogo.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) dialogo.close();
      if (event.target === dialogo) {
        const rect = dialogo.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogo.close();
      }
    });
    dialogo.addEventListener('close', () => {
      if (dialogo.contains($('#toast'))) document.body.append($('#toast'));
    });
  });
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.dataset.fallback && !image.dataset.failed) {
      image.dataset.failed = 'true';
      image.src = image.dataset.fallback;
      image.classList.remove('real-photo');
      image.alt = 'Silueta ilustrativa de paleta';
      const pending = image.parentElement.querySelector('.photo-pending');
      if (pending) pending.hidden = false;
    }
  }, true);
}
