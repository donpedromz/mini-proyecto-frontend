import { RainyWeather } from "./RainyWeather.js";

/** Llovizna. */
export class DrizzleWeather extends RainyWeather {
  static codes = [51, 53, 55];

  constructor() {
    super({ description: "Llovizna ligera", icon: "cloud-drizzle" });
  }
}
