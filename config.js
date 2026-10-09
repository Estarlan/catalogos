// Created: 23:53 07-Oct-2026
// Updated: 00:43 08-Oct-2026 (número de Juan)
// Único dato que Juan debe cambiar: su WhatsApp con indicativo 57 y sin espacios.
// Mientras sea el número de relleno, los botones bajan al contacto en vez de abrir WhatsApp.
const WHATSAPP_JUAN = "573202602328";
const MENSAJE_INICIAL = "Hola Juan, vi tu página. Quiero un catálogo con pedidos por WhatsApp para mi negocio.";

(function conectarBotones() {
  const esRelleno = /^57300000000\d$/.test(WHATSAPP_JUAN);
  if (esRelleno || !/^57\d{10}$/.test(WHATSAPP_JUAN)) return;
  const enlace = "https://wa.me/" + WHATSAPP_JUAN + "?text=" + encodeURIComponent(MENSAJE_INICIAL);
  document.querySelectorAll(".js-whatsapp").forEach(function (boton) {
    boton.href = enlace;
    boton.target = "_blank";
    boton.rel = "noopener";
  });
})();
