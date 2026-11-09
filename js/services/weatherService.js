/**
 * Servicio para consultar el clima de Manizales mediante la API abierta Open-Meteo.
 */
import { createFallbackWeather, createWeatherType } from "../entities/weather/weatherFactory.js";

const MANIZALES_COORDS = { lat: 5.068, lon: -75.517 };
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${MANIZALES_COORDS.lat}&longitude=${MANIZALES_COORDS.lon}&current=temperature_2m,precipitation,weather_code`;

/**
 * Obtiene el clima en tiempo real de Manizales con fallback seguro offline.
 * @returns {Promise<{temperature: number, isRaining: boolean, description: string, icon: string, source: "live"|"fallback"}>}
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
    const temperature = Math.round(Number(current.temperature_2m ?? 17));
    const precipitation = Number(current.precipitation ?? 0);
    const type = createWeatherType(code, precipitation);

    return {
      temperature,
      isRaining: type.isRaining,
      description: type.description,
      icon: type.icon,
      source: "live",
    };
  } catch {
    clearTimeout(timeoutId);
    const fallback = createFallbackWeather();
    return {
      temperature: 16,
      isRaining: fallback.isRaining,
      description: fallback.description,
      icon: fallback.icon,
      source: "fallback",
    };
  }
}
