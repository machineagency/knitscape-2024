import { html } from "lit-html";
import { dispatch, GLOBAL_STATE } from "../state";
import { repeatEditingTools } from "../actions/repeatEditingTools";
import { toolData } from "../constants";

export function repeatTools() {
  const { repeat, activeTool } = GLOBAL_STATE;
  return html` <div class="tool-picker">
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
  </div>`;
}
