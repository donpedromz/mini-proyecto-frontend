import { DryWeather } from "./DryWeather.js";

/** Niebla. */
export class FogWeather extends DryWeather {
  static codes = [45, 48];

  constructor() {
    super({ description: "Niebla", icon: "cloud-fog" });
  }
}
