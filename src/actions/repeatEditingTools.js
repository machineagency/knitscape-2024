import { GLOBAL_STATE, dispatch } from "../state";

function brush(startPos) {
  function onMove(newPos) {
    const updated = GLOBAL_STATE.repeat.line(
      { x: startPos.x, y: startPos.y },
      { x: newPos.x, y: newPos.y },
      GLOBAL_STATE.activeSymbol
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
      repeat: GLOBAL_STATE.repeat.flood(newPos, GLOBAL_STATE.activeSymbol),
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
      GLOBAL_STATE.activeSymbol
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
      GLOBAL_STATE.activeSymbol
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
