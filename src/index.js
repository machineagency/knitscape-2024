import { render } from "lit-html";
import Split from "split.js";

import { StateMonitor, GLOBAL_STATE } from "./state";

import { fitChart } from "./actions/zoomFit";

import { view } from "./views/view";

import { yarnSequenceCanvas } from "./components/yarnSequenceCanvas";
import { drawChartOnChange } from "./components/drawChart";

// Pointer/keyboard interaction
import { addKeypressListeners } from "./events/keypressEvents";
import { desktopPointerPanZoom } from "./events/desktopPointerPanZoom";
import { colorSequencePointerInteraction } from "./events/colorSequencePointerInteraction";
import { runSimulation } from "./components/runSimulation";
import { generateChart } from "./components/generateChart";

let desktop, yarnSequenceEditorCanvas, colorDragger;

function r() {
  render(view(), document.body);

  if (GLOBAL_STATE.simDraw) GLOBAL_STATE.simDraw();

  window.requestAnimationFrame(r);
}

function init() {
  r();

  yarnSequenceEditorCanvas = document.getElementById("yarn-sequence-canvas");
  desktop = document.getElementById("desktop");
  colorDragger = document.getElementById("color-dragger");

  Split(["#chart-pane", "#sim-pane"], {
    sizes: [60, 40],
    minSize: 100,
    gutterSize: 11,
  });

  addKeypressListeners();
  desktopPointerPanZoom(desktop);
  colorSequencePointerInteraction(yarnSequenceEditorCanvas, colorDragger);

  StateMonitor.register([
    yarnSequenceCanvas({
      canvas: yarnSequenceEditorCanvas,
    }),

    generateChart(),
    drawChartOnChange(),
    runSimulation(),
  ]);

  fitChart();
}

window.onload = init;
