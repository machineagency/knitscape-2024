import { hexToRgb } from "../../utils";
import { yarnRelaxation } from "./relaxation";
import { segmentsToPoints, computeYarnPathSpline, layoutNodes } from "./shared";
import { makeDS } from "./YarnDS";
import { renderer } from "./rendering";

const worker = new Worker(new URL("./splineWorker.js", import.meta.url), {
  type: "module",
});

const topologyWorker = new Worker(
  new URL("./topologyWorker.js", import.meta.url),
  {
    type: "module",
  }
);

let splineStale = false;
let splineWorkerBusy = false;

let topoStale = true;
let topoWorkerBusy = false;

const YARN_DIAMETER = 0.3;
const STITCH_WIDTH = 1;
const BED_OFFSET = 0.1;
const ASPECT = 0.6;

export function visualizeYarn(stitchPattern, yarnPalette) {
  const params = {
    YARN_RADIUS: YARN_DIAMETER / 2,
    STITCH_WIDTH,
    ASPECT,
    BED_OFFSET,
  };

  let canvas = document.getElementById("sim-canvas");
  let relaxed = false;
  let initialized = false;

  let sim, DS, yarnPath, yarnData, segments, nodes;
  topoStale = true;

  topologyWorker.onmessage = (e) => {
    topoWorkerBusy = false;
    topoStale = false;
    let res = e.data;
    yarnPath = res.yarnPath;
    DS = makeDS(res.width, res.height, res.data);
    init();
  };

  function init() {
    nodes = layoutNodes(DS, stitchPattern, params);

    segments = computeYarnPathSpline(
      DS,
      yarnPath,
      stitchPattern,
      nodes,
      params
    );

    yarnData = Object.entries(segments).map(([yarnIndex, segmentArr]) => {
      const rgbYarn = hexToRgb(yarnPalette[yarnIndex]);
      return {
        yarnIndex: yarnIndex,
        pts: new Array(segmentArr.length * 2),
        splinePts: [],
        diameter: YARN_DIAMETER,
        color: rgbYarn.map((colorInt) => colorInt / 255),
      };
    });

    worker.onmessage = (e) => {
      for (let i = 0; i < yarnData.length; i++) {
        yarnData[i].splinePts = e.data[i];
      }

      splineStale = false;
      splineWorkerBusy = false;

      if (!initialized) {
        renderer.init(yarnData, canvas);
        initialized = true;
      } else {
        renderer.uploadYarnData(yarnData);
      }
    };

    computeControlPoints();

    worker.postMessage(yarnData);
    splineWorkerBusy = true;
  }

  function computeControlPoints() {
    for (let i = 0; i < yarnData.length; i++) {
      yarnData[i].pts = segmentsToPoints(
        segments[yarnData[i].yarnIndex],
        nodes
      );
    }
  }

  function draw() {
    if (topoStale && !topoWorkerBusy) {
      topoStale = false;
      topoWorkerBusy = true;
      topologyWorker.postMessage(stitchPattern);
    }

    if (sim && sim.running()) {
      sim.tick(segments, DS, nodes);
      computeControlPoints();
      splineStale = true;
    }

    if (splineStale && !splineWorkerBusy) {
      splineStale = false;
      splineWorkerBusy = true;
      worker.postMessage(yarnData);
    }

    if (initialized) renderer.draw();
  }

  function relax() {
    if (relaxed) return;
    sim = yarnRelaxation();
    relaxed = true;
  }

  function stopSim() {
    if (sim) sim.stop();
  }

  return { relax, stopSim, draw };
}
