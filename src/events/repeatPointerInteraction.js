import { GLOBAL_STATE, dispatch } from "../state";
import { posAtCoords } from "../utils";

import { repeatEditingTools } from "../actions/repeatEditingTools";

function editRepeat(repeatCanvas, tool) {
  // tool onMove is not called unless pointer moves into another cell in the chart
  let pos = GLOBAL_STATE.repeatPos;

  let onMove = tool(pos);
  if (!onMove) return;

  function move(moveEvent) {
    if (moveEvent.buttons == 0) {
      end();
    } else {
      let newPos = GLOBAL_STATE.repeatPos;
      if (newPos.x == pos.x && newPos.y == pos.y) return;
      onMove(newPos);
      pos = newPos;
    }
  }

  function end() {
    repeatCanvas.removeEventListener("pointermove", move);
    repeatCanvas.removeEventListener("pointerup", end);
    repeatCanvas.removeEventListener("pointerleave", end);
  }

  repeatCanvas.addEventListener("pointermove", move);
  repeatCanvas.addEventListener("pointerup", end);
  repeatCanvas.addEventListener("pointerleave", end);
}

function resizeRepeat(e) {
  const { repeat: startRepeat } = GLOBAL_STATE;
  const startPos = [e.clientX, e.clientY];
  const resizeDragger = e.target;

  document.body.classList.add("grabbing");
  resizeDragger.classList.remove("grab");

  const end = () => {
    window.removeEventListener("pointermove", onmove);
    window.removeEventListener("pointerup", end);

    document.body.classList.remove("grabbing");
    resizeDragger.classList.add("grab");
  };

  const onmove = (e) => {
    let newWidth =
      startRepeat.width -
      Math.floor(
        (startPos[0] - e.clientX) / (GLOBAL_STATE.scale / devicePixelRatio)
      );

    let newHeight =
      startRepeat.height +
      Math.floor(
        (startPos[1] - e.clientY) / (GLOBAL_STATE.scale / devicePixelRatio)
      );

    if (newHeight < 1 || newWidth < 1) return;

    dispatch({
      repeat: startRepeat.vFlip().resize(newWidth, newHeight).vFlip(),
    });
  };

  window.addEventListener("pointermove", onmove);
  window.addEventListener("pointerup", end);
}

export function repeatPointerInteraction(repeatContainer) {
  repeatContainer.addEventListener("pointerdown", (e) => {
    let classList = e.target.classList;

    if (classList.contains("resize-repeat")) {
      resizeRepeat(e);
    } else if (classList.contains("repeat-canvas")) {
      // interacting with canvas
      const activeTool = GLOBAL_STATE.activeTool;
      if (activeTool in repeatEditingTools) {
        editRepeat(e.target, repeatEditingTools[activeTool]);
      } else {
        console.warn(`Uh oh, ${activeTool} is not a tool`);
      }
    }
  });

  repeatContainer.addEventListener("pointermove", (e) => {
    const { x, y } = posAtCoords(e, e.target);

    if (GLOBAL_STATE.pos.x != x || GLOBAL_STATE.pos.y != y) {
      dispatch({ repeatPos: { x, y } });
    }
  });
}
