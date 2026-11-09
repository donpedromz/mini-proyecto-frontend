import { availablePlaces, distanceMeters, getState } from "./data.js";
import { getCategoryIconName, renderIcons } from "./services/icons.js";

/**
 * Devuelve la distancia al usuario en texto formateado.
 * @param {object} place - Lugar con latitud y longitud.
 * @returns {string} Distancia en metros o cadena vacía si no hay ubicación de referencia.
 */
function formatDistance(place) {
  const { me } = getState();
  if (!me) return "";
  return `${distanceMeters(place)} m`;
}

/**
 * Construye el elemento para representar un estado vacío.
 * @param {string} message - Mensaje a mostrar.
 * @returns {HTMLElement} Elemento de estado vacío.
 */
export function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

/**
 * Construye la tarjeta HTML de un lugar.
 * @param {object} place - Lugar a mostrar.
 * @param {"add"|"remove"} action - Acción del botón de la tarjeta ("add" o "remove").
 * @returns {HTMLElement} Tarjeta lista para insertar.
 */
export function createPlaceCard(place, action) {
  const card = document.createElement("div");
  card.className = "place-card";
  card.dataset.id = place.id;
  card.setAttribute("draggable", "true");

  const iconName = getCategoryIconName(place.category);
  const isAdd = action === "add";
  const actionLabel = isAdd ? `Agregar ${place.name}` : `Quitar ${place.name}`;
  const actionSymbol = isAdd ? "+" : "×";

  card.innerHTML = `
    <span class="drag-handle" data-id="${place.id}" aria-label="Arrastrar ${place.name}">⠿</span>
    <span class="icon" aria-hidden="true"><i data-lucide="${iconName}"></i></span>
    <div class="text">
      <b>${place.name}</b>
      <small>${formatDistance(place)}</small>
    </div>
    <button type="button" data-action="${action}" data-id="${place.id}" aria-label="${actionLabel}">${actionSymbol}</button>
  `;
  return card;
}

/**
 * Renderiza de manera reutilizable una lista de lugares en su contenedor.
 * @param {HTMLElement} container - Contenedor destino donde se insertarán las tarjetas.
 * @param {Array<object>} items - Lista de lugares a pintar.
 * @param {object} options - Opciones de configuración del renderizado.
 * @param {string} options.emptyText - Texto a mostrar si la lista está vacía.
 * @param {"add"|"remove"} options.action - Acción asignada a los botones de las tarjetas.
 */
export function renderPlaceList(container, items, { emptyText, action }) {
  container.replaceChildren();

  if (items.length === 0) {
    container.appendChild(createEmptyState(emptyText));
  } else {
    items.forEach((item) => {
      container.appendChild(createPlaceCard(item, action));
    });
  }

  renderIcons(container);
}

/**
 * Vuelve a pintar las listas de lugares disponibles y seleccionados.
 * @param {HTMLElement} listElement - Contenedor de lugares disponibles.
 * @param {HTMLElement} selectedElement - Contenedor de lugares seleccionados.
 */
export function renderPlaces(listElement, selectedElement) {
  const { selected, places } = getState();
  const available = places.length === 0 ? [] : availablePlaces();
  const emptyAvailableText = places.length === 0 
    ? "No hay lugares cargados." 
    : "Todos los lugares han sido seleccionados.";

  renderPlaceList(listElement, available, {
    emptyText: emptyAvailableText,
    action: "add",
  });

  renderPlaceList(selectedElement, selected, {
    emptyText: "Suelta aquí tus lugares favoritos",
    action: "remove",
  });
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
