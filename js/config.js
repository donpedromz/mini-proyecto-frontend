export const CITY = {
  label: "Manizales",
  country: "Colombia",
};

// Límites reales del perímetro urbano de Manizales (Nominatim / OpenStreetMap).
export const CITY_BOUNDS = {
  south: 5.0225297,
  north: 5.1048866,
  west: -75.5517477,
  east: -75.4203189,
};

export const PLACES_SEED_URL = "./data/places.manizales.json";

export const HTTP_TIMEOUT_MS = 10000;

export const TILE_MAP = {
  urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileSize: 256,
  zoom: 14,
  minZoom: 12,
  maxZoom: 18,
  attribution: "© OpenStreetMap contributors",
};

export const LABEL_ZOOM_THRESHOLD = 15;

export const CATEGORY_ICONS = {
  museo: "landmark",
  parque: "tree-pine",
  mercado: "shopping-basket",
  salud: "hospital",
  cultura: "drama",
  transporte: "train-front",
  edu: "graduation-cap",
  mirador: "binoculars",
  patrimonio: "landmark",
  turismo: "map-pin",
};

export const STORAGE_KEY = "lugares-sel";
export const GEO_TIMEOUT_MS = 10000;
export const GEO_MAX_AGE_MS = 30000;
export const MAP_HIT_RADIUS_PX = 14;
