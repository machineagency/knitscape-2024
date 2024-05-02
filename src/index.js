import { render } from "lit-html";
import Split from "split.js";

import { StateMonitor } from "./state";

import { fitChart } from "./actions/zoomFit";

import { view } from "./views/view";

import { yarnSequenceCanvas } from "./components/yarnSequenceCanvas";

// Chart View Canvas Layers
import { drawChartOnChange } from "./components/drawChart";

// Pointer/keyboard interaction
import { addKeypressListeners } from "./events/keypressEvents";
import { desktopPointerPanZoom } from "./events/desktopPointerPanZoom";
import { colorSequencePointerInteraction } from "./events/colorSequencePointerInteraction";
import { simulationPointerInteraction } from "./events/simulationPointerInteraction";

// Touch interaction
import { desktopTouchPanZoom } from "./events/desktopTouchPanZoom";
import { colorSequenceTouchInteraction } from "./events/colorSequenceTouchInteraction";
import { simulationTouchInteraction } from "./events/simulationTouchInteraction";

import { runSimulation } from "./components/runSimulation";
import { generateChart } from "./components/generateChart";
import { isMobile } from "./utils";

let desktop, yarnSequenceEditorCanvas, colorDragger, simContainer;

function r() {
  render(view(), document.body);
  window.requestAnimationFrame(r);
}

function initKeyboard() {
  addKeypressListeners();

  desktopPointerPanZoom(desktop);
  colorSequencePointerInteraction(yarnSequenceEditorCanvas, colorDragger);
  simulationPointerInteraction(simContainer);
}

function initTouch() {
  document.body.style.setProperty("--font-size", "1.1rem");

  desktopTouchPanZoom(desktop);
  colorSequenceTouchInteraction(yarnSequenceEditorCanvas, colorDragger);
  simulationTouchInteraction(simContainer);
}

function init() {
  r();

  yarnSequenceEditorCanvas = document.getElementById("yarn-sequence-canvas");
  desktop = document.getElementById("desktop");
  simContainer = document.getElementById("sim-container");
  colorDragger = document.getElementById("color-dragger");

  Split(["#chart-pane", "#sim-pane"], {
    sizes: [60, 40],
    minSize: 100,
    gutterSize: 11,
  });

  isMobile() ? initTouch() : initKeyboard();

  StateMonitor.register([
    yarnSequenceCanvas({
      canvas: yarnSequenceEditorCanvas,
    }),
    runSimulation(),
    generateChart(),
    drawChartOnChange(),
  ]);

  fitChart();
}

window.onload = init;
