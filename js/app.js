import { CITY, GEO_TIMEOUT_MS, STORAGE_KEY } from "./config.js";
import {
  addSelection,
  clearSelection,
  getState,
  removeSelection,
  setPlaces,
  setReferenceLocation,
  setSelection,
  toggleSelection,
} from "./data.js";
import { getCurrentPosition } from "./services/locationService.js";
import { getAll } from "./services/placesService.js";
import { renderIcons } from "./services/icons.js";
import { createMap } from "./map.js";
import { renderPlaces, setStatus } from "./ui.js";
import { getStoredItem, setStoredItem } from "./services/storageService.js";
import { setupDragAndDrop } from "./services/dragDropService.js";

const elements = {
  canvas: document.querySelector("#map-canvas"),
  list: document.querySelector("#nearby-list"),
  selected: document.querySelector("#selected-list"),
  status: document.querySelector("#status"),
  locate: document.querySelector("#locate-btn"),
  save: document.querySelector("#save-btn"),
  clear: document.querySelector("#clear-btn"),
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
    setSelection(saved);
  } else if (saved !== null) {
    setStatus(elements.status, "No se pudo leer la selección guardada.", "error");
  }
}

/** Guarda la selección actual en el navegador. */
function saveSelection() {
  const { selected } = getState();
  const saved = setStoredItem(STORAGE_KEY, selected);
  if (saved) {
    setStatus(elements.status, `Selección guardada (${selected.length})`);
  } else {
    setStatus(elements.status, "No se pudo guardar en este navegador", "error");
  }
}

/** Carga el catálogo de lugares y fija el centro de la ciudad. */
async function loadPlaces() {
  setStatus(elements.status, `Cargando puntos de ${CITY.label}…`);
  const { places, center, meta } = await getAll();
  setPlaces(places);
  setReferenceLocation(center.lat, center.lon, false);
  refresh();
  void meta;
  setStatus(elements.status, "");
}

/** Pide la ubicación al navegador y centra el mapa en ella. */
async function locateUser() {
  setStatus(elements.status, "Buscando tu ubicación…");
  try {
    const position = await getCurrentPosition({ timeout: GEO_TIMEOUT_MS });
    setReferenceLocation(position.lat, position.lon, true);
    map.recenter(position.lat, position.lon);
    refresh();
    setStatus(elements.status, "");
  } catch (error) {
    setStatus(elements.status, `No se pudo obtener tu ubicación: ${error.message}`, "error");
  }
}

/** Conecta los botones de la barra de acciones. */
function bindActions() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "add") addSelection(id);
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

}

/** Conecta la interacción de arrastrar y soltar nativa entre las listas. */
function bindDragAndDrop() {
  setupDragAndDrop({
    sourceContainer: elements.list,
    targetContainer: elements.selected,
    onDrop: (id) => {
      if (addSelection(id)) {
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

  try {
    await loadPlaces();
  } catch (error) {
    setStatus(elements.status, `No se pudieron cargar los lugares: ${error.message}`, "error");
  }
}

init();
