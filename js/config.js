export const DEFAULT_LOCATION = { lat: 40.4168, lon: -3.7038 };

export const CATEGORY_ICONS = {
  museo: "🏛️",
  parque: "🌳",
  mercado: "🛒",
  salud: "🏥",
  cultura: "🎭",
  transporte: "🚉",
  edu: "🎓",
  mirador: "🔭",
};

export const BASE_PLACES = [
  ["Museo de la Ciudad", "museo"],
  ["Parque Central", "parque"],
  ["Mercado Municipal", "mercado"],
  ["Hospital General", "salud"],
  ["Teatro Municipal", "cultura"],
  ["Estación Central", "transporte"],
  ["Universidad", "edu"],
  ["Mirador del Cerro", "mirador"],
  ["Biblioteca Pública", "cultura"],
  ["Jardín Botánico", "parque"],
];

export const STORAGE_KEY = "lugares-sel";
export const GEO_TIMEOUT_MS = 8000;
export const MAP_HIT_RADIUS_PX = 14;
export const CANVAS_HEIGHT_PX = 320;
