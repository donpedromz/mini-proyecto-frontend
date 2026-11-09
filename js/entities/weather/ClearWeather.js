import { DryWeather } from "./DryWeather.js";

/** Cielo despejado. */
export class ClearWeather extends DryWeather {
  static codes = [0];

  constructor() {
    super({ description: "Despejado", icon: "sun" });
  }
}
