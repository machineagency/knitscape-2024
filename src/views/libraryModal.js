import { html } from "lit-html";
import { loadLibraryPattern } from "../actions/importers";
import { PATTERN_LIBRARY } from "../constants";

export function libraryModal() {
  return html` <div id="library-modal" class="modal">
    <h2>Pattern Library</h2>
    <div class="modal-content">
      ${Object.entries(PATTERN_LIBRARY).map(
        ([path, _]) =>
          html`<div class="library-item">
            <span>${path.split("/").at(-1).split(".")[0]}</span>
            <button class="btn solid" @click=${() => loadLibraryPattern(path)}>
              <i class="fa-solid fa-upload"></i>
            </button>
          </div>`
      )}
    </div>
  </div>`;
}
