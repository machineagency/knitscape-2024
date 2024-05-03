export const MAX_SCALE = 100;
export const MIN_SCALE = 5;

export const MAX_SIM_SCALE = 6;
export const MIN_SIM_SCALE = 0.6;

export const stitches = {
  KNIT: {
    id: 1,
    name: "knit",
    punch: false,
    backBed: false,
    pathdata:
      "M 0 0.5 L 0.4 0.5 C 0.7 0.5 0.7 0.2 0.5 0.2 C 0.3 0.2 0.3 0.5 0.6 0.5 L 1 0.5",
  },
  PURL: {
    id: 2,
    name: "purl",
    punch: false,
    backBed: true,
    pathdata:
      "M 1 0.5 L 0.6 0.5 C 0.3 0.5 0.3 0.8 0.5 0.8 C 0.7 0.8 0.7 0.5 0.4 0.5 L 0 0.5",
  },
  FM: {
    id: 3,
    name: "slip",
    punch: true,
    backBed: false,
    pathdata: "M 0 0.5 L 1 0.5",
  },
  FT: {
    id: 5,
    name: "tuck",
    punch: true,
    backBed: false,
    pathdata:
      "M 0 0.5 L 0.2 0.5 C 0.3 0.5 0.35 0.5 0.4 0.45 C 0.45 0.4 0.4 0.2 0.5 0.2 C 0.6 0.2 0.55 0.4 0.6 0.45 C 0.65 0.5 0.7 0.5 0.8 0.5 L 1 0.5",
  },
};

Object.entries(stitches).forEach(([opName, data]) => {
  data.path2d = new Path2D(data.pathdata);
});

export const STITCH_MAP = ["", "KNIT", "PURL", "FM", "", "FT"];

export const PATTERN_LIBRARY = import.meta.glob("../examples/*.json");

export const toolData = {
  brush: { icon: "fa-solid fa-paintbrush", hotkey: "b" },
  flood: { icon: "fa-solid fa-fill-drip fa-flip-horizontal", hotkey: "f" },
  rect: { icon: "fa-solid fa-vector-square", hotkey: "r" },
  line: { icon: "fa-solid fa-minus", hotkey: "l" },
  shift: { icon: "fa-solid fa-right-left", hotkey: "s" },
};
