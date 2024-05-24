import { m4 } from "../simulation/newSim/math/m4";

const VS = /* glsl */ `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform mat4 u_matrix;

out vec2 v_texCoord;

void main() {
  gl_Position =  u_matrix * vec4(a_position, 0, 1);

  v_texCoord = a_texCoord;
}
`;

const FS = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_chart;
uniform sampler2D u_palette;
uniform float u_paletteSize;

in vec2 v_texCoord;
out vec4 outColor;
 
void main() {
  float symbolIndex = floor(texture(u_chart, v_texCoord).x * 256.0) + 0.5;
  float symbolCoord = symbolIndex / u_paletteSize;

  outColor = texture(u_palette, vec2(symbolCoord, 0));
}`;

const symbolColors = new Uint8Array([
  230, 0, 0, 255, 8, 204, 171, 255, 7, 158, 133, 255, 0, 200, 50, 255, 0, 100,
  255, 255, 235, 64, 52, 255,
]);

const camera = {
  x: 0,
  y: 0,
  side: 1, // this should only be -1 or 1
  zoom: 10,
  aspect: 1,
  up: [0, 1, 0],
  near: 0.1,
  far: 100,
};

let gl, program, vao, positionBuffer, chart;

export function initChart(c, canvas) {
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  chart = c;

  program = initShaderProgram(gl, VS, FS);
  vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer and put a single pixel space rectangle in
  // it (2 triangles)
  positionBuffer = gl.createBuffer();

  gl.enableVertexAttribArray(program.attribLocations.a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    program.attribLocations.a_position,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // provide texture coordinates for the rectangle.
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  // Turn on the attribute
  gl.enableVertexAttribArray(program.attribLocations.a_texCoord);

  // Tell the attribute how to get data out of texCoordBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
    program.attribLocations.a_texCoord,
    2, // size
    gl.FLOAT, //type
    false, // normalize
    0, // stride
    0 // offset
  );

  ////////////////////////
  // DATA TEXTURE
  ////////////////////////

  // Create a texture.
  const chartTexture = gl.createTexture();

  // use texture unit 0
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, chartTexture);

  // fill texture with 3x2 pixels
  gl.pixelStorei(
    gl.UNPACK_ALIGNMENT,
    1 // alignment
  );
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.R8, // internal format
    chart.width, // width
    chart.height, // height
    0, // border
    gl.RED, // format
    gl.UNSIGNED_BYTE, // type
    chart.pixels // data
  );

  // set the filtering so we don't need mips and it's not filtered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  ////////////////////////
  // PALETTE TEXTURE
  ////////////////////////
  const paletteTexture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE1 + 0);
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.RGBA8, // internal format
    symbolColors.length / 4, // width
    1, // height
    0, // border
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    symbolColors // data
  );

  // set the filtering so we don't need mips and it's not filtered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  updateCamera();
}

function updateCamera() {
  resizeCanvasToDisplaySize(gl.canvas);
  camera.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
}

export function renderChart() {
  updateCamera();

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const matrix = computeMatrix();

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program.program);

  gl.bindVertexArray(vao);

  gl.uniformMatrix4fv(program.uniformLocations.u_matrix, false, matrix);
  gl.uniform1f(program.uniformLocations.u_paletteSize, symbolColors.length / 4);
  gl.uniform1i(program.uniformLocations.u_chart, 0);
  gl.uniform1i(program.uniformLocations.u_palette, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set a rectangle the same size as the image.
  const rectData = chartRect(0, 0, chart.width, chart.height);

  gl.bufferData(gl.ARRAY_BUFFER, rectData, gl.STATIC_DRAW);

  gl.drawArrays(
    gl.TRIANGLES, // primitive type
    0, // offset
    6 // count
  );
}

function computeMatrix() {
  const { x, y, side, zoom, up, near, far, aspect } = camera;

  const cameraMatrix = m4.lookAt([x, y, side], [x, y, 0], up);
  const viewMatrix = m4.inverse(cameraMatrix);
  const projectionMatrix = m4.orthographic(
    -1 * zoom,
    1 * zoom,
    (-1 * zoom) / aspect,
    (1 * zoom) / aspect,
    near,
    far
  );

  return m4.multiply(projectionMatrix, viewMatrix);
}

function chartRect(x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
}

function resizeCanvasToDisplaySize(canvas, dpr = 2) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }

  return needResize;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {},
    uniformLocations: {},
  };

  const attribCount = gl.getProgramParameter(
    shaderProgram,
    gl.ACTIVE_ATTRIBUTES
  );
  for (let i = 0; i < attribCount; ++i) {
    const attrib = gl.getActiveAttrib(shaderProgram, i);
    programInfo.attribLocations[attrib.name] = gl.getAttribLocation(
      shaderProgram,
      attrib.name
    );
  }

  const uniformCount = gl.getProgramParameter(
    shaderProgram,
    gl.ACTIVE_UNIFORMS
  );
  for (let i = 0; i < uniformCount; ++i) {
    const uniform = gl.getActiveUniform(shaderProgram, i);
    programInfo.uniformLocations[uniform.name] = gl.getUniformLocation(
      shaderProgram,
      uniform.name
    );
  }

  return programInfo;
}

export function fit() {
  const chartAspect = chart.width / chart.height;
  const zoom =
    chartAspect > camera.aspect
      ? (1.1 * chart.width) / 2
      : (1.1 * chart.height * camera.aspect) / 2;

  camera.zoom = zoom;
  camera.x = chart.width / 2;
  camera.y = chart.height / 2;
}

export function zoom(e) {
  e.preventDefault();
  const [clipX, clipY] = mouseClip(e);

  const preZoom = {
    x: clipX * camera.zoom,
    y: clipY * (camera.zoom / camera.aspect),
  };

  const newZoom = camera.zoom / Math.pow(1.2, e.deltaY * -0.01);

  camera.zoom = Math.max(0.02, Math.min(100, newZoom));

  const postZoom = {
    x: clipX * camera.zoom,
    y: clipY * (camera.zoom / camera.aspect),
  };

  camera.x += Math.sign(camera.side) * (preZoom.x - postZoom.x);
  camera.y += preZoom.y - postZoom.y;
}

export function pan(e) {
  let { x: x0, y: y0 } = camera;
  let clipStart = mouseClip(e);

  const move = (e) => {
    if (e.buttons === 0) {
      end();
      return;
    }

    let clipCurrent = mouseClip(e);

    let dxClip = Math.sign(camera.side) * (clipCurrent[0] - clipStart[0]);
    let dyClip = clipCurrent[1] - clipStart[1];

    camera.x = x0 - dxClip * camera.zoom;
    camera.y = y0 - (dyClip * camera.zoom) / camera.aspect;

    e.preventDefault();
  };

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointerleave", end);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointerleave", end);
}

function mouseClip(e) {
  // get canvas relative css position
  const rect = gl.canvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left;
  const cssY = e.clientY - rect.top;

  // get normalized 0 to 1 position across and down canvas
  const normalizedX = cssX / gl.canvas.clientWidth;
  const normalizedY = cssY / gl.canvas.clientHeight;

  // convert to clip space
  const clipX = normalizedX * 2 - 1;
  const clipY = normalizedY * -2 + 1;

  return [clipX, clipY];
}
