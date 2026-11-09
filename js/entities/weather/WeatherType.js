/** Clase base de un tipo de clima. */
export class WeatherType {
  static codes = [];

  /**
   * Crea un tipo de clima.
   * @param {{description: string, icon: string, isRaining: boolean}} attributes - Atributos del clima.
   */
  constructor({ description, icon, isRaining }) {
    this.description = description;
    this.icon = icon;
    this.isRaining = isRaining;
  }
}
