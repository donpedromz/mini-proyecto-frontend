import { RainyWeather } from "./RainyWeather.js";

/** Tormenta eléctrica. */
export class StormWeather extends RainyWeather {
  static codes = [95, 96, 99];

  constructor() {
    super({ description: "Tormenta eléctrica", icon: "cloud-lightning" });
  }
}
