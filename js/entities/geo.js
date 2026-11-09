/**
 * Utilidades geográficas compartidas por las entidades.
 */

/**
 * Comprueba que un valor sea una coordenada válida.
 * @param {*} value - Valor a comprobar.
 * @returns {boolean} true si es un número finito.
 */
export function isValidCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value);
}
