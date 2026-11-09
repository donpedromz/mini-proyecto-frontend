import { createIcons, icons } from "https://cdn.jsdelivr.net/npm/lucide@0.468.0/+esm";
import { CATEGORY_ICONS } from "../config.js";
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
export function getCategoryIconName(category) {
  return CATEGORY_ICONS[category] || "map-pin";
}
