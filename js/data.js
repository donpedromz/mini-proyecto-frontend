const state = {
  me: null,
  places: [],
  selected: [],
};
export function metersPerLonDegree(lat) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

export const METERS_PER_LAT_DEGREE = 110540;
export function getState() {
  return state;
}
export function setReferenceLocation(lat, lon, real = false) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  state.me = { lat, lon, real };
}
export function setPlaces(places) {
  state.places = Array.isArray(places) ? places : [];
  const knownIds = new Set(state.places.map((place) => place.id));
  state.selected = state.selected.filter((place) => knownIds.has(place.id));
}
export function offsetFromUser(place) {
  if (!state.me) return { x: 0, y: 0 };
  return {
    x: (place.lon - state.me.lon) * metersPerLonDegree(state.me.lat),
    y: (place.lat - state.me.lat) * METERS_PER_LAT_DEGREE,
  };
}
export function distanceMeters(place) {
  if (!state.me) return 0;
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
