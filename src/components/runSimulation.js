import { simulate } from "../simulation/yarnSimulation";
import { GLOBAL_STATE } from "../state";

let stopSim, relax;

function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

export function stopSimulation() {
  if (stopSim) stopSim();
}

export function runSimulation() {
  return ({ state }) => {
    let queueSim = false;

    function run() {
      queueSim = false;

      if (stopSim) stopSim();

      ({ stopSim, relax } = simulate(
        GLOBAL_STATE.chart,
        GLOBAL_STATE.yarnSequence.pixels,
        GLOBAL_STATE.yarnPalette,
        GLOBAL_STATE.simScale
      ));

      GLOBAL_STATE.relax = relax;
    }

    const debouncedRun = debounce(run, 30);

    run();

    return {
      syncState(state, changes) {
        const found = ["repeat", "yarnPalette", "yarnSequence", "chart"].some(
          (key) => changes.includes(key)
        );

        if (found) {
          debouncedRun();
        }

        if (changes.includes("simScale")) {
          run();
        }
      },
    };
  };
}
