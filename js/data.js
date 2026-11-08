import { BASE_PLACES, DEFAULT_LOCATION } from "./config.js";

const state = {
  me: { lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon, real: false },
  places: [],
  selected: [],
};

function createRng(seed) {
  let value = seed | 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function metersPerLonDegree(lat) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

export const METERS_PER_LAT_DEGREE = 110540;

export function getState() {
  return state;
}

export function setUserLocation(lat, lon, real = true) {
  state.me = { lat, lon, real };
}

export function generatePlaces() {
  // Sustituir por una llamada a una API real (Overpass, Places...)
  const random = createRng(7);
  const kx = metersPerLonDegree(state.me.lat);

  state.places = BASE_PLACES.map(([name, cat], index) => {
    const angle = random() * Math.PI * 2;
    const distanceMeters = 250 + random() * 1100;
    return {
      id: `p${index}`,
      name,
      cat,
      lat: state.me.lat + (Math.sin(angle) * distanceMeters) / METERS_PER_LAT_DEGREE,
      lon: state.me.lon + (Math.cos(angle) * distanceMeters) / kx,
    };
  });

  state.selected = state.selected.map(
    (saved) => state.places.find((place) => place.id === saved.id) || saved,
  );
}

export function offsetFromUser(place) {
  return {
    x: (place.lon - state.me.lon) * metersPerLonDegree(state.me.lat),
    y: (place.lat - state.me.lat) * METERS_PER_LAT_DEGREE,
  };
}

export function distanceMeters(place) {
  const { x, y } = offsetFromUser(place);
  return Math.round(Math.hypot(x, y));
}

export function availablePlaces() {
  return state.places
    .filter((place) => !state.selected.some((selected) => selected.id === place.id))
    .sort((a, b) => distanceMeters(a) - distanceMeters(b));
}

export function allMappablePlaces() {
  const extraSelected = state.selected.filter(
    (selected) => !state.places.some((place) => place.id === selected.id),
  );
  return [...state.places, ...extraSelected];
}

export function isSelected(id) {
  return state.selected.some((place) => place.id === id);
}

export function findPlace(id) {
  return state.places.find((place) => place.id === id) || state.selected.find((place) => place.id === id);
}

export function addSelection(id) {
  if (isSelected(id)) return false;
  const place = state.places.find((item) => item.id === id);
  if (!place) return false;
  state.selected.push(place);
  return true;
}

export function removeSelection(id) {
  const before = state.selected.length;
  state.selected = state.selected.filter((place) => place.id !== id);
  return state.selected.length !== before;
}

export function toggleSelection(id) {
  if (isSelected(id)) {
    removeSelection(id);
  } else {
    addSelection(id);
  }
}

export function clearSelection() {
  state.selected = [];
}

export function setSelection(items) {
  state.selected = Array.isArray(items) ? items : [];
}
