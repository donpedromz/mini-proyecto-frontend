import { PLACES_SEED_URL } from "../config.js";
import { api } from "./api.js";
function isValidCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function normalizePlace(place) {
  if (!place || typeof place.id !== "string" || typeof place.name !== "string") return null;
  if (!isValidCoordinate(place.lat) || !isValidCoordinate(place.lon)) return null;
  return {
    id: place.id,
    name: place.name,
    category: typeof place.category === "string" ? place.category : "turismo",
    lat: place.lat,
    lon: place.lon,
    source: place.source || "seed",
  };
}
function createPlacesError(error) {
  if (error?.response?.status) {
    return new Error(`HTTP ${error.response.status} al cargar el catálogo local de lugares.`);
  }
  if (error?.code === "ECONNABORTED") {
    return new Error("Tiempo de espera agotado al cargar el catálogo local de lugares.");
  }
  if (error instanceof Error && error.message) return error;
  return new Error("No se pudo cargar el catálogo local de lugares.");
}
export async function getAll() {
  try {
    const { data: seed } = await api.get(PLACES_SEED_URL);
    const places = Array.isArray(seed?.places) ? seed.places.map(normalizePlace).filter(Boolean) : [];
    const center = seed?.meta?.center;

    if (places.length === 0) {
      throw new Error("El catálogo local de lugares no contiene datos válidos.");
    }
    if (!isValidCoordinate(center?.lat) || !isValidCoordinate(center?.lon)) {
      throw new Error("El catálogo local no define un centro de referencia válido.");
    }

    return {
      meta: seed.meta || {},
      center: { lat: center.lat, lon: center.lon },
      places,
    };
  } catch (error) {
    throw createPlacesError(error);
  }
}
