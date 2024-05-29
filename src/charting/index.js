import {
  initChart,
  updateChart,
  renderChart,
  fit,
  pan,
  zoom,
  updateMouse,
} from "./chartRenderer";
import { Bimp } from "../lib/Bimp";
import { pointerInteraction } from "./pointerInteraction";
import { html, render } from "lit-html";
import { stitches } from "../constants";

const chartCanvas = document.getElementById("chart");

const editingTools = {
  brush(chart, pos, st) {
    function onMove(currentPos) {
      chart = chart.line(pos, currentPos, st);
      pos = currentPos;
      return chart;
    }

    return onMove;
  },
  flood(chart, pos, st) {
    function onMove(currentPos) {
      chart = chart.flood(currentPos, st);
      return chart;
    }

    return onMove;
  },
  rect(chart, pos, st) {
    function onMove(currentPos) {
      return chart.rect(pos, currentPos, st);
    }
    return onMove;
  },
  line(chart, pos, st) {
    function onMove(currentPos) {
      return chart.line(pos, currentPos, st);
    }
    return onMove;
  },
  shift(chart, pos, st) {
    function onMove(currentPos) {
      return chart.shift(pos[0] - currentPos[0], pos[1] - currentPos[1]);
    }
    return onMove;
  },
};

const selectTools = {
  select(chart, pos) {
    function onMove(currentPos) {
      return chart.select(pos, currentPos);
    }

    return onMove;
  },
};

const state = {
  tool: "shift",
  stitch: stitches.PURL.id,
  chart: new Bimp(
    8,
    16,
    [
      1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1,
      5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5,
      1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1,
      5, 1, 1,
    ]
  ),
};

function dragTool(startPointerPos) {
  let lastCell = updateMouse(startPointerPos);

  let tool = editingTools[state.tool];
  let onEnterCell = tool(state.chart, lastCell, state.stitch);

  state.chart = onEnterCell(lastCell);
  updateChart(state.chart);

  function pointerMove(currentPointerPos) {
    let currentCell = updateMouse(currentPointerPos);

    if (currentCell[0] == lastCell[0] && currentCell[1] == lastCell[1]) return;

    state.chart = onEnterCell(currentCell);
    updateChart(state.chart);
    lastCell = currentCell;
  }

  return pointerMove;
}

const eventCBs = {
  drag: dragTool,
  hover: updateMouse,
  wheelDrag: pan,
  pinchDrag: pan,
  shiftDrag: pan,
  pinch: zoom,
  wheel: zoom,
};

const pointerTracking = pointerInteraction(chartCanvas, eventCBs);

initChart(state.chart, chartCanvas);
fit();

function view() {
  return html`<button @click=${fit}>Fit Chart</button>
    <div>pointers: ${pointerTracking.eventCache.length}</div>
    <div>interacting: ${pointerTracking.checkInteracting()}</div>
    <div>
      <label for="tools">Tool</label>
      <select
        name="tools"
        id="tools"
        @change=${(e) => (state.tool = e.target.value)}>
        ${Object.keys(editingTools).map(
          (toolName) =>
            html`<option ?selected=${state.tool == toolName} value=${toolName}>
              ${toolName}
            </option>`
        )}
      </select>
    </div>`;
}

function r() {
  renderChart();
  window.requestAnimationFrame(r);
  render(view(), document.getElementById("ui"));
}

r();
