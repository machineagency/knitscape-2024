import { GLOBAL_STATE, dispatch } from "../state";
import { zoomAtPoint } from "../actions/zoomFit";

function pan(e) {
  const startPos = { x: e.clientX, y: e.clientY };
  const startPan = GLOBAL_STATE.chartPan;

  function move(e) {
    if (e.buttons == 0) {
      end();
    } else {
      const dx = startPos.x - e.clientX;
      const dy = startPos.y - e.clientY;

      dispatch({
        chartPan: {
          x: Math.floor(startPan.x - dx),
          y: Math.floor(startPan.y - dy),
        },
      });
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

export function desktopPointerPanZoom(desktop) {
  desktop.addEventListener("pointerdown", (e) => {
    if (
      e.target == desktop ||
      e.target.id == "symbol-canvas" ||
      e.which == 2 ||
      e.button == 4
    ) {
      // Pan if dragging background or if middle mouse button is pressed
      pan(e);
    }
  });

  desktop.addEventListener("wheel", (e) => {
    const bounds = desktop.getBoundingClientRect();
    const { reverseScroll, scale } = GLOBAL_STATE;
    const dir = Math.sign(e.deltaY) < 0;

    const newScale = reverseScroll == dir ? scale - 1 : scale + 1;

    zoomAtPoint(
      {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      },
      newScale
    );
  });
}
