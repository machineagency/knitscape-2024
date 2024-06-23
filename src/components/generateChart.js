import { GLOBAL_STATE, dispatch } from "../state";
import { Bimp } from "../lib/Bimp";
export function generateChart() {
  return ({ state }) => {
    let { repeats } = state;
    let width = state.chart.width;
    let height = state.chart.height;
    function regen() {
      let chart = Bimp.empty(
        GLOBAL_STATE.chart.width,
        GLOBAL_STATE.chart.height,
        0
      );
      for (const repeat of repeats) {
        let tiled = Bimp.fromTile(
          GLOBAL_STATE.chart.width,
          GLOBAL_STATE.chart.height,
          repeat.bitmap.vFlip()
        ).vFlip();
        chart = chart.overlay(tiled, repeat.pos);
      }
      dispatch({ chart });
    }
    regen();
    return {
      syncState(state) {
        if (
          repeats != state.repeats ||
          width != state.chart.width ||
          height != state.chart.height
        ) {
          repeats = state.repeats;
          width = state.chart.width;
          height = state.chart.height;
          regen();
        }
      },
    };
  };
}
