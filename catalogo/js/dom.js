// Created: 23:55 07-Oct-2026
export const porId = id => document.getElementById(id);
export function nodo(tag, clase = '', texto = '') {
  const elemento = document.createElement(tag);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}
let temporizador;
export function avisar(texto) {
  const toast = porId('toast');
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { toast.hidden = true; }, 4000);
}
export function prepararDialogos() {
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-cerrar]').forEach(boton => boton.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const visibles = [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const primero = visibles[0], ultimo = visibles.at(-1);
      if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
    });
  });
}
export function abrirDialogo(id) { porId(id).showModal(); }
export async function compartir(nombre) {
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: nombre, text: 'Mira el catálogo y haz tu pedido por WhatsApp.', url }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); avisar('Enlace copiado. Ya puedes compartirlo.'); }
  catch { porId('enlace-catalogo').value = url; abrirDialogo('compartir-dialog'); porId('enlace-catalogo').select(); }
}
