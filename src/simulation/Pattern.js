const pixToOp = ["K", "P", "M", "T"];

export class Pattern {
  constructor(bitmap) {
    this.ops = Array.from(bitmap.pixels).map((val) => pixToOp[val]);
    this.width = bitmap.width;
    this.height = bitmap.height;
  }

  op(x, y) {
    if (x > this.width - 1 || x < 0 || y > this.height - 1 || y < 0) {
      return -1;
    }
    return this.ops.at(x + y * this.width);
  }
}
