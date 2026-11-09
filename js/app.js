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
    setStatus(elements.status, "No se pudo leer la selección guardada.", "error");
  }
}
function saveSelection() {
  try {
    const { selected } = getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setStatus(elements.status, `Selección guardada (${selected.length})`);
  } catch {
    setStatus(elements.status, "No se pudo guardar en este navegador", "error");
  }
}
async function loadPlaces() {
  setStatus(elements.status, `Cargando puntos de ${CITY.label}…`);
  const { places, center, meta } = await getAll();
  setPlaces(places);
  setReferenceLocation(center.lat, center.lon, false);
  refresh();
  void meta;
  setStatus(elements.status, "");
}
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
function bindDragAndDrop() {
  let drag = null;
  const isOverDropZone = (event) => {
    const rect = elements.selected.getBoundingClientRect();
    return (
      event.clientX > rect.left &&
      event.clientX < rect.right &&
      event.clientY > rect.top &&
      event.clientY < rect.bottom
    );
  };

  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".drag-handle");
    if (!handle || handle.closest("#selected-list")) return;

    const card = handle.closest(".place-card");
    if (!card) return;

    const ghost = card.cloneNode(true);
    ghost.classList.add("drag-ghost");
    document.body.appendChild(ghost);
    drag = { id: handle.dataset.id, ghost };
    moveGhost(event);
    event.preventDefault();
  });
  function moveGhost(event) {
    if (!drag) return;
    drag.ghost.style.left = `${event.clientX - 30}px`;
    drag.ghost.style.top = `${event.clientY - 20}px`;
    const over = isOverDropZone(event);
    elements.selected.classList.toggle("over", over);
    drag.over = over;
  }

  document.addEventListener("pointermove", moveGhost);
  document.addEventListener("pointerup", () => {
    if (!drag) return;
    if (drag.over) addSelection(drag.id);
    drag.ghost.remove();
    elements.selected.classList.remove("over");
    drag = null;
    refresh();
  });
}
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
