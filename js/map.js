import { MAP_HIT_RADIUS_PX } from "./config.js";
import { allMappablePlaces, distanceMeters, isSelected, offsetFromUser } from "./data.js";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function createMap(canvas) {
  const ctx = canvas.getContext("2d");
  let points = [];
  let animationId = null;

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = cssVar("--map");
    ctx.fillRect(0, 0, width, height);

    const places = allMappablePlaces();
    const maxRadius = Math.max(600, ...places.map(distanceMeters)) * 1.1;
    const scale = Math.min(width, height) / 2 / maxRadius;
    const toX = (offset) => width / 2 + offset.x * scale;
    const toY = (offset) => height / 2 - offset.y * scale;

    drawWater(ctx, width, height);
    drawParks(ctx, width, height);
    drawRoads(ctx, width, height);
    points = drawPlaces(ctx, places, toX, toY, width);
    drawUserMarker(ctx, width, height);
  }

  function loop() {
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function start() {
    if (animationId == null) loop();
  }

  function stop() {
    if (animationId != null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return points.find((point) => Math.hypot(point.x - x, point.y - y) < MAP_HIT_RADIUS_PX);
  }

  return { start, stop, draw, hitTest };
}

function drawWater(ctx, width, height) {
  ctx.strokeStyle = cssVar("--water");
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, height * 0.78);
  ctx.bezierCurveTo(width * 0.3, height * 0.55, width * 0.6, height * 1.05, width + 10, height * 0.62);
  ctx.stroke();
}

function drawParks(ctx, width, height) {
  ctx.fillStyle = cssVar("--park");
  const parks = [
    [0.12, 0.1, 0.22, 0.2],
    [0.68, 0.12, 0.2, 0.26],
    [0.4, 0.62, 0.18, 0.2],
  ];
  parks.forEach(([x, y, w, h]) => {
    ctx.beginPath();
    ctx.roundRect(width * x, height * y, width * w, height * h, 14);
    ctx.fill();
  });
}

function drawRoads(ctx, width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(0.26);
  ctx.strokeStyle = cssVar("--road");
  for (let i = -8; i <= 8; i += 1) {
    ctx.lineWidth = i % 4 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(-width, i * 46);
    ctx.lineTo(width, i * 46);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i * 58, -height);
    ctx.lineTo(i * 58, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlaces(ctx, places, toX, toY, width) {
  const points = [];
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textBaseline = "middle";

  places.forEach((place) => {
    const offset = offsetFromUser(place);
    const x = toX(offset);
    const y = toY(offset);
    const selected = isSelected(place.id);
    points.push({ place, x, y });

    ctx.beginPath();
    ctx.arc(x, y, selected ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = selected ? cssVar("--sel") : cssVar("--acc");
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    const labelWidth = ctx.measureText(place.name).width + 14;
    const labelX = Math.min(Math.max(x - labelWidth / 2, 4), width - labelWidth - 4);
    const labelY = y - 24;
    ctx.fillStyle = cssVar("--card");
    ctx.beginPath();
    ctx.roundRect(labelX, labelY - 10, labelWidth, 20, 10);
    ctx.fill();
    ctx.strokeStyle = selected ? cssVar("--sel") : cssVar("--line");
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = cssVar("--ink");
    ctx.fillText(place.name, labelX + 7, labelY);
  });

  return points;
}

function drawUserMarker(ctx, width, height) {
  const pulse = (Date.now() % 2000) / 2000;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 8 + pulse * 18, 0, Math.PI * 2);
  ctx.fillStyle = cssVar("--me");
  ctx.globalAlpha = 0.3 * (1 - pulse);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = cssVar("--me");
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}
