import { GEO_TIMEOUT_MS, STORAGE_KEY } from "./config.js";
import {
  addSelection,
  clearSelection,
  generatePlaces,
  getState,
  removeSelection,
  setSelection,
  setUserLocation,
  toggleSelection,
} from "./data.js";
import { createMap } from "./map.js";
import { renderPlaces, setStatus } from "./ui.js";

const elements = {
  canvas: document.querySelector("#map-canvas"),
  list: document.querySelector("#nearby-list"),
  selected: document.querySelector("#selected-list"),
  status: document.querySelector("#status"),
  locate: document.querySelector("#locate-btn"),
  save: document.querySelector("#save-btn"),
  clear: document.querySelector("#clear-btn"),
};

const map = createMap(elements.canvas);

function refresh() {
  renderPlaces(elements.list, elements.selected);
}

function loadSavedSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) setSelection(parsed);
  } catch {
    // Ignorar datos inválidos o acceso bloqueado a localStorage.
  }
}

function saveSelection() {
  try {
    const { selected } = getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setStatus(elements.status, `Selección guardada (${selected.length})`);
  } catch {
    setStatus(elements.status, "No se pudo guardar en este navegador");
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    setStatus(elements.status, "Geolocalización no disponible; usando ubicación de ejemplo.");
    return;
  }

  setStatus(elements.status, "Buscando tu ubicación…");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserLocation(position.coords.latitude, position.coords.longitude, true);
      generatePlaces();
      refresh();
      setStatus(
        elements.status,
        `Ubicación real detectada (±${Math.round(position.coords.accuracy)} m)`,
      );
    },
    () => setStatus(elements.status, "No se pudo obtener tu ubicación; usando una de ejemplo."),
    { timeout: GEO_TIMEOUT_MS },
  );
}

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
  elements.locate.addEventListener("click", locateUser);

  elements.canvas.addEventListener("click", (event) => {
    const hit = map.hitTest(event.clientX, event.clientY);
    if (!hit) return;
    toggleSelection(hit.place.id);
    refresh();
  });
}

function bindSortable() {
  const Sortable = window.Sortable;
  if (!Sortable) {
    setStatus(elements.status, "No se pudo cargar el arrastre (SortableJS).");
    return;
  }

  const clearOver = () => elements.selected.classList.remove("over");

  Sortable.create(elements.list, {
    group: { name: "places", pull: "clone", put: false },
    sort: false,
    handle: ".drag-handle",
    draggable: ".place-card",
    onMove: clearOver,
    onEnd: clearOver,
  });

  Sortable.create(elements.selected, {
    group: { name: "places", pull: false, put: true },
    sort: false,
    handle: ".drag-handle",
    draggable: ".place-card",
    onMove: (event) => {
      elements.selected.classList.toggle("over", event.to === elements.selected);
    },
    onAdd: (event) => {
      addSelection(event.item.dataset.id);
      clearOver();
      requestAnimationFrame(refresh);
    },
    onEnd: clearOver,
  });
}

function init() {
  loadSavedSelection();
  generatePlaces();
  refresh();
  bindActions();
  bindSortable();
  map.start();
  setStatus(elements.status, "Ubicación de ejemplo. Pulsa “Mi ubicación” para usar la real.");
}

init();
