export class Bimp {
  constructor(width, height, data) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(data);
  }

  static fromJSON(jsonObj) {
    return new Bimp(jsonObj.width, jsonObj.height, jsonObj.data);
  }

  static empty(width, height, color) {
    let data = new Array(width * height).fill(color);
    return new Bimp(width, height, data);
  }

  static fromTile(width, height, tile) {
    // tile should be a Bimp

    let tiled = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiled.push(tile.pixel(x % tile.width, y % tile.height));
      }
    }

    return new Bimp(width, height, tiled);
  }

  overlay(overlayBimp, pos) {
    const changes = [];
    for (let y = 0; y < overlayBimp.height; y++) {
      for (let x = 0; x < overlayBimp.width; x++) {
        changes.push({
          x: pos[0] + x,
          y: pos[1] + overlayBimp.height - y - 1,
          color: overlayBimp.pixel(x, y),
        });
      }
    }

    return this.draw(changes);
  }

  toJSON() {
    return {
      data: Array.from(this.data),
      width: this.width,
      height: this.height,
    };
  }

  pad(paddingX, paddingY, color) {
    const filled = Array(paddingY * (this.width + 2 * paddingX)).fill(color);
    const col = Array(paddingX).fill(color);
    let twod = this.make2d();

    return new Bimp(this.width + 2 * paddingX, this.height + 2 * paddingY, [
      ...twod.reduce(
        (acc, row) => {
          return [...acc, ...col, ...row, ...col];
        },
        [...filled]
      ),
      ...filled,
    ]);
  }

  resize(width, height, emptyColor = 0) {
    let resized = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y >= this.height || x >= this.width) {
          resized.push(emptyColor);
        } else {
          resized.push(this.pixel(x, y));
        }
      }
    }
    return new Bimp(width, height, resized);
  }

  make2d() {
    let copy = Array.from(this.data).slice();
    let newArray = [];
    while (copy.length > 0) newArray.push(copy.splice(0, this.width));
    return newArray;
  }

  vMirror() {
    return new Bimp(this.width, this.height, this.make2d().toReversed().flat());
  }

  vFlip() {
    return new Bimp(this.width, this.height, this.make2d().toReversed().flat());
  }

  pixel(x, y) {
    if (x > this.width - 1 || x < 0 || y > this.height - 1 || y < 0) {
      return -1;
    }
    return this.data.at(x + y * this.width);
  }

  draw(changes) {
    let copy = this.data.slice();
    for (let { x, y, color } of changes) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
      copy[x + y * this.width] = color;
    }
    return new Bimp(this.width, this.height, copy);
  }

  brush({ x, y }, color) {
    let drawn = { x, y, color: color };
    return this.draw([drawn]);
  }

  flood([x, y], color) {
    const targetColor = this.pixel(x, y);
    if (targetColor === color) return this.draw([]);

    const around = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];
    let drawn = [{ x, y, color: color }];
    for (let done = 0; done < drawn.length; done++) {
      for (let { dx, dy } of around) {
        let x = drawn[done].x + dx,
          y = drawn[done].y + dy;
        if (
          x >= 0 &&
          x < this.width &&
          y >= 0 &&
          y < this.height &&
          this.pixel(x, y) == targetColor &&
          !drawn.some((p) => p.x == x && p.y == y)
        ) {
          drawn.push({ x, y, color: color });
        }
      }
    }
    return this.draw(drawn);
  }

  shift(dx, dy) {
    let changes = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        changes.push({
          x: (x - (dx % this.width) + this.width) % this.width,
          y: (y - (dy % this.height) + this.height) % this.height,
          color: this.pixel(x, y),
        });
      }
    }

    return this.draw(changes);
  }

  rect([x0, y0], [x1, y1], color) {
    let xStart = Math.min(x0, x1);
    let yStart = Math.min(y0, y1);
    let xEnd = Math.max(x0, x1);
    let yEnd = Math.max(y0, y1);
    let changes = [];

    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        changes.push({ x, y, color });
      }
    }
    return this.draw(changes);
  }

  line([x0, y0], [x1, y1], color) {
    const changes = [];
    if (Math.abs(x0 - x1) > Math.abs(y0 - y1)) {
      if (x0 > x1)
        [[x0, y0], [x1, y1]] = [
          [x1, y1],
          [x0, y0],
        ];
      let slope = (y1 - y0) / (x1 - x0);
      for (let [x, y] = [x0, y0]; x <= x1; x++) {
        changes.push({ x, y: Math.round(y), color });
        y += slope;
      }
    } else {
      if (y0 > y1)
        [[x0, y0], [x1, y1]] = [
          [x1, y1],
          [x0, y0],
        ];
      let slope = (x1 - x0) / (y1 - y0);
      for (let [x, y] = [x0, y0]; y <= y1; y++) {
        changes.push({ x: Math.round(x), y, color });
        x += slope;
      }
    }
    return this.draw(changes);
  }

  select([x0, y0], [x1, y1]) {
    let xStart = Math.max(Math.min(x0, x1), 0);
    let yStart = Math.max(Math.min(y0, y1), 0);
    let xEnd = Math.min(Math.max(x0, x1), this.width - 1);
    let yEnd = Math.min(Math.max(y0, y1), this.height - 1);

    const data = [];

    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        data.push(this.pixel(x, y));
      }
    }

    return new Bimp(xEnd - xStart + 1, yEnd - yStart + 1, data);
  }
}
