import { WeatherType } from "./WeatherType.js";

/** Clima sin lluvia. */
export class DryWeather extends WeatherType {
  /**
   * Crea un clima seco.
   * @param {{description: string, icon: string}} attributes - Atributos del clima.
   */
  constructor({ description, icon }) {
    super({ description, icon, isRaining: false });
  }
}
