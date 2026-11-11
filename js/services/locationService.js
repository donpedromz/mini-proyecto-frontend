/**
 * Mensajes para los códigos de error de la API de geolocalización.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
 */
const GEO_ERROR_MESSAGES = {
  1: "Permiso de ubicación denegado. Actívalo en la configuración del navegador.",
  2: "Ubicación no disponible. Verifica que el GPS o la conexión estén activos.",
  3: "Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo.",
};

/**
 * Obtiene la ubicación actual del navegador.
 * @param {PositionOptions} [options={}] - Opciones de geolocalización.
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>} Coordenadas y precisión en metros.
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      reject(new Error("La geolocalización requiere HTTPS o localhost."));
      return;
    }

    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalización no disponible en este navegador."));
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(
            new Error(
              GEO_ERROR_MESSAGES[error.code] || error.message || "No se pudo obtener la ubicación.",
            ),
          );
        },
        options,
      );
    } catch {
      reject(new Error("No se pudo iniciar la geolocalización en este navegador."));
    }
  });
}
