import { html } from "lit-html";
import {
  downloadBMP,
  downloadSVG,
  downloadJSON,
  downloadSilverKnitTxt,
  downloadPNG,
  downloadKniterate,
  downloadPunchcard,
} from "../actions/exporters";

import { punchCardSVG } from "./punchcard";

import { GLOBAL_STATE, dispatch } from "../state";

export function downloadModal() {
  return html` <div class="modal">
    <div class="modal-content">
      <h2>Export Workspace</h2>
      <div style="display: flex; gap: 5px;">
        <button class="btn solid" @click=${() => downloadJSON()}>
          Workspace JSON
        </button>
      </div>
      <h2>Export Repeat</h2>
      <div style="display: flex; gap: 5px;">
        <button class="btn solid" @click=${() => downloadBMP()}>BMP</button>
        <button class="btn solid" @click=${() => downloadSilverKnitTxt()}>
          TXT (SilverKnit)
        </button>
        <button class="btn solid" @click=${() => downloadKniterate()}>
          TXT (Kniterate)
        </button>
      </div>
      <h2>Punchcard</h2>
      <p>Supports Brother/Taitexma 24-stitch punchcards.</p>
      <label class="form-control range">
        Vertical Repeats
        <input
          type="range"
          name="line-width"
          min="1"
          max="10"
          .value=${String(GLOBAL_STATE.punchVerticalRepeats)}
          @input=${(e) =>
            dispatch({
              punchVerticalRepeats: Number(e.target.value),
              rows:
                Number(e.target.value) * GLOBAL_STATE.repeats[0].bitmap.height,
            })} />
      </label>

      ${punchCardSVG()}
      <button class="btn solid" @click=${() => downloadPunchcard()}>
        Download Punchcard SVG
      </button>
    </div>
  </div>`;
}
