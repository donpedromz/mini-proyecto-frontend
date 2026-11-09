import { CITY_BOUNDS, LABEL_ZOOM_THRESHOLD, MAP_HIT_RADIUS_PX, TILE_MAP } from "./config.js";
import { allMappablePlaces, getState, isSelected } from "./data.js";
import {
  clampZoom,
  createView,
  drawTileLayer,
  isValidView,
  panViewByPixels,
  projectLatLon,
  zoomViewAt,
} from "./services/tileMapService.js";

/**
 * Lee una variable CSS del documento.
 * @param {string} name - Nombre de la variable.
 * @returns {string} Valor de la variable.
 */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Indica si dos rectángulos se superponen.
 * @param {{x: number, y: number, width: number, height: number}} a - Primer rectángulo.
 * @param {{x: number, y: number, width: number, height: number}} b - Segundo rectángulo.
 * @returns {boolean} true si se superponen.
 */
function rectsOverlap(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

/**
 * Crea la caja de una etiqueta centrada en su línea de texto.
 * @param {number} x - Posición horizontal.
 * @param {number} y - Posición vertical.
 * @param {number} width - Ancho de la etiqueta.
 * @param {number} height - Alto de la etiqueta.
 * @returns {{x: number, y: number, width: number, height: number}} Caja de la etiqueta.
 */
function labelBox(x, y, width, height) {
  return { x, y: y - height / 2, width, height };
}

/**
 * Crea el mapa interactivo sobre un canvas.
 * @param {HTMLCanvasElement} canvas - Canvas donde se dibuja el mapa.
 * @param {{onSelectPlace?: (place: object) => void}} [options={}] - Callbacks del mapa.
 * @returns {{start: Function, stop: Function, draw: Function, hitTest: Function, recenter: Function, setHover: Function, clearHover: Function}} Controlador del mapa.
 */
export function createMap(canvas, { onSelectPlace } = {}) {
  const ctx = canvas.getContext("2d");
  let points = [];
  let animationId = null;
  let hoveredId = null;
  let view = null;
  let suppressNextClick = false;

  const drag = { active: false, pointerId: null, startX: 0, startY: 0, moved: false };
  const pointers = new Map();
  let pinch = null;

  /** Devuelve la vista actual o crea una centrada en el usuario. */
  function ensureView() {
    if (isValidView(view)) return view;
    const { me } = getState();
    if (!me) return null;
    const next = createView(me.lat, me.lon, TILE_MAP.zoom, CITY_BOUNDS);
    view = isValidView(next) ? next : null;
    return view;
  }

  /**
   * Centra el mapa en unas coordenadas.
   * @param {number} lat - Latitud.
   * @param {number} lon - Longitud.
   * @param {number} [zoom] - Zoom; conserva el actual si se omite.
   */
  function recenter(lat, lon, zoom = view?.zoom ?? TILE_MAP.zoom) {
    const next = createView(lat, lon, zoom, CITY_BOUNDS);
    if (isValidView(next)) view = next;
  }

  /** Redibuja el canvas completo. */
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = cssVar("--map");
    ctx.fillRect(0, 0, width, height);

    const currentView = ensureView();
    if (!currentView) {
      points = [];
      return;
    }

    drawTileLayer(ctx, currentView, width, height);
    points = drawPlaces(ctx, currentView, width, height);
    drawUserMarker(ctx, width, height);
  }

  /** Dibuja el mapa en cada frame de animación. */
  function loop() {
    draw();
    animationId = requestAnimationFrame(loop);
  }

  /** Activa las interacciones y el bucle de dibujo. */
  function start() {
    bindInteractions();
    if (animationId == null) loop();
  }

  /** Detiene el bucle de dibujo. */
  function stop() {
    if (animationId != null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * Convierte coordenadas de pantalla a coordenadas del canvas.
   * @param {number} clientX - Coordenada X del puntero.
   * @param {number} clientY - Coordenada Y del puntero.
   * @returns {{x: number, y: number}} Posición en el canvas.
   */
  function localPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  /**
   * Busca el punto de interés más cercano al cursor.
   * @param {number} clientX - Coordenada X del puntero.
   * @param {number} clientY - Coordenada Y del puntero.
   * @returns {{place: object, x: number, y: number}|undefined} Punto encontrado.
   */
  function hitTest(clientX, clientY) {
    const { x, y } = localPoint(clientX, clientY);
    return points.find((point) => Math.hypot(point.x - x, point.y - y) < MAP_HIT_RADIUS_PX);
  }

  /**
   * Actualiza el punto resaltado y el cursor.
   * @param {number} clientX - Coordenada X del puntero.
   * @param {number} clientY - Coordenada Y del puntero.
   */
  function updateHover(clientX, clientY) {
    if (drag.active || pinch) return;
    const hit = hitTest(clientX, clientY);
    hoveredId = hit?.place.id ?? null;
    canvas.style.cursor = hit ? "pointer" : "grab";
  }

  /** Quita el resaltado del punto. */
  function clearHover() {
    hoveredId = null;
    if (!drag.active) canvas.style.cursor = "grab";
  }

  /** Inicia el gesto de pellizco con dos dedos. */
  function beginPinch() {
    if (pointers.size !== 2 || !isValidView(view)) return;
    const [a, b] = [...pointers.values()];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance < 2) return;
    pinch = {
      distance,
      zoom: view.zoom,
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
    drag.active = false;
    hoveredId = null;
  }

  /** Registra arrastre, pellizco, rueda y clic en el canvas. */
  function bindInteractions() {
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";

    canvas.addEventListener("pointerdown", (event) => {
      const point = localPoint(event.clientX, event.clientY);
      pointers.set(event.pointerId, point);

      if (pointers.size === 2) {
        beginPinch();
        return;
      }
      if (pointers.size > 2 || !view) return;

      drag.active = true;
      drag.pointerId = event.pointerId;
      drag.startX = point.x;
      drag.startY = point.y;
      drag.moved = false;
      canvas.setPointerCapture?.(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      const point = localPoint(event.clientX, event.clientY);
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point);

      if (pointers.size === 2 && isValidView(view)) {
        if (!pinch) beginPinch();
        if (!pinch || pinch.distance < 2) return;
        const [a, b] = [...pointers.values()];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (!Number.isFinite(distance) || distance < 2) return;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const nextZoom = pinch.zoom + Math.log2(distance / pinch.distance);
        if (!Number.isFinite(nextZoom)) return;
        const nextView = zoomViewAt(view, clampZoom(nextZoom, view.zoom), midX, midY, canvas.clientWidth, canvas.clientHeight, CITY_BOUNDS);
        if (isValidView(nextView)) view = nextView;
        canvas.style.cursor = "grabbing";
        return;
      }

      if (drag.active && event.pointerId === drag.pointerId && isValidView(view)) {
        const dx = point.x - drag.startX;
        const dy = point.y - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
        if (drag.moved) {
          const nextView = panViewByPixels(view, dx, dy, canvas.clientWidth, canvas.clientHeight, CITY_BOUNDS);
          if (isValidView(nextView)) view = nextView;
          drag.startX = point.x;
          drag.startY = point.y;
          hoveredId = null;
          canvas.style.cursor = "grabbing";
        }
        return;
      }

      updateHover(event.clientX, event.clientY);
    });

    /** Cierra un puntero y actualiza el estado del gesto. */
    function endPointer(event) {
      if (drag.active && event.pointerId === drag.pointerId) {
        if (drag.moved) suppressNextClick = true;
        drag.active = false;
        drag.pointerId = null;
        drag.moved = false;
      }
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0 && !drag.active) updateHover(event.clientX, event.clientY);
    }

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", (event) => {
      endPointer(event);
      clearHover();
    });
    canvas.addEventListener("pointerleave", () => {
      if (!drag.active && pointers.size === 0) clearHover();
    });

    canvas.addEventListener("click", (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      const hit = hitTest(event.clientX, event.clientY);
      if (hit) onSelectPlace?.(hit.place);
    });

    canvas.addEventListener(
      "wheel",
      (event) => {
        if (!isValidView(view)) return;
        event.preventDefault();
        const point = localPoint(event.clientX, event.clientY);
        const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
        const nextZoom = view.zoom + Math.log2(factor);
        if (!Number.isFinite(nextZoom)) return;
        const nextView = zoomViewAt(view, nextZoom, point.x, point.y, canvas.clientWidth, canvas.clientHeight, CITY_BOUNDS);
        if (isValidView(nextView)) view = nextView;
      },
      { passive: false },
    );
  }

  /**
   * Dibuja los puntos de interés y sus etiquetas.
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas.
   * @param {{lat: number, lon: number, zoom: number}} currentView - Vista actual.
   * @param {number} width - Ancho del canvas.
   * @param {number} height - Alto del canvas.
   * @returns {Array<{place: object, x: number, y: number}>} Puntos dibujados.
   */
  function drawPlaces(ctx, currentView, width, height) {
    const places = allMappablePlaces();
    const nextPoints = [];
    const candidates = [];
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textBaseline = "middle";

    places.forEach((place) => {
      const { x, y } = projectLatLon(place.lat, place.lon, currentView, width, height);
      const selected = isSelected(place.id);
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
      nextPoints.push({ place, x, y });

      ctx.beginPath();
      ctx.arc(x, y, selected ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = selected ? cssVar("--sel") : cssVar("--acc");
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      candidates.push({ place, x, y, selected, hovered: place.id === hoveredId });
    });

    const showAll = currentView.zoom >= LABEL_ZOOM_THRESHOLD;
    const toDraw = showAll ? candidates : candidates.filter((item) => item.hovered);
    toDraw.sort((a, b) => Number(b.hovered) - Number(a.hovered));

    const occupied = [];
    toDraw.forEach(({ place, x, y, selected, hovered }) => {
      const labelWidth = ctx.measureText(place.name).width + 14;
      const labelHeight = 20;
      const labelX = Math.min(Math.max(x - labelWidth / 2, 4), width - labelWidth - 4);
      const aboveY = y - 24;
      const labelY = aboveY < 14 ? y + 24 : aboveY;
      const box = labelBox(labelX, labelY, labelWidth, labelHeight);
      if (!hovered && occupied.some((other) => rectsOverlap(box, other))) return;
      occupied.push(box);

      ctx.fillStyle = cssVar("--card");
      ctx.beginPath();
      ctx.roundRect(labelX, labelY - 10, labelWidth, labelHeight, 10);
      ctx.fill();
      ctx.strokeStyle = selected ? cssVar("--sel") : cssVar("--line");
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = cssVar("--ink");
      ctx.fillText(place.name, labelX + 7, labelY);
    });

    return nextPoints;
  }

  /**
   * Dibuja el marcador pulsante del usuario.
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas.
   * @param {number} width - Ancho del canvas.
   * @param {number} height - Alto del canvas.
   */
  function drawUserMarker(ctx, width, height) {
    const { me } = getState();
    const currentView = view;
    if (!me || !currentView) return;
    const { x, y } = projectLatLon(me.lat, me.lon, currentView, width, height);
    if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
    const pulse = (Date.now() % 2000) / 2000;
    ctx.beginPath();
    ctx.arc(x, y, 8 + pulse * 18, 0, Math.PI * 2);
    ctx.fillStyle = cssVar("--me");
    ctx.globalAlpha = 0.3 * (1 - pulse);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = cssVar("--me");
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  return { start, stop, draw, hitTest, recenter, setHover: updateHover, clearHover };
}
