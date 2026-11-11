/**
 * Servicio para mostrar mensajes con la alerta nativa del navegador.
 * La alerta permanece abierta hasta que el usuario la cierre.
 */

let pendingId = null;

/**
 * Muestra una alerta nativa. Se difiere al siguiente ciclo para que la interfaz
 * termine de actualizarse antes de bloquear el hilo principal.
 * @param {string} message - Mensaje a mostrar.
 */
export function showAlert(message) {
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return;

  if (pendingId !== null) {
    window.clearTimeout(pendingId);
  }

  pendingId = window.setTimeout(() => {
    pendingId = null;
    window.alert(text);
  }, 0);
}
