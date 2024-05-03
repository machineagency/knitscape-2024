import { stitches, STITCH_MAP } from "../constants";
import { throttle } from "../utils";

const DIM = "#0000002a";

function drawChartCell(ctx, x, y, fill, stroke, path, dim) {
  ctx.save();
  ctx.translate(x, y);

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
  ctx,
  lastDrawn = null
) {
  const { width, height } = chart;

  ctx.lineWidth = 0.05;
  ctx.scale(scale, scale);

  for (let y = 0; y < height; y++) {
    const yarnIndex = yarnSequence.pixel(0, y % yarnSequence.height);

    for (let x = 0; x < width; x++) {
      const stitchIndex = chart.pixel(x, y);

      if (lastDrawn == null || lastDrawn.pixel(x, y) != stitchIndex) {
        const operation = STITCH_MAP[stitchIndex];
        const invert = stitches[operation].punch;
        let fill, stroke;

        if (x < repeat.width && y < repeat.height) {
          // If inside repeat, draw black and white
          fill = invert ? "#fff" : "#000";
          stroke = invert ? "#000" : "#fff";
        } else {
          fill = invert ? "#2b2b2b" : yarnPalette[yarnIndex];
          stroke = invert ? yarnPalette[yarnIndex] : "#000";
        }

        const dimmed = stitches[operation].backBed;

        drawChartCell(
          ctx,
          x,
          height - y - 1,
          fill,
          stroke,
          stitches[operation].path2d,
          dimmed
        );
      }
    }
  }
}

const drawThrottle = throttle(window.requestAnimationFrame);
const dpr = window.devicePixelRatio;

export function drawChartOnChange() {
  return ({ state }) => {
    let { chart, scale, repeat, yarnSequence } = state;
    let lastDrawn = chart;

    function doSync(state) {
      let canvas = document.getElementById("chart-canvas");

      if (
        lastDrawn.width != state.chart.width ||
        lastDrawn.height != state.chart.height ||
        scale != state.scale ||
        repeat != state.repeat ||
        yarnSequence != state.yarnSequence
      ) {
        scale = state.scale;
        repeat = state.repeat;

        // Get the DPR and size of the canvas

        canvas.width = scale * state.chart.width * dpr;
        canvas.height = scale * state.chart.height * dpr;

        canvas.style.width = `${Math.floor(scale * state.chart.width)}px`;
        canvas.style.height = `${Math.floor(scale * state.chart.height)}px`;

        lastDrawn = null;
      }

      if (lastDrawn == null || lastDrawn != state.chart) {
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        drawChart(state, ctx, lastDrawn);
        lastDrawn = state.chart;
      }
    }

    return {
      syncState(state) {
        drawThrottle(() => doSync(state));
      },
    };
  };
}
