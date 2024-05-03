import { GLOBAL_STATE, dispatch } from "../state";
import { Bimp } from "../lib/Bimp";

export function generateChart() {
  return ({ state }) => {
    let { repeat } = state;
    function regen() {
      let chart = Bimp.fromTile(
        GLOBAL_STATE.chart.width,
        GLOBAL_STATE.chart.height,
        GLOBAL_STATE.repeat.vFlip()
      );

      dispatch({ chart });
    }
    regen();

    return {
      syncState(state) {
        if (repeat != state.repeat) {
          repeat = state.repeat;
          regen();
        }
      },
    };
  };
}
