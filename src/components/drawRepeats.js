import { GLOBAL_STATE } from "../state";
import { SYMBOL_PATHS, SYMBOL_BITS } from "../constants";

export function drawRepeats() {
  return ({ state }) => {
    let { scale, symbolMap, repeat, symbolLineWidth } = state;

    let lastDrawn = repeat;

    function drawGrid() {
      if (!GLOBAL_STATE.grid) return;

      const gridCanvas = document.getElementById(`repeat-grid`);
      const ctx = gridCanvas.getContext("2d");
      const width = repeat.width;
      const height = repeat.height;

      if (scale < 15) {
        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        return;
      }

      ctx.save();
      ctx.translate(-0.5, -0.5);

      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, height * scale + 1);
      }

      for (let y = 0; y < height; y++) {
        ctx.moveTo(0, y * scale);
        ctx.lineTo(width * scale + 1, y * scale);
      }

      ctx.stroke();
      ctx.restore();
    }

    function scaleCanvas(width, height) {
      let canvases = [
        document.getElementById(`repeat`),
        document.getElementById(`repeat-grid`),
        document.getElementById(`repeat-outline`),
      ];

      canvases.forEach((canvas) => {
        if (canvas == null) {
          lastDrawn = null;
          return;
        }
        canvas.width = GLOBAL_STATE.scale * width;
        canvas.height = GLOBAL_STATE.scale * height;
        canvas.style.width = `${
          (GLOBAL_STATE.scale * width) / devicePixelRatio
        }px`;
        canvas.style.height = `${
          (GLOBAL_STATE.scale * height) / devicePixelRatio
        }px`;
      });
    }

    function draw() {
      // Draws only the pixels that have changed
      const ctx = document.getElementById(`repeat`).getContext("2d");
      ctx.imageSmoothingEnabled = false;

      ctx.lineWidth = 0.01 * symbolLineWidth;

      ctx.resetTransform();
      ctx.translate(-0.5, -0.5);

      const { repeat } = GLOBAL_STATE;

      for (let y = 0; y < repeat.height; y++) {
        for (let x = 0; x < repeat.width; x++) {
          let paletteIndex = repeat.pixel(x, y);

          if (lastDrawn == null || lastDrawn.pixel(x, y) != paletteIndex) {
            const symbol = symbolMap[paletteIndex];

            ctx.save();
            ctx.translate(x * scale, y * scale);
            ctx.scale(scale, scale);

            ctx.clearRect(0, 0, 1, 1);

            if (SYMBOL_BITS[symbol]) {
              // color the repeat black and white according to operations
              // TODO: make this a setting? what is the best way to represent this?
              ctx.fillStyle = "#fff";
              ctx.strokeStyle = "#000";
            } else {
              ctx.fillStyle = "#000";
              ctx.strokeStyle = "#fff";
            }
            ctx.fillRect(0, 0, 1, 1);

            ctx.stroke(SYMBOL_PATHS[symbol]);

            ctx.restore();
          }
        }
      }
      lastDrawn = repeat;
    }

    return {
      syncState(state) {
        const { repeat } = state;

        if (symbolLineWidth != state.symbolLineWidth) {
          // We will want to redraw everything
          symbolLineWidth = state.symbolLineWidth;
          lastDrawn = null;
        }

        if (scale != state.scale) {
          // We will want to redraw everything
          scale = state.scale;
          lastDrawn = null;

          // And scale the canvases
          scaleCanvas(repeat.width, repeat.height);
          drawGrid();
        }

        if (
          lastDrawn == null ||
          repeat.width != lastDrawn.width ||
          repeat.height != lastDrawn.height
        ) {
          scaleCanvas(repeat.width, repeat.height);

          drawGrid();
          lastDrawn = null;
        }

        if (lastDrawn != repeat) {
          draw();
        }
      },
    };
  };
}
