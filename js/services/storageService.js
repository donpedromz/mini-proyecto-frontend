/**
 * Servicio para gestionar la persistencia en el almacenamiento local (localStorage).
 */

/**
 * Obtiene y deserializa un elemento desde localStorage.
 * @template T
 * @param {string} key - Clave del elemento a recuperar.
 * @param {T} [fallback=null] - Valor retornado en caso de ausencia o fallo.
 * @returns {T} Valor almacenado parseado o el fallback.
 */
export function getStoredItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Serializa y guarda un elemento en localStorage.
 * @param {string} key - Clave con la que se guardará el elemento.
 * @param {*} value - Valor a serializar y guardar.
 * @returns {boolean} true si se guardó exitosamente, false en caso de error.
 */
export function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina un elemento de localStorage.
 * @param {string} key - Clave del elemento a eliminar.
 */
export function removeStoredItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignorar si el almacenamiento está restringido
  }
}
