import { CITY_BOUNDS, GEO_MAX_AGE_MS, GEO_TIMEOUT_MS, STORAGE_KEY } from "./config.js";
import {
  addSelection,
  clearSelection,
  findPlace,
  getState,
  removeSelection,
  setPlaces,
  setReferenceLocation,
  setSelection,
  setUserLocation,
  toggleSelection,
} from "./data.js";
import { Place } from "./entities/Place.js";
import { isWithinBounds } from "./entities/geo.js";
import { showAlert } from "./services/alertService.js";
import { getCurrentPosition } from "./services/locationService.js";
import { getAll } from "./services/placesService.js";
import { renderIcons } from "./services/icons.js";
import { createMap } from "./map.js";
import { renderPlaces, updateWeatherUI } from "./ui.js";
import { getStoredItem, setStoredItem } from "./services/storageService.js";
import { setupDragAndDrop } from "./services/dragDropService.js";
import { getManizalesWeather } from "./services/weatherService.js";

let currentWeather = null;

const elements = {
  canvas: document.querySelector("#map-canvas"),
  list: document.querySelector("#nearby-list"),
  selected: document.querySelector("#selected-list"),
  locate: document.querySelector("#locate-btn"),
  save: document.querySelector("#save-btn"),
  clear: document.querySelector("#clear-btn"),
  weather: document.querySelector("#weather-btn"),
};

const map = createMap(elements.canvas, {
  onSelectPlace: (place) => {
    toggleSelection(place.id);
    refresh();
  },
});

/** Vuelve a pintar las listas de lugares. */
function refresh() {
  renderPlaces(elements.list, elements.selected);
}

/** Carga la selección guardada en el navegador. */
function loadSavedSelection() {
  const saved = getStoredItem(STORAGE_KEY, null);
  if (Array.isArray(saved)) {
    setSelection(saved.map((place) => Place.from(place)).filter(Boolean));
  } else if (saved !== null) {
    showAlert("No se pudo leer la selección guardada.");
  }
}

/** Guarda la selección actual en el navegador. */
function saveSelection() {
  const { selected } = getState();
  const saved = setStoredItem(STORAGE_KEY, selected);
  if (saved) {
    showAlert(`Selección guardada (${selected.length}).`);
  } else {
    showAlert("No se pudo guardar en este navegador.");
  }
}

/** Carga el catálogo de lugares y fija el centro de la ciudad. */
async function loadPlaces() {
  elements.list.setAttribute("aria-busy", "true");
  try {
    const { places, center, meta } = await getAll();
    setPlaces(places);
    if (!getState().me) {
      setReferenceLocation(center.lat, center.lon);
    }
    refresh();
    void meta;
  } finally {
    elements.list.removeAttribute("aria-busy");
  }
}

/** Pide la ubicación al navegador y centra el mapa en ella. */
async function locateUser() {
  if (!elements.locate || elements.locate.disabled) return;
  elements.locate.disabled = true;
  elements.locate.setAttribute("aria-busy", "true");

  try {
    const { lat, lon, accuracy } = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: GEO_TIMEOUT_MS,
      maximumAge: GEO_MAX_AGE_MS,
    });
    setUserLocation(lat, lon, accuracy);

    if (!isWithinBounds(lat, lon, CITY_BOUNDS)) {
      showAlert("Tu ubicación está fuera de Manizales; el mapa sigue centrado en la ciudad.");
      return;
    }

    setReferenceLocation(lat, lon);
    map.recenter(lat, lon);
    refresh();
    const accuracyText =
      Number.isFinite(accuracy) && accuracy > 0 ? ` (precisión ±${Math.round(accuracy)} m)` : "";
    showAlert(`Ubicación actualizada${accuracyText}.`);
  } catch (error) {
    showAlert(`No se pudo obtener tu ubicación: ${error.message}`);
  } finally {
    elements.locate.disabled = false;
    elements.locate.removeAttribute("aria-busy");
  }
}

/**
 * Evalúa las reglas de recomendación meteorológica al agregar un lugar.
 * @param {string} id - Identificador del lugar añadido.
 */
function checkWeatherRules(id) {
  const place = findPlace(id);
  if (!place || !currentWeather) return;

  if (currentWeather.isRaining) {
    if (place.outdoor) {
      showAlert(`Está lloviendo en Manizales: recuerda llevar paraguas para visitar ${place.name}.`);
    } else {
      showAlert(`${place.name} es un espacio techado ideal para resguardarse de la lluvia.`);
    }
  } else if (!place.outdoor) {
    showAlert(`${place.name} agregado a tu selección.`);
  } else {
    showAlert(`Buen clima para disfrutar ${place.name} al aire libre.`);
  }
}

/** Carga el estado del clima real de Manizales. */
async function loadWeather() {
  currentWeather = await getManizalesWeather();
  updateWeatherUI(currentWeather);
  map.setWeather?.(currentWeather);
}

/** Alterna manualmente entre modo lluvia y soleado para demostración del docente. */
function toggleWeatherSimulation() {
  if (!currentWeather) return;
  const isRainingNow = !currentWeather.isRaining;
  currentWeather = {
    ...currentWeather,
    isRaining: isRainingNow,
    temperature: isRainingNow ? 15 : 21,
    description: isRainingNow ? "Lluvia simulada" : "Soleado simulado",
    icon: isRainingNow ? "cloud-rain" : "sun",
  };
  updateWeatherUI(currentWeather);
  map.setWeather?.(currentWeather);
  showAlert(
    isRainingNow
      ? "Modo lluvia activado: se alertará sobre lugares al aire libre."
      : "Modo soleado activado: excelente clima para recorrer la ciudad.",
  );
}

/** Conecta los botones de la barra de acciones. */
function bindActions() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "add") {
      if (addSelection(id)) {
        checkWeatherRules(id);
      }
    }
    if (action === "remove") removeSelection(id);
    refresh();
  });

  elements.save.addEventListener("click", saveSelection);
  elements.clear.addEventListener("click", () => {
    clearSelection();
    refresh();
  });
  elements.locate.addEventListener("click", () => {
    locateUser();
  });
  elements.weather?.addEventListener("click", toggleWeatherSimulation);
}

/** Conecta la interacción de arrastrar y soltar nativa entre las listas. */
function bindDragAndDrop() {
  setupDragAndDrop({
    sourceContainer: elements.list,
    targetContainer: elements.selected,
    onDrop: (id) => {
      if (addSelection(id)) {
        checkWeatherRules(id);
        refresh();
      }
    },
  });
}

/** Arranca la aplicación y carga los datos iniciales. */
async function init() {
  renderIcons(document);
  loadSavedSelection();
  refresh();
  bindActions();
  bindDragAndDrop();
  map.start();
  loadWeather();

  try {
    await loadPlaces();
  } catch (error) {
    showAlert(`No se pudieron cargar los lugares: ${error.message}`);
  }
}

init();
