import { html } from "lit-html";
import { GLOBAL_STATE, dispatch, undo } from "../state";
import { toggleFullscreen } from "../actions/zoomFit";
import { newPattern, uploadFile } from "../actions/importers";
import { fitChart } from "../actions/zoomFit";

function updateChartWidth(newWidth) {
  newWidth = newWidth > 500 ? 500 : newWidth;

  dispatch({
    chart: GLOBAL_STATE.chart.resize(newWidth, GLOBAL_STATE.chart.height),
  });

  fitChart();
}

function updateChartHeight(newHeight) {
  newHeight = newHeight > 500 ? 500 : newHeight;
  dispatch({
    chart: GLOBAL_STATE.chart.resize(GLOBAL_STATE.chart.width, newHeight),
  });

  fitChart();
}

export function taskbar() {
  const { chart, activeModal } = GLOBAL_STATE;
  return html`<div id="taskbar">
    <div class="site-title">swatchscape</div>
    <div id="chart-size-controls">
      <label>Width</label>
      <input
        class="input"
        type="number"
        .value=${chart.width}
        @change=${(e) => updateChartWidth(Number(e.target.value))}
        min="5"
        max="1000" />
      <label>Height</label>
      <input
        class="input"
        type="number"
        .value=${chart.height}
        @change=${(e) => updateChartHeight(Number(e.target.value))}
        min="5"
        max="1000" />
    </div>
    <div class="taskbar-buttons">
      <button class="btn" @click=${() => undo()}>
        <i class="fa-solid fa-rotate-left"></i>
      </button>
      <button class="btn" @click=${() => newPattern()}>
        <i class="fa-solid fa-file"></i>
      </button>
      <button class="btn" @click=${() => uploadFile()}>
        <i class="fa-solid fa-upload"></i>
      </button>
      <button
        class="btn ${activeModal == "download" ? "open" : ""}"
        @click=${() =>
          dispatch({
            activeModal: activeModal == "download" ? null : "download",
          })}>
        <i class="fa-solid fa-download"></i>
      </button>
      <button
        class="btn ${activeModal == "library" ? "open" : ""}"
        @click=${() =>
          dispatch({
            activeModal: activeModal == "library" ? null : "library",
          })}>
        <i class="fa-solid fa-book"></i>
      </button>
      <button
        class="btn ${activeModal == "settings" ? "open" : ""}"
        @click=${() =>
          dispatch({
            activeModal: activeModal == "settings" ? null : "settings",
          })}>
        <i class="fa-solid fa-gear"></i>
      </button>
      <button
        class="btn"
        @click=${() =>
          window.open("https://github.com/machineagency/swatchscape")}>
        <i class="fa-brands fa-github"></i>
      </button>

      <button class="btn" @click=${() => toggleFullscreen()}>
        <i
          class="fa-solid fa-${!window.document.fullscreenElement &&
          !window.document.mozFullScreenElement &&
          !window.document.webkitFullscreenElement &&
          !window.document.msFullscreenElement
            ? "up-right-and-down-left-from-center"
            : "down-left-and-up-right-to-center"}"></i>
      </button>
    </div>
  </div>`;
}
