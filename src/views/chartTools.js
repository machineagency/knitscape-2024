import { html } from "lit-html";
import { GLOBAL_STATE, dispatch } from "../state";
import { MIN_SCALE, MAX_SCALE } from "../constants";
import { centerZoom, fitChart } from "../actions/zoomFit";
import { repeatEditingTools } from "../actions/repeatEditingTools";
import { toolData } from "../constants";

export function chartTools() {
  const { repeat, activeTool } = GLOBAL_STATE;

  return html` <div class="panzoom-controls">
    <span>${repeat.width} x ${repeat.height}</span>
    ${Object.keys(repeatEditingTools).map(
      (toolName) => html`<button
        class="btn solid ${activeTool == toolName ? "current" : ""}"
        @click=${() =>
          dispatch({
            activeTool: toolName,
          })}>
        <i class=${toolData[toolName].icon}></i>
      </button>`
    )}
    <button class="btn icon" @click=${() => centerZoom(GLOBAL_STATE.scale - 1)}>
      <i class="fa-solid fa-magnifying-glass-minus"></i>
    </button>
    <input
      type="range"
      min=${MIN_SCALE}
      max=${MAX_SCALE}
      .value=${String(GLOBAL_STATE.scale)}
      @input=${(e) => centerZoom(Number(e.target.value))} />
    <button class="btn icon" @click=${() => centerZoom(GLOBAL_STATE.scale + 1)}>
      <i class="fa-solid fa-magnifying-glass-plus"></i>
    </button>
    <button class="btn icon" @click=${fitChart}>
      <i class="fa-solid fa-expand"></i>
    </button>
  </div>`;
}
