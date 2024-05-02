import { html } from "lit-html";
import { GLOBAL_STATE, dispatch } from "../state";

export function settingsModal() {
  return html`<div id="settings-modal" class="modal">
    <h2>Settings</h2>

    <div class="modal-content">
      <label class="form-control toggle">
        <input
          type="checkbox"
          ?checked=${GLOBAL_STATE.reverseScroll}
          @change=${(e) => dispatch({ reverseScroll: e.target.checked })} />
        Invert Scroll
      </label>
    </div>
  </div>`;
}
