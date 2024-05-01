import { html } from "lit-html";
import { GLOBAL_STATE } from "../state";

import { chartTools } from "./chartTools";
import { leftBar } from "./leftBar";

export function chartPane() {
  const { chartPan } = GLOBAL_STATE;

  return html` <div id="chart-layout">
    ${leftBar()}
    <div id="desktop">
      <div
        id="canvas-transform-group"
        style="transform: translate(${Math.floor(chartPan.x)}px, ${Math.floor(
          chartPan.y
        )}px);">
        <div id="yarn-sequence">
          <button id="color-dragger" class="btn solid grabber">
            <i class="fa-solid fa-grip"></i>
          </button>
          <canvas id="yarn-sequence-canvas"></canvas>
        </div>
        <canvas id="yarn-color-canvas"></canvas>
        <canvas id="symbol-canvas"></canvas>
        <canvas id="grid" class="grid-canvas"></canvas>
        <div id="repeat-container">
          <button class="btn solid resize-repeat grabber">
            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
          </button>
          <canvas id="repeat" class="repeat-canvas"></canvas>
          <canvas id="repeat-grid"></canvas>
        </div>
      </div>
    </div>
    ${chartTools()}
  </div>`;
}
