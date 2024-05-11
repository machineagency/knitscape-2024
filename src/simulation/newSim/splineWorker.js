import { buildYarnCurve } from "./yarnSpline";

const DIVISIONS = 8;

self.onmessage = (e) => {
  const yarnData = e.data;
  const workerResult = yarnData.map(
    (yarn, yarnIndex) => new Float32Array(buildYarnCurve(yarn.pts, DIVISIONS))
  );
  postMessage(workerResult);
};
