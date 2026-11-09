import { ClearWeather } from "./ClearWeather.js";
import { CloudyWeather } from "./CloudyWeather.js";
import { DrizzleWeather } from "./DrizzleWeather.js";
import { FogWeather } from "./FogWeather.js";
import { PartlyCloudyWeather } from "./PartlyCloudyWeather.js";
import { RainWeather } from "./RainWeather.js";
import { StormWeather } from "./StormWeather.js";

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
 * @returns {import("./WeatherType.js").WeatherType} Tipo de clima.
 */
export function createWeatherType(code, precipitation = 0) {
  const Weather = CODE_TO_CLASS.get(code) ?? CloudyWeather;
  const type = new Weather();
  return precipitation > 0.1 && !type.isRaining ? new DrizzleWeather() : type;
}

/**
 * Crea el clima de respaldo usado cuando la API no responde.
 * @returns {import("./DrizzleWeather.js").DrizzleWeather} Clima de respaldo.
 */
export function createFallbackWeather() {
  return new DrizzleWeather();
}
