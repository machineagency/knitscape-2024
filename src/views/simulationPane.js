import { GLOBAL_STATE } from "../state";
import { html } from "lit-html";
import { toggleFlip, fit, zoom, pan } from "../simulation/newSim/rendering";

export function simulationPane() {
  const { relax } = GLOBAL_STATE;
  return html`
    <div id="sim-container">
      <canvas @wheel=${zoom} @pointerdown=${pan} id="sim-canvas"></canvas>
    </div>
    <div class="panzoom-controls">
      <button
        @click=${() => {
          if (relax != null) relax();
        }}
        class="btn solid">
        relax
      </button>
      <button @click=${toggleFlip} class="btn solid">flip</button>
      <button @click=${fit} class="btn solid">fit</button>
    </div>
  `;
}
