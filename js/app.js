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

function init() {
  loadSavedSelection();
  generatePlaces();
  refresh();
  bindActions();
  bindDragAndDrop();
  map.start();
  setStatus(elements.status, "Ubicación de ejemplo. Pulsa “Mi ubicación” para usar la real.");
}

init();
