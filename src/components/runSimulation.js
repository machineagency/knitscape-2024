import { visualizeYarn } from "../simulation/newSim/yarnVisualization";
import { Swatch } from "../simulation/newSim/Swatch";

function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

function generateYarnView(state) {
  if (state.stopSim) state.stopSim();

  let { stopSim, relax, draw } = visualizeYarn(
    new Swatch(state.chart, state.yarnSequence.pixels, state.rowMap),
    state.yarnPalette
  );

  state.stopSim = stopSim;
  state.simDraw = draw;
  state.relax = relax;
}

const debouncedYarnView = debounce(generateYarnView, 30);

export function runSimulation() {
  return ({ state }) => {
    generateYarnView(state);

    return {
      syncState(state, changes) {
        const found = ["yarnPalette", "yarnSequence", "chart"].some((key) =>
          changes.includes(key)
        );

        if (found) {
          // debouncedYarnView(state);
          generateYarnView(state);
        }
      },
    };
  };
}
