import { GLOBAL_STATE, dispatch } from "../state";
import { MIN_SCALE, MAX_SCALE } from "../constants";

export function toggleFullscreen() {
  const doc = window.document;
  const docEl = doc.documentElement;

  const requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;

  const cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}

export function centerZoom(scale) {
  let bbox = document.getElementById("desktop").getBoundingClientRect();

  zoomAtPoint({ x: bbox.width / 2, y: bbox.height / 2 }, scale);
}

export function zoomAtPoint(pt, scale) {
  if (scale < MIN_SCALE || scale > MAX_SCALE) return;

  const start = {
    x: (pt.x - GLOBAL_STATE.chartPan.x) / GLOBAL_STATE.scale,
    y: (pt.y - GLOBAL_STATE.chartPan.y) / GLOBAL_STATE.scale,
  };

  dispatch({
    scale,
    chartPan: {
      x: Math.floor(pt.x - start.x * scale),
      y: Math.floor(pt.y - start.y * scale),
    },
  });
}

export function fitChart() {
  const { width, height } = document
    .getElementById("desktop")
    .getBoundingClientRect();

  const scale = Math.floor(
    0.9 *
      Math.min(
        Math.floor(width / GLOBAL_STATE.chart.width),
        Math.floor(height / GLOBAL_STATE.chart.height)
      )
  );

  dispatch({
    scale,
    chartPan: {
      x: Math.floor((width - scale * GLOBAL_STATE.chart.width) / 2),
      y: Math.floor((height - scale * GLOBAL_STATE.chart.height) / 2),
    },
  });
}

export function sizeCanvasToBitmap(canvas, bitmapWidth, bitmapHeight) {
  canvas.width = GLOBAL_STATE.scale * bitmapWidth;
  canvas.height = GLOBAL_STATE.scale * bitmapHeight;
  canvas.style.width = `${GLOBAL_STATE.scale * bitmapWidth}px`;
  canvas.style.height = `${GLOBAL_STATE.scale * bitmapHeight}px`;
}
