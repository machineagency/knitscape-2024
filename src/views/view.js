import { html } from "lit-html";
import { when } from "lit-html/directives/when.js";
import { GLOBAL_STATE, dispatch } from "../state";

import { taskbar } from "./taskbar";
import { downloadModal } from "./downloadModal";
import { libraryModal } from "./libraryModal";
import { settingsModal } from "./settingsModal";

import { simulationPane } from "./simulationPane";
import { chartPane } from "./chartPane";

export function view() {
  const { activeModal } = GLOBAL_STATE;
  return html`
    ${when(activeModal == "download", downloadModal)}
    ${when(activeModal == "library", libraryModal)}
    ${when(activeModal == "settings", settingsModal)} ${taskbar()}

    <div
      id="site"
      @pointerdown=${() =>
        dispatch({
          activeModal: null,
        })}>
      <div id="chart-pane">${chartPane()}</div>
      <div id="sim-pane">${simulationPane()}</div>
    </div>
  `;
}
