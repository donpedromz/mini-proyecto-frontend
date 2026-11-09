import { WeatherType } from "./WeatherType.js";

/** Clima con lluvia. */
export class RainyWeather extends WeatherType {
  /**
   * Crea un clima lluvioso.
   * @param {{description: string, icon: string}} attributes - Atributos del clima.
   */
  constructor({ description, icon }) {
    super({ description, icon, isRaining: true });
  }
}
