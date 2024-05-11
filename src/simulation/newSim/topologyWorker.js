import { populateDS, followTheYarn, orderCNs } from "./topology";

function generateTopology(stitchPattern) {
  const DS = populateDS(stitchPattern);
  orderCNs(DS, stitchPattern);
  const yarnPath = followTheYarn(DS, stitchPattern.carriagePasses);
  const { data, width, height } = DS;
  return { data, width, height, yarnPath };
}

self.onmessage = (e) => {
  const workerResult = generateTopology(e.data);

  postMessage(workerResult);
};
