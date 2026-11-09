import { createIcons, icons } from "https://cdn.jsdelivr.net/npm/lucide@0.468.0/+esm";
import { CATEGORY_ICONS } from "../config.js";

/**
 * Convierte los elementos `data-lucide` en iconos SVG.
 * @param {HTMLElement|Document} [root=document] - Zona donde buscar iconos.
 */
export function renderIcons(root = document) {
  createIcons({
    icons,
    root,
    attrs: {
      class: "lucide-icon",
      "aria-hidden": "true",
      stroke: "currentColor",
      "stroke-width": "2",
    },
  });
}

/**
 * Devuelve el icono Lucide de una categoría.
 * @param {string} category - Categoría del lugar.
 * @returns {string} Nombre del icono.
 */
export function getCategoryIconName(category) {
  return CATEGORY_ICONS[category] || "map-pin";
}
