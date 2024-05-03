import { GLOBAL_STATE, dispatch } from "../state";
import { stitches } from "../constants";

function brush(startPos) {
  function onMove(newPos) {
    const updated = GLOBAL_STATE.repeat.line(
      { x: startPos.x, y: startPos.y },
      { x: newPos.x, y: newPos.y },
      stitches[GLOBAL_STATE.activeOp].id
    );

    startPos = newPos;
    dispatch({ repeat: updated });
  }

  onMove(startPos);
  return onMove;
}

function flood(startPos) {
  function onMove(newPos) {
    dispatch({
      repeat: GLOBAL_STATE.repeat.flood(
        newPos,
        stitches[GLOBAL_STATE.activeOp].id
      ),
    });
  }

  onMove(startPos);
  return onMove;
}

function rect(startPos) {
  const startBitmap = GLOBAL_STATE.repeat;
  function onMove(newPos) {
    const updated = startBitmap.rect(
      { x: startPos.x, y: startPos.y },
      { x: newPos.x, y: newPos.y },
      stitches[GLOBAL_STATE.activeOp].id
    );
    dispatch({ repeat: updated });
  }
  onMove(startPos);
  return onMove;
}

function line(startPos) {
  const startBitmap = GLOBAL_STATE.repeat;
  function onMove(newPos) {
    const updated = startBitmap.line(
      { x: startPos.x, y: startPos.y },
      { x: newPos.x, y: newPos.y },
      stitches[GLOBAL_STATE.activeOp].id
    );

    dispatch({ repeat: updated });
  }

  onMove(startPos);
  return onMove;
}

function shift(startPos) {
  const startBitmap = GLOBAL_STATE.repeat;

  function onMove(newPos) {
    dispatch({
      repeat: startBitmap.shift(startPos.x - newPos.x, startPos.y - newPos.y),
    });
  }
  onMove(startPos);
  return onMove;
}

export const repeatEditingTools = { brush, flood, line, rect, shift };
