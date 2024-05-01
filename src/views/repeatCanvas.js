import { html } from "lit-html";

export function repeatCanvas() {
  return html`<div id="repeat-container">
    <button class="btn solid resize-repeat grab">
      <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
    </button>
    <canvas id="repeat" class="repeat-canvas"></canvas>
    <canvas id="repeat-grid"></canvas>
  </div>`;
}
