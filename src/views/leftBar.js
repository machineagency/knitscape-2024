import { html } from "lit-html";
import { GLOBAL_STATE, dispatch } from "../state";
import { shuffleArray } from "../utils";
import { Bimp } from "../lib/Bimp";
import { stitches } from "../constants";
import randomColor from "randomcolor";

let editingPalette = false;

function operationPicker() {
  return html` <div id="symbol-picker">
    <h3>Symbols</h3>
    ${Object.entries(stitches).map(
      ([opName, index]) => html`<button
        class="btn solid img ${GLOBAL_STATE.activeOp == opName
          ? "current"
          : ""}"
        @click=${() => dispatch({ activeOp: opName })}>
        <div>${stitches[opName].name}</div>
        <svg viewBox="0 0 1 1" class="symbol-preview">
          <rect fill="white" width="100%" height="100%"></rect>
          <path
            fill="none"
            stroke="black"
            stroke-width="0.04"
            d="${stitches[opName].pathdata}" />
        </svg>
      </button>`
    )}
  </div>`;
}

function deleteYarn(index) {
  if (GLOBAL_STATE.yarnPalette.length == 1) {
    alert("you need some color in your life");
    return;
  }
  const newPalette = GLOBAL_STATE.yarnPalette.filter((color, i) => i != index);
  const newBitmap = GLOBAL_STATE.yarnSequence.pixels.map((bit) => {
    if (bit == index) return 0;
    if (bit > index) return bit - 1;
    return bit;
  });

  dispatch({
    yarnPalette: newPalette,
    yarnSequence: new Bimp(
      GLOBAL_STATE.yarnSequence.width,
      GLOBAL_STATE.yarnSequence.height,
      newBitmap
    ),
  });
}

function editYarn(e, index) {
  const newPalette = [...GLOBAL_STATE.yarnPalette];
  newPalette[index] = e.target.value;
  dispatch({
    yarnPalette: newPalette,
    yarnSequence: GLOBAL_STATE.yarnSequence,
  });
}

function yarnPicker() {
  const { yarnPalette, activeYarn } = GLOBAL_STATE;

  return html`<div id="yarn-picker">
    <h3>Yarns</h3>
    <div>
      <button
        class="btn icon ${editingPalette ? "selected" : ""}"
        @click=${() => (editingPalette = !editingPalette)}>
        <i class="fa-solid fa-pen"></i>
      </button>
      <button
        class="btn icon"
        @click=${() => {
          let newPalette = [...yarnPalette];
          newPalette.push(randomColor());
          dispatch({ yarnPalette: newPalette });
        }}>
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
    ${yarnPalette.map(
      (hexa, index) =>
        html`<button
          class="btn solid color-select ${index == activeYarn
            ? "selected"
            : ""}"
          @click=${() => dispatch({ activeYarn: index })}>
          <div class="color-label">${index + 1}</div>
          <div class="color-preview" style="--current: ${hexa};">
            ${editingPalette
              ? html`
                  <label for="picker-${index}" class="edit-color">
                    <i class="fa-solid fa-pen"></i>
                  </label>
                  <input
                    type="color"
                    id="picker-${index}"
                    style="visibility: hidden;"
                    value="${yarnPalette[index]}"
                    @input=${(e) => editYarn(e, index)} />
                  <button
                    class="delete-color-button"
                    @click=${() => deleteYarn(index)}>
                    <i class="fa-solid fa-circle-xmark"></i>
                  </button>
                `
              : ""}
          </div>
        </button>`
    )}

    <div>
      <button
        class="btn icon"
        @click=${() => {
          dispatch({
            yarnPalette: shuffleArray(yarnPalette),
          });
        }}>
        <i class="fa-solid fa-arrows-rotate"></i>
      </button>
      <button
        class="btn icon"
        @click=${() => {
          dispatch({
            yarnPalette: randomColor({ count: yarnPalette.length }),
          });
        }}>
        <i class="fa-solid fa-dice"></i>
      </button>
    </div>
  </div>`;
}

export function leftBar() {
  return html`<div id="left-bar" class="scroller">
    ${operationPicker()} ${yarnPicker()}
  </div>`;
}
