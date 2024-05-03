import { GLOBAL_STATE, dispatch, undo } from "../state";
import { toolData, stitches } from "../constants";

const ctrlShortcuts = {
  a: () => console.log("select all?"),
  z: () => undo(),
  s: () => dispatch({ activeModal: "download" }),
};

const hotkeys = {
  // grab the tools from the global tool constants and reformat them for the hotkeymap
  ...Object.fromEntries(
    Object.entries(toolData).map(([toolId, toolData]) => [
      toolData.hotkey,
      () => dispatch({ activeTool: toolId }),
    ])
  ),

  // Misc
  g: () => dispatch({ grid: !GLOBAL_STATE.grid }),

  // UI
  Escape: () => dispatch({ activeModal: null }),
};

function symbolSwitch(index) {
  if (index <= stitches.length) dispatch({ activeOp: index });
}

export function addKeypressListeners() {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() in ctrlShortcuts) {
      e.preventDefault();
      ctrlShortcuts[e.key.toLowerCase()]();
    } else if (e.key in hotkeys) hotkeys[e.key]();
    else if (/^[0-9]$/i.test(e.key)) symbolSwitch(Number(e.key) - 1);
    const newHeldKeys = new Set(GLOBAL_STATE.heldKeys);
    newHeldKeys.add(e.key);
    dispatch({ heldKeys: newHeldKeys });
  });

  window.addEventListener("keyup", (e) => {
    const newHeldKeys = new Set(GLOBAL_STATE.heldKeys);
    newHeldKeys.delete(e.key);
    dispatch({ heldKeys: newHeldKeys });
  });
}
