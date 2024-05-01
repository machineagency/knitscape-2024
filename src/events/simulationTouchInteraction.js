import { GLOBAL_STATE, dispatch } from "../state";

function pan(e) {
  const startPos = { x: e.clientX, y: e.clientY };
  const startPan = GLOBAL_STATE.simPan;

  function move(e) {
    const dx = startPos.x - e.touches[0].clientX;
    const dy = startPos.y - e.touches[0].clientY;

    dispatch({ simPan: { x: startPan.x - dx, y: startPan.y - dy } });
  }

  function end() {
    window.removeEventListener("touchmove", move);
    window.removeEventListener("touchcancel", end);
    window.removeEventListener("touchend", end);
  }

  window.addEventListener("touchmove", move);
  window.addEventListener("touchcancel", end);
  window.addEventListener("touchend", end);
}

export function simulationTouchInteraction(simContainer) {
  simContainer.addEventListener("touchstart", (e) => {
    pan(e.touches[0]);
  });
}
