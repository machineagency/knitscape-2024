export function makeDS(width, height, grid) {
  return {
    width,
    height,
    data: grid,
    get length() {
      return this.data.length;
    },
    CN(i, j) {
      return this.data[j * width + i];
    },
    ST(i, j) {
      return this.CN(i, j)[0];
    },
    AV(i, j) {
      return this.CN(i, j)[1];
    },
    MV(i, j) {
      return this.CN(i, j)[2];
    },
    CNL(i, j) {
      return this.CN(i, j)[3];
    },
    YPI(i, j) {
      return this.CN(i, j)[4];
    },
    CNO(i, j) {
      return this.CN(i, j)[5];
    },
    setST(i, j, st) {
      this.CN(i, j)[0] = st;
    },
    setAV(i, j, av) {
      this.CN(i, j)[1] = av;
    },
    setMV(i, j, mv) {
      this.CN(i, j)[2] = mv;
    },
    setCNL(i, j, cnl) {
      this.CN(i, j)[3] = cnl;
    },
    setYPI(i, j, ypi) {
      this.CN(i, j)[4] = ypi;
    },
    setCNO(i, j, cno) {
      this.CN(i, j)[5] = cno;
    },
  };
}
