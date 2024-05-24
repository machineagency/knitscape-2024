import { initChart,renderChart, fit, pan, zoom } from "./chartRenderer";
import { Bimp } from "../lib/Bimp";

const c = document.getElementById("chart");
const fitBtn = document.getElementById("fit");

c.addEventListener("pointerdown", pan)
c.addEventListener("wheel", zoom)
fitBtn.addEventListener("click", fit)

const chart = new Bimp(
  8,
  16,
  [
    1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1,
    5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5,
    1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 5, 1, 1, 1, 5, 1, 1, 1, 5, 1, 1, 1,
    5, 1, 1,
  ]
);

initChart(chart, c);
fit();

function r() {
  renderChart();
  window.requestAnimationFrame(r)
}

r()