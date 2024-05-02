import { SYMBOL_PATHS, STITCH_MAP, BACK_OPS, SYMBOL_BITS } from "../constants";

const DIM = "#0000002a";

function drawChartCell(ctx, x, y, scale, fill, stroke, path, dim) {
  ctx.save();
  ctx.translate(x * scale, y * scale);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 1, 1);

  if (dim) {
    // Dim any back bed operations
    ctx.fillStyle = DIM;
    ctx.fillRect(0, 0, 1, 1);
  }
  ctx.strokeStyle = stroke;
  if (path) ctx.stroke(path);

  ctx.restore();
}

function drawChart(
  { chart, yarnSequence, yarnPalette, scale, repeat },
  canvas,
  lastDrawn = null
) {
  const { width, height } = chart;

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 0.04;

  for (let y = 0; y < height; y++) {
    const yarnIndex = yarnSequence.pixel(0, y % yarnSequence.height);

    for (let x = 0; x < width; x++) {
      const stitchIndex = chart.pixel(x, y);

      if (lastDrawn == null || lastDrawn.pixel(x, y) != stitchIndex) {
        const operation = STITCH_MAP[stitchIndex];
        const block = SYMBOL_BITS[operation];
        let fill;
        let stroke = "#000";

        if (x < repeat.width && y < repeat.height) {
          // If inside repeat, draw black and white
          fill = block ? "#fff" : "#000";
          stroke = block ? "#000" : "#fff";
        } else {
          fill = block ? "#2b2b2b" : yarnPalette[yarnIndex];
          stroke = block ? yarnPalette[yarnIndex] : "#000";
        }

        const dimmed = BACK_OPS.has(operation);

        drawChartCell(
          ctx,
          x,
          height - y - 1,
          scale,
          fill,
          stroke,
          new Path2D(SYMBOL_PATHS[operation]),
          dimmed
        );
      }
    }
  }
}

export function drawChartOnChange() {
  return ({ state }) => {
    let { chart, scale, repeat } = state;
    let lastDrawn = chart;

    return {
      syncState(state) {
        let canvas = document.getElementById("chart-canvas");

        if (
          lastDrawn.width != state.chart.width ||
          lastDrawn.height != state.chart.height ||
          scale != state.scale ||
          repeat != state.repeat
        ) {
          scale = state.scale;
          repeat = state.repeat;

          canvas.width = scale * state.chart.width;
          canvas.height = scale * state.chart.height;

          canvas.style.width = `${scale * state.chart.width}px`;
          canvas.style.height = `${scale * state.chart.height}px`;

          lastDrawn = null;
        }

        if (lastDrawn == null || lastDrawn != state.chart) {
          drawChart(state, canvas, lastDrawn);
          lastDrawn = state.chart;
        }
      },
    };
  };
}
