import { isValidCoordinate } from "./geo.js";

/** Entidad que representa un punto de interés del catálogo. */
export class Place {
  /**
   * Crea un lugar con el contrato completo.
   * @param {{id: string, name: string, category?: string, outdoor?: boolean, lat: number, lon: number, source?: string}} data - Datos del lugar.
   */
  constructor({ id, name, category = "turismo", outdoor = true, lat, lon, source = "seed" }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.outdoor = outdoor;
    this.lat = lat;
    this.lon = lon;
    this.source = source;
  }

  /**
   * Normaliza un lugar recibido del catálogo.
   * @param {object} data - Lugar sin normalizar.
   * @returns {Place|null} Instancia válida o null si no cumple el contrato.
   */
  static from(data) {
    if (!data || typeof data.id !== "string" || typeof data.name !== "string") return null;
    if (!isValidCoordinate(data.lat) || !isValidCoordinate(data.lon)) return null;
    return new Place({
      id: data.id,
      name: data.name,
      category: typeof data.category === "string" ? data.category : "turismo",
      outdoor: typeof data.outdoor === "boolean" ? data.outdoor : true,
      lat: data.lat,
      lon: data.lon,
      source: data.source || "seed",
    });
  }
}
