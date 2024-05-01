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
    document.body.classList.remove("grabbing");

    window.removeEventListener("pointermove", onmove);
    window.removeEventListener("pointerup", end);

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

export function moveRepeat(e, repeatIndex) {
  let repeat = GLOBAL_STATE.repeats[repeatIndex];

  const startRepeatPos = [...repeat.pos];
  const startPos = [e.clientX, e.clientY];

  const end = () => {
    window.removeEventListener("pointermove", onmove);
    window.removeEventListener("pointerup", end);
  };

  const onmove = (e) => {
    let newX =
      startRepeatPos[0] -
      Math.floor(
        (startPos[0] - e.clientX) / (GLOBAL_STATE.scale / devicePixelRatio)
      );

    let newY =
      startRepeatPos[1] +
      Math.floor(
        (startPos[1] - e.clientY) / (GLOBAL_STATE.scale / devicePixelRatio)
      );

    newX =
      newX < -(repeat.bitmap.width - 1) ? -(repeat.bitmap.width - 1) : newX;
    newY =
      newY < -(repeat.bitmap.height - 1) ? -(repeat.bitmap.height - 1) : newY;

    newX =
      newX > GLOBAL_STATE.chart.width - 1 ? GLOBAL_STATE.chart.width - 1 : newX;
    newY =
      newY > GLOBAL_STATE.chart.height - 1
        ? GLOBAL_STATE.chart.height - 1
        : newY;

    dispatch({
      repeats: [
        ...GLOBAL_STATE.repeats.slice(0, repeatIndex),
        {
          ...repeat,
          pos: [newX, newY],
        },
        ...GLOBAL_STATE.repeats.slice(repeatIndex + 1),
      ],
    });
  };

  window.addEventListener("pointermove", onmove);
  window.addEventListener("pointerup", end);
}

function editRepeatArea(e, repeatIndex, direction) {
  let repeat = GLOBAL_STATE.repeats[repeatIndex];
  const startSize = direction == "x" ? repeat.area[0] : repeat.area[1];
  const startPos = [e.clientX, e.clientY];
  const moveDragger = e.target;

  document.body.classList.add("grabbing");
  moveDragger.classList.remove("grab");

  const end = () => {
    document.body.classList.remove("grabbing");

    window.removeEventListener("pointermove", onmove);
    window.removeEventListener("pointerup", end);

    moveDragger.classList.add("grab");
  };

  const onmove = (e) => {
    let newSize, updated;
    if (direction == "x") {
      newSize =
        startSize -
        Math.floor(
          (startPos[0] - e.clientX) / (GLOBAL_STATE.scale / devicePixelRatio)
        );

      newSize = newSize < repeat.bitmap.width ? repeat.bitmap.width : newSize;

      updated = {
        ...repeat,
        area: [newSize, GLOBAL_STATE.repeats[repeatIndex].area[1]],
      };
    } else {
      newSize =
        startSize +
        Math.floor(
          (startPos[1] - e.clientY) / (GLOBAL_STATE.scale / devicePixelRatio)
        );

      newSize = newSize < repeat.bitmap.height ? repeat.bitmap.height : newSize;

      updated = {
        ...GLOBAL_STATE.repeats[repeatIndex],
        area: [GLOBAL_STATE.repeats[repeatIndex].area[0], newSize],
      };
    }

    dispatch({
      repeats: [
        ...GLOBAL_STATE.repeats.slice(0, repeatIndex),
        updated,
        ...GLOBAL_STATE.repeats.slice(repeatIndex + 1),
      ],
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
