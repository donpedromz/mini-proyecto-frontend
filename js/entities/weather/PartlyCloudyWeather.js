import { DryWeather } from "./DryWeather.js";

/** Cielo parcialmente nublado. */
export class PartlyCloudyWeather extends DryWeather {
  static codes = [1, 2];

  constructor() {
    super({ description: "Parcialmente nublado", icon: "cloud-sun" });
  }
}
