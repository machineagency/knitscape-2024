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

const tools = {
  brush(chart, [startX, startY]) {
    let lastCell = [startX, startY];
    let lastChart = chart;

    function onMove(newCell) {
      lastChart = lastChart.line(
        { x: lastCell[0], y: lastCell[1] },
        { x: newCell[0], y: newCell[1] },
        stitches.PURL.id
      );

      lastCell = newCell;
      return lastChart;
    }

    onMove(lastCell);
    return onMove;
  },
};

const state = {
  tool: "brush",
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

  let tool = tools[state.tool];
  let onEnterCell = tool(state.chart, lastCell);

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
    <div>interacting: ${pointerTracking.checkInteracting()}</div>`;
}

function r() {
  renderChart();
  window.requestAnimationFrame(r);
  render(view(), document.getElementById("ui"));
}

r();
