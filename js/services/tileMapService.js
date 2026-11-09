import { TILE_MAP } from "../config.js";

const tileCache = new Map();

/**
 * Comprueba que un valor sea un número finito.
 * @param {*} value - Valor a comprobar.
 * @returns {boolean} true si es un número válido.
 */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Calcula el centro de unos límites geográficos.
 * @param {{south: number, north: number, west: number, east: number}} bounds - Límites.
 * @returns {{lat: number, lon: number}|null} Centro o null sin límites.
 */
function boundsCenter(bounds) {
  if (!bounds) return null;
  return { lat: (bounds.south + bounds.north) / 2, lon: (bounds.west + bounds.east) / 2 };
}

/**
 * Limita el zoom al rango permitido.
 * @param {number} zoom - Zoom deseado.
 * @param {number} [fallback=TILE_MAP.zoom] - Zoom usado si el valor no es válido.
 * @returns {number} Zoom dentro del rango.
 */
export function clampZoom(zoom, fallback = TILE_MAP.zoom) {
  if (!isFiniteNumber(zoom)) return Math.min(TILE_MAP.maxZoom, Math.max(TILE_MAP.minZoom, fallback));
  return Math.min(TILE_MAP.maxZoom, Math.max(TILE_MAP.minZoom, zoom));
}

/**
 * Limita unas coordenadas al área indicada.
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @param {{south: number, north: number, west: number, east: number}|null} bounds - Límites.
 * @returns {{lat: number, lon: number}} Coordenadas limitadas.
 */
export function clampLatLonToBounds(lat, lon, bounds) {
  if (!bounds) {
    return {
      lat: isFiniteNumber(lat) ? lat : 0,
      lon: isFiniteNumber(lon) ? lon : 0,
    };
  }
  const safeLat = isFiniteNumber(lat) ? lat : (bounds.south + bounds.north) / 2;
  const safeLon = isFiniteNumber(lon) ? lon : (bounds.west + bounds.east) / 2;
  return {
    lat: Math.min(bounds.north, Math.max(bounds.south, safeLat)),
    lon: Math.min(bounds.east, Math.max(bounds.west, safeLon)),
  };
}

/**
 * Comprueba que una vista tenga latitud, longitud y zoom válidos.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista a validar.
 * @returns {boolean} true si la vista es válida.
 */
export function isValidView(view) {
  return Boolean(
    view && isFiniteNumber(view.lat) && isFiniteNumber(view.lon) && isFiniteNumber(view.zoom),
  );
}

/**
 * Convierte coordenadas del mundo a latitud y longitud.
 * @param {number} x - Coordenada X del mundo.
 * @param {number} y - Coordenada Y del mundo.
 * @param {number} zoom - Zoom de la proyección.
 * @returns {{lat: number, lon: number}} Coordenadas geográficas.
 */
function worldToLatLon(x, y, zoom) {
  const scale = TILE_MAP.tileSize * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lon };
}

/**
 * Convierte un píxel del mapa a latitud y longitud.
 * @param {number} px - Píxel horizontal.
 * @param {number} py - Píxel vertical.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista actual.
 * @param {number} width - Ancho del canvas.
 * @param {number} height - Alto del canvas.
 * @returns {{lat: number, lon: number}} Coordenadas geográficas.
 */
export function pixelToLatLon(px, py, view, width, height) {
  if (!isValidView(view) || ![px, py, width, height].every(isFiniteNumber) || width <= 0 || height <= 0) {
    return { lat: view?.lat, lon: view?.lon };
  }
  const center = projectLatLonToWorld(view.lat, view.lon, view.zoom);
  const worldX = center.x + (px - width / 2);
  const worldY = center.y + (py - height / 2);
  return worldToLatLon(worldX, worldY, view.zoom);
}

/**
 * Desplaza la vista según un movimiento en píxeles.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista actual.
 * @param {number} dx - Movimiento horizontal en píxeles.
 * @param {number} dy - Movimiento vertical en píxeles.
 * @param {number} width - Ancho del canvas.
 * @param {number} height - Alto del canvas.
 * @param {object} bounds - Límites geográficos.
 * @returns {{lat: number, lon: number, zoom: number}} Nueva vista.
 */
export function panViewByPixels(view, dx, dy, width, height, bounds) {
  if (!isValidView(view) || ![dx, dy, width, height].every(isFiniteNumber)) return view;
  const next = pixelToLatLon(width / 2 - dx, height / 2 - dy, view, width, height);
  const created = createView(next.lat, next.lon, view.zoom, bounds);
  return isValidView(created) ? created : view;
}

/**
 * Cambia el zoom manteniendo fijo un punto del mapa.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista actual.
 * @param {number} nextZoom - Zoom deseado.
 * @param {number} px - Píxel horizontal del punto fijo.
 * @param {number} py - Píxel vertical del punto fijo.
 * @param {number} width - Ancho del canvas.
 * @param {number} height - Alto del canvas.
 * @param {object} bounds - Límites geográficos.
 * @returns {{lat: number, lon: number, zoom: number}} Nueva vista.
 */
