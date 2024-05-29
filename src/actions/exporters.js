import { GLOBAL_STATE } from "../state";
import { download, makeBMP } from "../utils";

export function downloadPunchcard() {
  const svg = document.getElementById("punchcard");

  //get svg source.
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);

  //add name spaces.
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(
      /^<svg/,
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
    );
  }

  //add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  download(
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source),
    "punchcard.svg"
  );
}

export function downloadBMP() {
  download(
    makeBMP(
      GLOBAL_STATE.repeat.bitmap,
      GLOBAL_STATE.yarnSequence.data,
      GLOBAL_STATE.yarnPalette
    ).src
  );
}

export function downloadSilverKnitTxt() {
  const text =
    "SilverKnit\n" +
    GLOBAL_STATE.repeat
      .make2d()
      .map((row) =>
        row
          .map((pixel) => {
            if (pixel == 0 || pixel == 1) return 7;
            else return 8;
          })
          .join("")
      )
      .join("\n");

  download(
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    "pattern.txt"
  );
}

export function downloadKniterate() {
  const width = GLOBAL_STATE.chart.width;
  const chartHeight = GLOBAL_STATE.chart.height;
  const colors = [];

  for (let y = 0; y < chartHeight; y++) {
    let paletteIndex = GLOBAL_STATE.yarnSequence.pixel(
      0,
      (chartHeight - y - 1) % GLOBAL_STATE.yarnSequence.height
    );

    colors.push(new Array(width).fill(paletteIndex).join(""));
  }

  const text =
    "FILE FORMAT : DAK\nYARNS\n" +
    colors.join("\n") +
    "\nYARN PALETTE\nSTITCH SYMBOLS\n" +
    GLOBAL_STATE.chart
      .make2d()
      .map((row) =>
        row
          .map((pixel) => {
            if (pixel == 0 || pixel == 1) return ".";
            else return "-";
          })
          .join("")
      )
      .join("\n") +
    "\nEND";

  download(
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    "pattern.txt"
  );
}

export function downloadJSON() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(
      JSON.stringify({
        width: GLOBAL_STATE.chart.width,
        height: GLOBAL_STATE.chart.height,
        repeat: GLOBAL_STATE.repeat.toJSON(),
        yarnPalette: GLOBAL_STATE.yarnPalette,
        yarnSequence: GLOBAL_STATE.yarnSequence.toJSON(),
      })
    );

  download(dataStr, "pattern.json");
}

// export function downloadSVG() {
//   const svg = document.getElementById("simulation");

//   //get svg source.
//   const serializer = new XMLSerializer();
//   let source = serializer.serializeToString(svg);

//   //add name spaces.
//   if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
//     source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
//   }
//   if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
//     source = source.replace(
//       /^<svg/,
//       '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
//     );
//   }

//   //add xml declaration
//   source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

//   download(
//     "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source),
//     "swatch.svg"
//   );
// }
