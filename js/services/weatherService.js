/**
 * Servicio para consultar y gestionar el clima de Manizales mediante la API abierta Open-Meteo.
 */

const MANIZALES_COORDS = { lat: 5.068, lon: -75.517 };
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${MANIZALES_COORDS.lat}&longitude=${MANIZALES_COORDS.lon}&current=temperature_2m,precipitation,weather_code`;

/** Clase base de un tipo de clima. */
class WeatherType {
  static codes = [];

  /**
   * Crea un tipo de clima.
   * @param {{description: string, icon: string, isRaining: boolean}} attributes - Atributos del clima.
   */
  constructor({ description, icon, isRaining }) {
    this.description = description;
    this.icon = icon;
    this.isRaining = isRaining;
  }
}

/** Clima sin lluvia. */
class DryWeather extends WeatherType {
  /**
   * Crea un clima seco.
   * @param {{description: string, icon: string}} attributes - Atributos del clima.
   */
  constructor({ description, icon }) {
    super({ description, icon, isRaining: false });
  }
}

/** Clima con lluvia. */
class RainyWeather extends WeatherType {
  /**
   * Crea un clima lluvioso.
   * @param {{description: string, icon: string}} attributes - Atributos del clima.
   */
  constructor({ description, icon }) {
    super({ description, icon, isRaining: true });
  }
}

/** Cielo despejado. */
class ClearWeather extends DryWeather {
  static codes = [0];

  constructor() {
    super({ description: "Despejado", icon: "sun" });
  }
}

/** Cielo parcialmente nublado. */
class PartlyCloudyWeather extends DryWeather {
  static codes = [1, 2];

  constructor() {
    super({ description: "Parcialmente nublado", icon: "cloud-sun" });
  }
}

/** Cielo cubierto. */
class CloudyWeather extends DryWeather {
  static codes = [3];

  constructor() {
    super({ description: "Clima templado", icon: "cloud" });
  }
}

/** Niebla. */
class FogWeather extends DryWeather {
  static codes = [45, 48];

  constructor() {
    super({ description: "Niebla", icon: "cloud-fog" });
  }
}

/** Llovizna. */
class DrizzleWeather extends RainyWeather {
  static codes = [51, 53, 55];

  constructor() {
    super({ description: "Llovizna ligera", icon: "cloud-drizzle" });
  }
}

/** Lluvia. */
class RainWeather extends RainyWeather {
  static codes = [61, 63, 65, 80, 81, 82];

  constructor() {
    super({ description: "Lluvia en Manizales", icon: "cloud-rain" });
  }
}

/** Tormenta eléctrica. */
class StormWeather extends RainyWeather {
  static codes = [95, 96, 99];

  constructor() {
    super({ description: "Tormenta eléctrica", icon: "cloud-lightning" });
  }
}

const WEATHER_CLASSES = [
  ClearWeather,
  PartlyCloudyWeather,
  CloudyWeather,
  FogWeather,
  DrizzleWeather,
  RainWeather,
  StormWeather,
];

const CODE_TO_CLASS = new Map(
  WEATHER_CLASSES.flatMap((Weather) => Weather.codes.map((code) => [code, Weather])),
);

/**
 * Crea el tipo de clima correspondiente a un código WMO.
 * @param {number} code - Código WMO de la Organización Meteorológica Mundial.
 * @param {number} [precipitation=0] - Precipitación en milímetros.
 * @returns {WeatherType} Tipo de clima.
 */
export function createWeatherType(code, precipitation = 0) {
  const Weather = CODE_TO_CLASS.get(code) ?? CloudyWeather;
  const type = new Weather();
  return precipitation > 0.1 && !type.isRaining ? new DrizzleWeather() : type;
}

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
    const fallback = new DrizzleWeather();
    return {
      temperature: 16,
      isRaining: fallback.isRaining,
      description: fallback.description,
      icon: fallback.icon,
      source: "fallback",
    };
  }
}
