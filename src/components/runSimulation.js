import { visualizeYarn } from "../simulation/newSim/yarnVisualization";
import { Swatch } from "../simulation/newSim/Swatch";

function generateYarnView(state) {
  if (state.stopSim) state.stopSim();
  if (state.simDraw) state.simDraw = null;

  let { stopSim, relax, draw } = visualizeYarn(
    new Swatch(state.chart, state.yarnSequence.data, state.rowMap),
    state.yarnPalette
  );

  state.stopSim = stopSim;
  state.simDraw = draw;
  state.relax = relax;
}

export function runSimulation() {
  return ({ state }) => {
    generateYarnView(state);

    return {
      syncState(state, changes) {
        const found = ["yarnPalette", "yarnSequence", "chart"].some((key) =>
          changes.includes(key)
        );

        if (found) {
          generateYarnView(state);
        }
      },
    };
  };
}
