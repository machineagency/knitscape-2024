import { html } from "lit-html";
import { GLOBAL_STATE } from "../state";

import { chartTools } from "./chartTools";
import { leftBar } from "./leftBar";
import { repeatCanvas } from "./repeatCanvas";
import { repeatTools } from "./repeatTools";

export function chartPane() {
  const { chartPan } = GLOBAL_STATE;

  return html` <div id="chart-layout">
    ${leftBar()}

    <div id="desktop">
      ${repeatTools()}
      <div
        id="canvas-transform-group"
        style="transform: translate(${Math.floor(chartPan.x)}px, ${Math.floor(
          chartPan.y
        )}px);">
        <div id="yarn-sequence">
          <button id="color-dragger" class="btn solid grab">
            <i class="fa-solid fa-grip"></i>
          </button>
          <canvas id="yarn-sequence-canvas"></canvas>
        </div>
        <canvas id="yarn-color-canvas"></canvas>
        <canvas id="symbol-canvas"></canvas>
        <canvas id="grid" class="grid-canvas"></canvas>
        ${repeatCanvas()}
      </div>
    </div>
    ${chartTools()}
  </div>`;
}
