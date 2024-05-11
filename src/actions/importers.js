import { Bimp } from "../lib/Bimp";
import { dispatch } from "../state";
import { fitChart } from "./zoomFit";
import randomColor from "randomcolor";
import { PATTERN_LIBRARY } from "../constants";

function loadJSON(patternJSON) {
  let { yarnSequence, yarnPalette, repeat, width, height } = patternJSON;

  dispatch({
    yarnPalette,
    width,
    height,
    yarnSequence: Bimp.fromJSON(yarnSequence),
    chart: Bimp.empty(width, height, 1),
    repeat: Bimp.fromJSON(repeat),
  });

  fitChart();
}

export function newPattern() {
  dispatch({
    yarnSequence: new Bimp(1, 4, [0, 0, 1, 1]),
    yarnPalette: [randomColor(), randomColor()],
    chart: Bimp.empty(30, 40, 1),
    repeat: new Bimp(4, 4, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  });
  fitChart();
}

export function loadLibraryPattern(path) {
  dispatch({ activeModal: null });
  PATTERN_LIBRARY[path]().then((mod) => loadJSON(mod));
}

export function uploadFile() {
  let fileInputElement = document.createElement("input");

  fileInputElement.setAttribute("type", "file");
  fileInputElement.style.display = "none";

  document.body.appendChild(fileInputElement);
  fileInputElement.click();
  fileInputElement.onchange = (e) => {
    let file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.onload = () => {
      loadJSON(JSON.parse(fileReader.result));
    };
  };
  document.body.removeChild(fileInputElement);
}
