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

/**
 * Comprueba que una latitud y una longitud estén dentro de rangos válidos.
 * @param {number} lat - Latitud en grados.
 * @param {number} lon - Longitud en grados.
 * @returns {boolean} true si ambas coordenadas son válidas.
 */
export function isValidLatLon(lat, lon) {
  return isValidCoordinate(lat) && isValidCoordinate(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

/**
 * Indica si una coordenada está dentro de unos límites geográficos.
 * @param {number} lat - Latitud en grados.
 * @param {number} lon - Longitud en grados.
 * @param {{south: number, north: number, west: number, east: number}} bounds - Límites.
 * @returns {boolean} true si está dentro de los límites.
 */
export function isWithinBounds(lat, lon, bounds) {
  if (!bounds || !isValidLatLon(lat, lon)) return false;
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
}
