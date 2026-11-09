import { availablePlaces, distanceMeters, getState } from "./data.js";
import { getCategoryIconName, renderIcons } from "./services/icons.js";

/**
 * Devuelve la distancia al usuario en texto.
 * @param {object} place - Lugar con latitud y longitud.
 * @returns {string} Distancia en metros o cadena vacía sin ubicación.
 */
function formatDistance(place) {
  const { me } = getState();
  if (!me) return "";
  return `${distanceMeters(place)} m`;
}

/**
 * Construye la tarjeta HTML de un lugar.
 * @param {object} place - Lugar a mostrar.
 * @param {"add"|"remove"} action - Acción del botón de la tarjeta.
 * @returns {HTMLElement} Tarjeta lista para insertar.
 */
function createPlaceCard(place, action) {
  const card = document.createElement("div");
  card.className = "place-card";
  const iconName = getCategoryIconName(place.category);
  card.innerHTML = `
    <span class="drag-handle" data-id="${place.id}" aria-label="Arrastrar ${place.name}">⠿</span>
    <span class="icon" aria-hidden="true"><i data-lucide="${iconName}"></i></span>
    <div class="text">
      <b>${place.name}</b>
      <small>${formatDistance(place)}</small>
    </div>
    <button type="button" data-action="${action}" data-id="${place.id}" aria-label="${
      action === "add" ? `Agregar ${place.name}` : `Quitar ${place.name}`
    }">${action === "add" ? "+" : "×"}</button>
  `;
  return card;
}

/**
 * Vuelve a pintar las listas de lugares disponibles y seleccionados.
 * @param {HTMLElement} listElement - Contenedor de lugares disponibles.
 * @param {HTMLElement} selectedElement - Contenedor de lugares seleccionados.
 */
export function renderPlaces(listElement, selectedElement) {
  const { selected, places } = getState();

  listElement.replaceChildren();
  if (places.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No hay lugares cargados.";
    listElement.appendChild(empty);
  } else {
    availablePlaces().forEach((place) => {
      listElement.appendChild(createPlaceCard(place, "add"));
    });
  }

  selectedElement.replaceChildren();
  if (selected.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Suelta aquí tus lugares favoritos";
    selectedElement.appendChild(empty);
  } else {
    selected.forEach((place) => {
      selectedElement.appendChild(createPlaceCard(place, "remove"));
    });
  }

  renderIcons(listElement);
  renderIcons(selectedElement);
}

/**
 * Muestra un mensaje de estado en la interfaz.
 * @param {HTMLElement} statusElement - Elemento donde se escribe el mensaje.
 * @param {string} message - Texto a mostrar.
 * @param {"info"|"error"} [type="info"] - Tipo de mensaje.
 */
export function setStatus(statusElement, message, type = "info") {
  statusElement.textContent = message;
  statusElement.dataset.type = type;
}
