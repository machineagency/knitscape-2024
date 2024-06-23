import { GLOBAL_STATE, dispatch } from "./state";
import { posAtCoords } from "./utils";

export const editingTools = {
  brush(chart, pos, st) {
    function onMove(currentPos) {
      chart = chart.line(pos, currentPos, st);
      pos = currentPos;
      return chart;
    }

    return onMove;
  },
  flood(chart, pos, st) {
    function onMove(currentPos) {
      chart = chart.flood(currentPos, st);
      return chart;
    }

    return onMove;
  },
  rect(chart, pos, st) {
    function onMove(currentPos) {
      return chart.rect(pos, currentPos, st);
    }
    return onMove;
  },
  line(chart, pos, st) {
    function onMove(currentPos) {
      return chart.line(pos, currentPos, st);
    }
    return onMove;
  },
  shift(chart, pos, st) {
    function onMove(currentPos) {
      return chart.shift(pos[0] - currentPos[0], pos[1] - currentPos[1]);
    }
    return onMove;
  },
};

export function dragTool(startPointerPos) {
  let lastCell = posAtCoords(startPointerPos);

  let tool = editingTools[GLOBAL_STATE.tool];
  let onEnterCell = tool(GLOBAL_STATE.chart, lastCell, GLOBAL_STATE.stitch);

  // GLOBAL_STATE.chart = onEnterCell(lastCell);
  // updateChart(GLOBAL_STATE.chart);
  dispatch({ chart: onEnterCell(lastCell) });

  function pointerMove(currentPointerPos) {
    let currentCell = posAtCoords(currentPointerPos);

    if (currentCell[0] == lastCell[0] && currentCell[1] == lastCell[1]) return;

    // GLOBAL_STATE.chart = onEnterCell(currentCell);
    // updateChart(GLOBAL_STATE.chart);
    dispatch({ chart: onEnterCell(lastCell) });
    lastCell = currentCell;
  }

  return pointerMove;
}

export const eventCBs = {
  drag: dragTool,
  // hover: updateMouse,
  // wheelDrag: pan,
  // pinchDrag: pan,
  // shiftDrag: pan,
  // pinch: zoom,
  // wheel: zoom,
};
