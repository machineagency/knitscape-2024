import { html } from "lit-html";
import { GLOBAL_STATE, dispatch } from "../state";

import { chartTools } from "./chartTools";
import { leftBar } from "./leftBar";

import { posAtCoords } from "../utils";
import { repeatEditingTools } from "../actions/repeatEditingTools";
import { stitches } from "../constants";

function editRepeat(tool) {
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
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointerleave", end);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointerleave", end);
}

function resizeRepeat(e, direction) {
  // Ignore middle mouse button
  if (e.which == 2 || e.button == 4) return;

  const { repeat: startRepeat } = GLOBAL_STATE;
  const startPos = [e.clientX, e.clientY];

  document.body.classList.add("grabbing");

  const end = () => {
    window.removeEventListener("pointermove", onmove);
    window.removeEventListener("pointerup", end);

    document.body.classList.remove("grabbing");
  };

  const onmove = (e) => {
    let newWidth =
      direction == "right"
        ? startRepeat.width -
          Math.floor((startPos[0] - e.clientX) / GLOBAL_STATE.scale)
        : startRepeat.width;

    let newHeight =
      direction == "up"
        ? startRepeat.height +
          Math.floor((startPos[1] - e.clientY) / GLOBAL_STATE.scale)
        : startRepeat.height;

    if (newHeight < 1 || newWidth < 1) return;

    if (
      newWidth == GLOBAL_STATE.repeat.width &&
      newHeight == GLOBAL_STATE.repeat.height
    )
      return;

    dispatch({
      repeat: startRepeat
        .vFlip()
        .resize(newWidth, newHeight, stitches.KNIT.id)
        .vFlip(),
    });
  };

  window.addEventListener("pointermove", onmove);
  window.addEventListener("pointerup", end);
}

function chartPointer(e) {
  // Ignore middle mouse button
  if (e.which == 2 || e.button == 4) return;

  const activeTool = GLOBAL_STATE.activeTool;
  if (activeTool in repeatEditingTools) {
    editRepeat(repeatEditingTools[activeTool]);
  } else {
    console.warn(`Uh oh, ${activeTool} is not a tool`);
  }
}

function trackPointer(e) {
  const { x, y } = posAtCoords(e, e.target);
  const { repeat } = GLOBAL_STATE;

  dispatch({
    pos: { x, y },
    repeatPos: {
      x: x % repeat.width,
      y: repeat.height - (y % repeat.height) - 1,
    },
  });
}

export function chartPane() {
  const { chartPan, scale, repeat, chart } = GLOBAL_STATE;
  const repeatWidth = scale * repeat.width;
  const repeatHeight = scale * repeat.height;

  return html`<div id="chart-layout">
    ${leftBar()}
    <div id="desktop">
      <div style="transform: translate(${chartPan.x}px, ${chartPan.y}px);">
        <div id="yarn-sequence">
          <button id="color-dragger" class="btn solid grabber">
            <i class="fa-solid fa-grip"></i>
          </button>
          <canvas id="yarn-sequence-canvas"></canvas>
          <div
            class="grid overlay"
            style="--cell-width: ${scale}px;
           --cell-height: ${scale}px;"></div>
        </div>
        <canvas
          id="chart-canvas"
          @pointerdown=${chartPointer}
          @pointermove=${trackPointer}></canvas>
        <!-- <div
          class="grid overlay"
          style="--cell-width: ${repeatWidth}px;
           --cell-height: ${repeatHeight}px;
           --offset-y: ${scale * (chart.height % repeat.height)}px;"></div> -->
        <div
          class="overlay repeat-ui"
          style="width: ${repeatWidth}px; height: ${repeatHeight}px;">
          <button
            class="grabber dragger up"
            @pointerdown=${(e) => resizeRepeat(e, "up")}>
            <i class="fa-solid fa-angle-up"></i>
          </button>
          <button
            class="grabber dragger right"
            @pointerdown=${(e) => resizeRepeat(e, "right")}>
            <i class="fa-solid fa-angle-right"></i>
          </button>
        </div>
      </div>
    </div>
    ${chartTools()}
  </div>`;
}
