import { GLOBAL_STATE, dispatch } from "../state";
import { html } from "lit-html";
import { fit } from "../simulation/newSim/topdown";

export function simulationPane() {
  const { flipped, relax } = GLOBAL_STATE;
  return html` <div id="sim-container">
      <canvas id="sim-canvas"></canvas>
    </div>
    <div id="sim-controls" class="panzoom-controls">
      <button
        @click=${() => {
          if (relax != null) relax();
        }}
        class="btn solid">
        relax
      </button>
      <button @click=${() => dispatch({ flipped: !flipped })} class="btn solid">
        flip
      </button>
      <button @click=${fit} class="btn solid">fit</button>
    </div>`;
}
