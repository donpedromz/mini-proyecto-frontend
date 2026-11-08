import { CATEGORY_ICONS } from "./config.js";
import { availablePlaces, distanceMeters, getState } from "./data.js";

function createPlaceCard(place, action) {
  const card = document.createElement("div");
  card.className = "place-card";
  card.innerHTML = `
    <span class="drag-handle" data-id="${place.id}" aria-label="Arrastrar ${place.name}">⠿</span>
    <span class="icon" aria-hidden="true">${CATEGORY_ICONS[place.cat] || "📍"}</span>
    <div class="text">
      <b>${place.name}</b>
      <small>${distanceMeters(place)} m</small>
    </div>
    <button type="button" data-action="${action}" data-id="${place.id}" aria-label="${
      action === "add" ? `Agregar ${place.name}` : `Quitar ${place.name}`
    }">${action === "add" ? "+" : "×"}</button>
  `;
  return card;
}

export function renderPlaces(listElement, selectedElement) {
  const { selected } = getState();

  listElement.replaceChildren();
  availablePlaces().forEach((place) => {
    listElement.appendChild(createPlaceCard(place, "add"));
  });

  selectedElement.replaceChildren();
  if (selected.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Suelta aquí tus lugares favoritos";
    selectedElement.appendChild(empty);
    return;
  }

  selected.forEach((place) => {
    selectedElement.appendChild(createPlaceCard(place, "remove"));
  });
}

export function setStatus(statusElement, message) {
  statusElement.textContent = message;
}
