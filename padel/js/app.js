// Created: 22:11 16-Oct-2026
import { $, avisar, prepararDialogos } from './ui.js';
import { estado, cargarDatos } from './estado.js';
import { prepararFiltros } from './filtros.js';
import { agregar, prepararCarrito } from './carrito.js';
import { abrirProducto, abrirDesdeEnlace } from './vista-rapida.js';
import { prepararContacto, prepararPedido } from './contacto.js';
function temaInicial() {
  let tema;
  try { tema = localStorage.getItem('punto-padel-tema'); } catch { /* El tema también funciona sin almacenamiento. */ }
  aplicarTema(tema === 'dark' ? 'dark' : 'light');
}
function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  $('#theme-toggle').setAttribute('aria-label', `Activar modo ${tema === 'dark' ? 'claro' : 'oscuro'}`);
  $('#theme-toggle').setAttribute('aria-pressed', String(tema === 'dark'));
  document.querySelector('meta[name="theme-color"]').content = tema === 'dark' ? '#191f1a' : '#f7f7ef';
}
temaInicial();
$('#theme-toggle').addEventListener('click', () => {
  const tema = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  aplicarTema(tema);
  try { localStorage.setItem('punto-padel-tema', tema); } catch { /* Preferencia solo para esta visita. */ }
});
prepararDialogos();
$('#retry-load').addEventListener('click', iniciar);
async function iniciar() {
  $('#load-error').hidden = true;
  $('#result-count').textContent = 'Cargando colección…';
  try {
    await cargarDatos();
    document.title = `${estado.tienda.nombre} — Tu próximo punto empieza acá`;
    document.querySelectorAll('[data-store-name]').forEach((elemento) => { elemento.textContent = estado.tienda.nombre.toLocaleUpperCase('es'); });
    prepararFiltros();
    prepararCarrito();
    prepararContacto();
    $('#product-grid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      const id = button?.closest('[data-id]')?.dataset.id;
      if (!id) return;
      if (button.dataset.action === 'quick') abrirProducto(id);
      if (button.dataset.action === 'add') agregar(id);
      if (button.dataset.action === 'contact') prepararPedido(id);
    });
    window.addEventListener('hashchange', abrirDesdeEnlace);
    window.addEventListener('offline', () => avisar('Estás sin conexión. Podés seguir explorando los productos cargados.'));
    abrirDesdeEnlace();
  } catch (error) {
    console.error('No se pudo iniciar la tienda:', error);
    $('#load-error').hidden = false;
    $('#result-count').textContent = 'Colección no disponible';
  }
}
iniciar();
