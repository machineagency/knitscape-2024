import { GLOBAL_STATE, dispatch } from "../state";
import { html } from "lit-html";
import { MIN_SIM_SCALE, MAX_SIM_SCALE } from "../constants";
import { centerZoomSimulation } from "../actions/zoomFit";

export function simulationPane() {
  const { simPan, flipped, simScale, relax } = GLOBAL_STATE;
  return html` <div id="sim-container">
      <div
        style="transform: translate(${simPan.x}px, ${simPan.y}px)"
        class=${flipped ? "mirrored" : ""}>
        <canvas id="back" class=${flipped ? "top" : "bottom"}></canvas>
        <canvas id="mid" class="mid"></canvas>
        <canvas id="front" class=${flipped ? "bottom" : "top"}></canvas>
      </div>
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
      <button
        class="btn icon"
        @click=${() => centerZoomSimulation(simScale * 0.9)}>
        <i class="fa-solid fa-magnifying-glass-minus"></i>
      </button>
      <input
        type="range"
        min=${MIN_SIM_SCALE}
        max=${MAX_SIM_SCALE}
        step="0.1"
        .value=${String(simScale)}
        @input=${(e) => centerZoomSimulation(Number(e.target.value))} />
      <button
        class="btn icon"
        @click=${() => centerZoomSimulation(simScale * 1.1)}>
        <i class="fa-solid fa-magnifying-glass-plus"></i>
      </button>
      <button
        @click=${() => dispatch({ simPan: { x: 0, y: 0 }, simScale: 1 })}
        class="btn icon">
        <i class="fa-solid fa-expand"></i>
      </button>
    </div>`;
}
