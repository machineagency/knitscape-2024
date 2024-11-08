# KnitScape-2024

KnitScape is a design and simulation tool for designing pattern repeats for knit slip/tuck colorwork patterns. This is an archival version of the KnitScape editor which accompanies the CHI 2024 paper [KnitScape: Computational Design and Yarn-Level Simulation of Slip and Tuck Colorwork Knitting Patterns](https://dl.acm.org/doi/10.1145/3613904.3642799). 


## features

- Add and edit multiple repeats in chart view
  - Resize and position base repeat
  - Resize repeat area
  - Edit repeat can contain four operations (knit, purl, tuck slip)
- Edit color sequence
  - Edit yarn colors directly, add/remove yarns
  - shuffle color indices, randomize colors
- 2D yarn relaxation simulation
  - renders to canvas with D3 force simulation
  - flip simulation swatch (view "wrong" or "right" side)
- Importing and exporting
  - Export to JSON, PNG, and SilverKnit's TXT format
  - Import patterns from JSON and pattern library

<!-- ## todo

- sim update optimizations
- settings
  - yarn width
  - yarn spread
  - default stitch sizes
  - end-needle selection

ideas/icebox

- knitting
  - lace symbols
  - increases/decreases
  - auto-mosaic mode: draw desired mosaic result, infer stitch pattern
  - fair isle mode: specify two colors in a row, chart design switches between
    them
- save to local storage
- some sort of tuck/slip verification - tuck always must have knit on either
  side, slip can't be more than 4/6 rows
- overlay operation chart on knit sim/make it editable
- different repeat operations: mirror, offset per repeat -->
