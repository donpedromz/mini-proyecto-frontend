/**
 * Servicio para consultar y gestionar el clima de Manizales mediante la API abierta Open-Meteo.
 */

const MANIZALES_COORDS = { lat: 5.068, lon: -75.517 };
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${MANIZALES_COORDS.lat}&longitude=${MANIZALES_COORDS.lon}&current=temperature_2m,precipitation,weather_code`;

/**
 * Traduce un código meteorológico WMO a una descripción e indicador de lluvia.
 * @param {number} code - Código WMO de la Organización Meteorológica Mundial.
 * @returns {{description: string, isRaining: boolean, emoji: string}}
 */
export function parseWeatherCode(code) {
  if (code === 0) {
    return { description: "Despejado", isRaining: false, emoji: "☀️" };
  }
  if ([1, 2, 3].includes(code)) {
    return { description: "Parcialmente nublado", isRaining: false, emoji: "⛅" };
  }
  if ([45, 48].includes(code)) {
    return { description: "Niebla", isRaining: false, emoji: "🌫️" };
  }
  if ([51, 53, 55].includes(code)) {
    return { description: "Llovizna ligera", isRaining: true, emoji: "🌧️" };
  }
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return { description: "Lluvia en Manizales", isRaining: true, emoji: "🌧️" };
  }
  if ([95, 96, 99].includes(code)) {
    return { description: "Tormenta eléctrica", isRaining: true, emoji: "⛈️" };
  }
  return { description: "Clima templado", isRaining: false, emoji: "☁️" };
}

/**
 * Obtiene el clima en tiempo real de Manizales con fallback seguro offline.
 * @returns {Promise<{temperature: number, isRaining: boolean, description: string, emoji: string, source: "live"|"fallback"}>}
 */
export async function getManizalesWeather() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(WEATHER_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const code = Number(current.weather_code ?? 2);
    const parsed = parseWeatherCode(code);
    const temperature = Math.round(Number(current.temperature_2m ?? 17));
    const precipitation = Number(current.precipitation ?? 0);
    const isRaining = parsed.isRaining || precipitation > 0.1;

    return {
      temperature,
      isRaining,
      description: isRaining && !parsed.isRaining ? "Lluvia ligera" : parsed.description,
      emoji: isRaining ? "🌧️" : parsed.emoji,
      source: "live",
    };
  } catch {
    clearTimeout(timeoutId);
    // Fallback estándar típico de Manizales en caso de falta de conexión
    return {
      temperature: 16,
      isRaining: true,
      description: "Llovizna típica",
      emoji: "🌧️",
      source: "fallback",
    };
  }
}
