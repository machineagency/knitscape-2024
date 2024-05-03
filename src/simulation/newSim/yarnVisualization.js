import { hexToRgb } from "../../utils";
import { yarnRelaxation } from "./relaxation";
import {
  segmentsToPoints,
  generateTopology,
  computeYarnPathSpline,
  layoutNodes,
} from "./shared";

import { topDownRenderer } from "./topdown";

let renderer = topDownRenderer;

const YARN_DIAMETER = 0.28;
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
  let sim;

  const { DS, yarnPath } = generateTopology(stitchPattern);

  const nodes = layoutNodes(DS, stitchPattern, params);

  const segments = computeYarnPathSpline(
    DS,
    yarnPath,
    stitchPattern,
    nodes,
    params
  );

  const yarnData = Object.entries(segments).map(([yarnIndex, segmentArr]) => {
    return {
      yarnIndex: yarnIndex,
      pts: segmentsToPoints(segmentArr, nodes),
      diameter: YARN_DIAMETER,
      color: hexToRgb(yarnPalette[yarnIndex]).map((colorInt) => colorInt / 255),
    };
  });

  renderer.init(yarnData, canvas);

  function draw() {
    if (sim && sim.running()) {
      sim.tick(segments, DS, nodes);

      for (let i = 0; i < yarnData.length; i++) {
        yarnData[i].pts = segmentsToPoints(
          segments[yarnData[i].yarnIndex],
          nodes
        );
      }

      renderer.updateYarnGeometry(yarnData);
    }
    renderer.draw();
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
