/**
 * Obtiene la ubicación actual del navegador.
 * @param {PositionOptions} [options={}] - Opciones de geolocalización.
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>} Coordenadas y precisión.
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalización no disponible en este navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(error.message || "No se pudo obtener la ubicación."));
      },
      options,
    );
  });
}
