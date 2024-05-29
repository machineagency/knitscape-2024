export class Swatch {
  constructor(bitmap, yarnSequence) {
    this.ops = bitmap.data;
    this.width = bitmap.width;
    this.height = bitmap.height;
    this.yarnSequence = Array.from({ length: bitmap.height }).map(
      (_, index) => yarnSequence[index % yarnSequence.length]
    );
    this.rowMap = Array.from({ length: bitmap.height }).map(
      (_, index) => index
    );
    this.yarns = Array.from(
      yarnSequence.filter((value, index, arr) => arr.indexOf(value) === index)
    );
    this.carriagePasses = this.rowMap.map((ogRow) =>
      ogRow % 2 == 0 ? "right" : "left"
    );
  }

  op(x, y) {
    if (x > this.width - 1 || x < 0 || y > this.height - 1 || y < 0) {
      return -1;
    }
    return this.ops.at(x + y * this.width);
  }
}
