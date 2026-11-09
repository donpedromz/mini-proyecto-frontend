import { RainyWeather } from "./RainyWeather.js";

/** Lluvia. */
export class RainWeather extends RainyWeather {
  static codes = [61, 63, 65, 80, 81, 82];

  constructor() {
    super({ description: "Lluvia en Manizales", icon: "cloud-rain" });
  }
}