export function zoomViewAt(view, nextZoom, px, py, width, height, bounds) {
  if (!isValidView(view) || ![nextZoom, px, py, width, height].every(isFiniteNumber)) return view;
  const clampedZoom = clampZoom(nextZoom, view.zoom);
  if (clampedZoom === view.zoom) return view;
  const focus = pixelToLatLon(px, py, view, width, height);
  if (!isFiniteNumber(focus?.lat) || !isFiniteNumber(focus?.lon)) return view;
  const scale = TILE_MAP.tileSize * 2 ** clampedZoom;
  const worldX = ((focus.lon + 180) / 360) * scale;
  const sinLat = Math.sin((focus.lat * Math.PI) / 180);
  const safeSin = Math.min(0.9999, Math.max(-0.9999, sinLat));
  const worldY = (0.5 - Math.log((1 + safeSin) / (1 - safeSin)) / (4 * Math.PI)) * scale;
  const centerWorldX = worldX - (px - width / 2);
  const centerWorldY = worldY - (py - height / 2);
  const center = worldToLatLon(centerWorldX, centerWorldY, clampedZoom);
  const created = createView(center.lat, center.lon, clampedZoom, bounds);
  return isValidView(created) ? created : view;
}

/**
 * Construye la URL de un tile.
 * @param {number} z - Nivel de zoom.
 * @param {number} x - Columna del tile.
 * @param {number} y - Fila del tile.
 * @returns {string} URL del tile.
 */
function tileUrl(z, x, y) {
  return TILE_MAP.urlTemplate
    .replace("{z}", z)
    .replace("{x}", x)
    .replace("{y}", y);
}

/**
 * Crea una vista válida y dentro de los límites.
 * @param {number} lat - Latitud del centro.
 * @param {number} lon - Longitud del centro.
 * @param {number} [zoom=TILE_MAP.zoom] - Nivel de zoom.
 * @param {object} bounds - Límites geográficos.
 * @returns {{lat: number, lon: number, zoom: number}} Vista creada.
 */
export function createView(lat, lon, zoom = TILE_MAP.zoom, bounds) {
  const clamped = clampLatLonToBounds(lat, lon, bounds);
  return { lat: clamped.lat, lon: clamped.lon, zoom: clampZoom(zoom) };
}

/**
 * Proyecta latitud y longitud a píxeles del canvas.
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista actual.
 * @param {number} width - Ancho del canvas.
 * @param {number} height - Alto del canvas.
 * @returns {{x: number, y: number}} Posición en píxeles.
 */
export function projectLatLon(lat, lon, view, width, height) {
  if (!isValidView(view) || ![lat, lon, width, height].every(isFiniteNumber)) {
    return { x: 0, y: 0 };
  }
  const scale = TILE_MAP.tileSize * 2 ** view.zoom;
  const worldX = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const safeSin = Math.min(0.9999, Math.max(-0.9999, sinLat));
  const worldY = (0.5 - Math.log((1 + safeSin) / (1 - safeSin)) / (4 * Math.PI)) * scale;
  const center = projectLatLonToWorld(view.lat, view.lon, view.zoom);
  return {
    x: width / 2 + (worldX - center.x),
    y: height / 2 + (worldY - center.y),
  };
}

/**
 * Proyecta latitud y longitud a coordenadas del mundo.
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @param {number} zoom - Nivel de zoom.
 * @returns {{x: number, y: number}} Coordenadas del mundo.
 */
function projectLatLonToWorld(lat, lon, zoom) {
  const scale = TILE_MAP.tileSize * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const safeSin = Math.min(0.9999, Math.max(-0.9999, sinLat));
  const y = (0.5 - Math.log((1 + safeSin) / (1 - safeSin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Carga un tile desde la caché o desde la red.
 * @param {string} url - URL del tile.
 * @returns {{status: string, image: HTMLImageElement|null}} Entrada de caché.
 */
function loadTile(url) {
  if (tileCache.has(url)) return tileCache.get(url);
  const entry = { status: "loading", image: null };
  tileCache.set(url, entry);
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.onload = () => {
    entry.status = "loaded";
    entry.image = image;
  };
  image.onerror = () => {
    entry.status = "error";
  };
  image.src = url;
  return entry;
}

/**
 * Dibuja los tiles visibles del mapa.
 * Usa el zoom continuo para proyectar, pero un zoom entero para pedir los tiles,
 * porque las URLs solo admiten niveles enteros.
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas.
 * @param {{lat: number, lon: number, zoom: number}} view - Vista actual.
 * @param {number} width - Ancho del canvas.
 * @param {number} height - Alto del canvas.
 */
export function drawTileLayer(ctx, view, width, height) {
  if (!isValidView(view) || ![width, height].every(isFiniteNumber) || width <= 0 || height <= 0) return;
  const { tileSize } = TILE_MAP;
  const zoom = clampZoom(view.zoom);
  const baseZoom = Math.floor(zoom);
  const renderTileSize = tileSize * 2 ** (zoom - baseZoom);
  const center = projectLatLonToWorld(view.lat, view.lon, zoom);
  const topLeftX = center.x - width / 2;
  const topLeftY = center.y - height / 2;
  const startX = Math.floor(topLeftX / renderTileSize);
  const startY = Math.floor(topLeftY / renderTileSize);
  const endX = Math.floor((topLeftX + width) / renderTileSize);
  const endY = Math.floor((topLeftY + height) / renderTileSize);
  const maxTile = 2 ** baseZoom;
  if (![startX, startY, endX, endY, maxTile, renderTileSize].every(isFiniteNumber) || renderTileSize <= 0) return;

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      const url = tileUrl(baseZoom, wrappedX, y);
      const tile = loadTile(url);
      const dx = Math.round(x * renderTileSize - topLeftX);
      const dy = Math.round(y * renderTileSize - topLeftY);
      if (tile.status === "loaded" && tile.image) {
        ctx.drawImage(tile.image, dx, dy, renderTileSize, renderTileSize);
      } else {
        ctx.fillStyle = "rgba(120, 120, 120, 0.08)";
        ctx.fillRect(dx, dy, renderTileSize, renderTileSize);
      }
    }
  }
}
