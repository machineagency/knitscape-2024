export const Vec3 = {
  add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  },

  subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },

  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  scale(v, scalar) {
    return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
  },

  abs(v) {
    return [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])];
  },

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },

  magnitude(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  },

  normalize(v) {
    const length = Vec3.magnitude(v);
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },

  m4transform(v, m) {
    const x = v[0];
    const y = v[1];
    const z = v[2];

    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;

    return [
      (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
      (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
      (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
    ];
  },
};
