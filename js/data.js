import { isValidLatLon } from "./entities/geo.js";

const state = {
  me: null,
  userLocation: null,
  places: [],
  selected: [],
};

/**
 * Calcula los metros que equivalen a un grado de longitud en una latitud.
 * @param {number} lat - Latitud en grados.
 * @returns {number} Metros por grado de longitud.
 */
export function metersPerLonDegree(lat) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

export const METERS_PER_LAT_DEGREE = 110540;

/** Devuelve el estado global de la aplicación. */
export function getState() {
  return state;
}

/**
 * Guarda la ubicación de referencia para calcular distancias y centrar el mapa.
 * @param {number} lat - Latitud en grados.
 * @param {number} lon - Longitud en grados.
 */
export function setReferenceLocation(lat, lon) {
  if (!isValidLatLon(lat, lon)) return;
  state.me = { lat, lon };
}

/**
 * Guarda la última ubicación real obtenida del navegador.
 * @param {number} lat - Latitud en grados.
 * @param {number} lon - Longitud en grados.
 * @param {number|null} [accuracy=null] - Precisión en metros.
 */
export function setUserLocation(lat, lon, accuracy = null) {
  if (!isValidLatLon(lat, lon)) return;
  state.userLocation = {
    lat,
    lon,
    accuracy: Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null,
  };
}

/**
 * Devuelve la última ubicación real del usuario, si existe.
 * @returns {{lat: number, lon: number, accuracy: number|null}|null} Ubicación real.
 */
export function getUserLocation() {
  return state.userLocation;
}

/**
 * Reemplaza el catálogo de lugares y descarta selecciones que ya no existen.
 * @param {Array<object>} places - Lugares disponibles.
 */
export function setPlaces(places) {
  state.places = Array.isArray(places) ? places : [];
  const knownIds = new Set(state.places.map((place) => place.id));
  state.selected = state.selected.filter((place) => knownIds.has(place.id));
}

/**
 * Calcula el desplazamiento en metros de un lugar respecto al usuario.
 * @param {object} place - Lugar con latitud y longitud.
 * @returns {{x: number, y: number}} Desplazamiento en metros.
 */
export function offsetFromUser(place) {
  if (!state.me) return { x: 0, y: 0 };
  return {
    x: (place.lon - state.me.lon) * metersPerLonDegree(state.me.lat),
    y: (place.lat - state.me.lat) * METERS_PER_LAT_DEGREE,
  };
}

/**
 * Calcula la distancia en metros entre el usuario y un lugar.
 * @param {object} place - Lugar con latitud y longitud.
 * @returns {number} Distancia redondeada en metros.
 */
export function distanceMeters(place) {
  if (!state.me) return 0;
  const { x, y } = offsetFromUser(place);
  return Math.round(Math.hypot(x, y));
}

/** Devuelve los lugares no seleccionados, ordenados por distancia. */
export function availablePlaces() {
  return state.places
    .filter((place) => !state.selected.some((selected) => selected.id === place.id))
    .sort((a, b) => distanceMeters(a) - distanceMeters(b));
}

/** Devuelve todos los lugares que deben dibujarse en el mapa. */
export function allMappablePlaces() {
  const extraSelected = state.selected.filter(
    (selected) => !state.places.some((place) => place.id === selected.id),
  );
  return [...state.places, ...extraSelected];
}

/**
 * Indica si un lugar está en la selección.
 * @param {string} id - Identificador del lugar.
 * @returns {boolean} true si está seleccionado.
 */
export function isSelected(id) {
  return state.selected.some((place) => place.id === id);
}

/**
 * Busca un lugar por id en el catálogo o en la selección.
 * @param {string} id - Identificador del lugar.
 * @returns {object|undefined} Lugar encontrado.
 */
export function findPlace(id) {
  return state.places.find((place) => place.id === id) || state.selected.find((place) => place.id === id);
}

/**
 * Añade un lugar a la selección.
 * @param {string} id - Identificador del lugar.
 * @returns {boolean} false si no existe o ya estaba seleccionado.
 */
export function addSelection(id) {
  if (isSelected(id)) return false;
  const place = state.places.find((item) => item.id === id);
  if (!place) return false;
  state.selected.push(place);
  return true;
}

/**
 * Quita un lugar de la selección.
 * @param {string} id - Identificador del lugar.
 * @returns {boolean} true si lo eliminó.
 */
export function removeSelection(id) {
  const before = state.selected.length;
  state.selected = state.selected.filter((place) => place.id !== id);
  return state.selected.length !== before;
}

/**
 * Añade o quita un lugar de la selección según su estado actual.
 * @param {string} id - Identificador del lugar.
 */
export function toggleSelection(id) {
  if (isSelected(id)) {
    removeSelection(id);
  } else {
    addSelection(id);
  }
}

/** Vacía la selección. */
export function clearSelection() {
  state.selected = [];
}

/**
 * Reemplaza la selección con una lista de lugares.
 * @param {Array<object>} items - Lugares a seleccionar.
 */
export function setSelection(items) {
  state.selected = Array.isArray(items) ? items : [];
}
