import { GLOBAL_STATE, dispatch } from "../state";
import { colorSequencePosAtCoords } from "../utils";

function brushColor(e, colorCanvas) {
  let pos = colorSequencePosAtCoords(e, colorCanvas);
  dispatch({
    yarnSequence: GLOBAL_STATE.yarnSequence.brush(
      { x: pos.x, y: pos.y },
      GLOBAL_STATE.activeYarn
    ),
  });

  function move(e) {
    let newPos = colorSequencePosAtCoords(e, colorCanvas);
    if (newPos.x == pos.x && newPos.y == pos.y) return;

    const updated = GLOBAL_STATE.yarnSequence.line(
      { x: pos.x, y: pos.y },
      { x: newPos.x, y: newPos.y },
      GLOBAL_STATE.activeYarn
    );

    dispatch({ yarnSequence: updated });

    pos = newPos;
  }

  function end() {
    colorCanvas.removeEventListener("pointermove", move);
    colorCanvas.removeEventListener("pointerup", end);
    colorCanvas.removeEventListener("pointerleave", end);
  }

  colorCanvas.addEventListener("pointermove", move);
  colorCanvas.addEventListener("pointerup", end);
  colorCanvas.addEventListener("pointerleave", end);
}

function resizeColorCanvas(e) {
  const startSequence = GLOBAL_STATE.yarnSequence;
  const start = e.clientY;

  document.body.classList.add("grabbing");

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);

    document.body.classList.remove("grabbing");
  }

  function move(e) {
    let newSize =
      startSequence.height +
      Math.floor((start - e.clientY) / GLOBAL_STATE.scale);

    if (newSize < 1 || newSize == GLOBAL_STATE.yarnSequence.height) return;

    dispatch({
      yarnSequence: startSequence.resize(1, newSize, GLOBAL_STATE.activeYarn),
    });
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
}

export function colorSequencePointerInteraction(colorCanvas, resizeDragger) {
  colorCanvas.addEventListener("pointerdown", (e) => {
    // Ignore middle mouse button
    if (e.which == 2 || e.button == 4) return;

    brushColor(e, colorCanvas);
  });

  resizeDragger.addEventListener("pointerdown", (e) => {
    // Ignore middle mouse button
    if (e.which == 2 || e.button == 4) return;

    resizeColorCanvas(e);
  });
}
