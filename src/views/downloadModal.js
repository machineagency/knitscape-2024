import { html } from "lit-html";
import {
  downloadJSON,
  downloadSilverKnitTxt,
  downloadKniterate,
  downloadPunchcard,
} from "../actions/exporters";

import { punchCardSVG } from "./punchcard";
import { GLOBAL_STATE, dispatch } from "../state";
import { createRepeatImagedata } from "../utils";

function downloadBMP() {
  const canvas = document.getElementById("preview-canvas");
  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.bmp";
    link.click();
  }, "image/bmp");
}

function repeatPreview(bimp) {
  // Get the preview canvas element
  const canvas = document.getElementById("preview-canvas");
  if (!canvas) return;
  const container = canvas.parentNode;
  canvas.width = bimp.width;
  canvas.height = bimp.height;

  // Scale the canvas to fit the container (CSS scaling)
  const scaleHeight = container.clientHeight;
  const scaleFactor = scaleHeight / bimp.height;

  // Set CSS to scale the canvas to the desired height and maintain pixelation
  canvas.style.width = `${bimp.width * scaleFactor}px`; // Scale width proportionally
  canvas.style.height = `${scaleHeight}px`; // Scale height to fit container

  // Maintain pixelated look when scaled
  canvas.style.imageRendering = "pixelated";
  canvas.style.imageRendering = "crisp-edges"; // For older browsers (optional)

  const ctx = canvas.getContext("2d");
  const imageData = createRepeatImagedata(bimp);
  // Put the pixel data into the canvas context
  ctx.putImageData(imageData, 0, 0);
}

export function downloadModal() {
  repeatPreview(GLOBAL_STATE.repeats[0].bitmap);
  return html`<div class="modal">
    <div class="modal-content">
      <h2>Export Workspace</h2>
      <div style="display: flex; gap: 5px;">
        <button class="btn solid" @click=${() => downloadJSON()}>
          Workspace JSON
        </button>
      </div>

      <h2>Export Repeat</h2>
      <div style="display: flex; gap: 15px;">
        <canvas id="preview-canvas"> </canvas>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <button class="btn solid" @click=${() => downloadBMP()}>BMP</button>
          <button class="btn solid" @click=${() => downloadSilverKnitTxt()}>
            TXT (SilverKnit)
          </button>
          <button class="btn solid" @click=${() => downloadKniterate()}>
            TXT (Kniterate)
          </button>
        </div>
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
