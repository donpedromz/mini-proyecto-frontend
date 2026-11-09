/**
 * Servicio para gestionar la API nativa de Drag & Drop de HTML5 de forma modular y reutilizable.
 */

/**
 * Conecta el comportamiento de arrastrar y soltar nativo entre un contenedor origen y un destino.
 * @param {object} config - Opciones de configuración.
 * @param {HTMLElement} config.sourceContainer - Contenedor cuyos elementos hijos serán arrastrables.
 * @param {HTMLElement} config.targetContainer - Zona donde se soltarán los elementos (drop zone).
 * @param {(id: string) => void} config.onDrop - Callback ejecutado con el ID del elemento soltado.
 * @param {string} [config.itemSelector=".place-card"] - Selector CSS de las tarjetas arrastrables.
 * @param {string} [config.overClass="over"] - Clase CSS aplicada a la zona al pasar por encima.
 * @param {string} [config.draggingClass="is-dragging"] - Clase CSS aplicada al elemento en arrastre.
 */
export function setupDragAndDrop({
  sourceContainer,
  targetContainer,
  onDrop,
  itemSelector = ".place-card",
  overClass = "over",
  draggingClass = "is-dragging",
}) {
  let draggedCard = null;

  sourceContainer.addEventListener("dragstart", (event) => {
    const card = event.target.closest(itemSelector);
    if (!card) return;

    draggedCard = card;
    card.classList.add(draggingClass);

    event.dataTransfer.setData("text/plain", card.dataset.id || "");
    event.dataTransfer.effectAllowed = "copy";
  });

  sourceContainer.addEventListener("dragend", () => {
    if (draggedCard) {
      draggedCard.classList.remove(draggingClass);
      draggedCard = null;
    }
  });

  targetContainer.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    targetContainer.classList.add(overClass);
  });

  targetContainer.addEventListener("dragleave", (event) => {
    if (!targetContainer.contains(event.relatedTarget)) {
      targetContainer.classList.remove(overClass);
    }
  });

  targetContainer.addEventListener("drop", (event) => {
    event.preventDefault();
    targetContainer.classList.remove(overClass);

    const id = event.dataTransfer.getData("text/plain");
    if (id && typeof onDrop === "function") {
      onDrop(id);
    }
  });
}
