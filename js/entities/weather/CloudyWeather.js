import { DryWeather } from "./DryWeather.js";

/** Cielo cubierto. */
export class CloudyWeather extends DryWeather {
  static codes = [3];

  constructor() {
    super({ description: "Clima templado", icon: "cloud" });
  }
}
