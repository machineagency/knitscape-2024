import {
  bbox3d,
  resizeCanvasToDisplaySize,
  initShaderProgram,
} from "./helpers";

import { m4 } from "./math/m4";
import { buildYarnCurve } from "./yarnSpline";

const segmentVertexShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_width;

out float across;

void main() {
  vec4 p0 =  u_view * vec4(pointA, 1.0);
  vec4 p1 =  u_view * vec4(pointB, 1.0);

  // This is our position in the instance geometry. the x component is along the line segment
  vec2 tangent = p1.xy - p0.xy;
  vec2 normal =   normalize(vec2(-tangent.y, tangent.x)); // perp

  vec4 currentPoint = mix(p0, p1, instancePosition.x);
  vec2 pt = currentPoint.xy + u_width * (instancePosition.x * tangent +  instancePosition.y * normal);

  vec4 mvPosition = vec4(pt, currentPoint.z, 1.0);

  gl_Position = u_projection * mvPosition;

  across = instancePosition.y;
}
`;

const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

uniform vec3 u_color;

in float across;

out vec4 outColor;
// strip normal is always to the camera
vec3 normal = vec3(0.0, 0.0, 1.0);

void main() {
    vec3 highlight = normalize(vec3(0.0, across, 0.5));
    float outline = dot(normal, highlight);
    outline = step(0.75, outline);
    outColor.rgb = u_color * outline;
    outColor.a = 1.0;
}
`;

const joinVertexShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;
in vec3 pointC;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_width;

out float across;

void main() {
  vec4 clipA = u_view * vec4(pointA, 1.0);
  vec4 clipB = u_view * vec4(pointB, 1.0);
  vec4 clipC = u_view * vec4(pointC, 1.0);

  // Calculate the normal to the join tangent
  vec2 tangent = normalize(normalize(clipC.xy - clipB.xy) + normalize(clipB.xy - clipA.xy));
  vec2 normal = vec2(-tangent.y, tangent.x);

  vec2 ab = clipB.xy - clipA.xy;
  vec2 cb = clipB.xy - clipC.xy;

  vec2 abn = normalize(vec2(-ab.y, ab.x));
  vec2 cbn = -normalize(vec2(-cb.y, cb.x));

  float sigma = sign(dot(ab + cb, normal)); // Direction of the bend

  // Basis vectors for the bevel geometry
  vec2 p0 = 0.5 * sigma * u_width * (sigma < 0.0 ? abn : cbn);
  vec2 p1 = 0.5 * sigma * u_width * (sigma < 0.0 ? cbn : abn);


  // Final vertex position coefficients ([0,0], [0,1], [1,0])
  vec2 clip = clipB.xy + instancePosition.x * p0 + instancePosition.y * p1;
  vec4 mvPosition = vec4(clip, clipB.z, clipB.w);

  gl_Position = u_projection * mvPosition;

  across = (instancePosition.x + instancePosition.y) * 0.5 * sigma;
}
`;

const segColorVS = /* glsl */ `#version 300 es
precision highp float;

in vec3 instancePosition;
in vec3 pointA;
in vec3 pointB;

uniform mat3 u_Matrix;
uniform float u_Radius;

void main() {
  vec2 xBasis = pointB.xy - pointA.xy;
  vec2 yBasis = u_Radius * normalize(vec2(-xBasis.y, xBasis.x));
  vec3 currentPoint = mix(pointA, pointB, instancePosition.z);
  vec2 point = currentPoint.xy + (xBasis * instancePosition.x + yBasis * instancePosition.y);
  vec3 clip = u_Matrix * vec3(point, 1.0);

  gl_Position = vec4(clip.xy, -currentPoint.z, 1.0);
}
`;

const colorFS = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

let gl,
  segmentProgramInfo,
  joinProgramInfo,
  segmentInstanceBuffer,
  joinInstanceBuffer,
  bbox;

const camera = {
  wasFit: false,
  pos: [0, 0, 0],
  target: [0, 0, 0],
  up: [0, 1, 0],
  near: 0.1,
  far: 100,
  zoom: 1,
};

const DIVISIONS = 8;
let yarnProgramData = [];

function initShaders() {
  segmentProgramInfo = initShaderProgram(
    gl,
    segmentVertexShader,
    fragmentShader
  );

  joinProgramInfo = initShaderProgram(gl, joinVertexShader, fragmentShader);
}

function initInstanceGeometryBuffers() {
  // Set up buffers for the segment and join instance geometry which we will reuse across yarns

  const segmentInstanceGeometry = new Float32Array([
    0, -0.5, 1, -0.5, 0, 0.5, 1, 0.5,
  ]);
  segmentInstanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, segmentInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, segmentInstanceGeometry, gl.STATIC_DRAW);

  const joinInstanceGeometry = new Float32Array([0, 0, 1, 0, 0, 1]);
  joinInstanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, joinInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, joinInstanceGeometry, gl.STATIC_DRAW);
}

function createSegmentVAO(yarnBuffer, segBuffer) {
  const segmentVAO = gl.createVertexArray();
  gl.bindVertexArray(segmentVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, yarnBuffer);

  gl.enableVertexAttribArray(segmentProgramInfo.attribLocations.pointA);
  gl.vertexAttribPointer(
    segmentProgramInfo.attribLocations.pointA,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    Float32Array.BYTES_PER_ELEMENT * 0 // offset
  );
  gl.vertexAttribDivisor(segmentProgramInfo.attribLocations.pointA, 1);

  gl.enableVertexAttribArray(segmentProgramInfo.attribLocations.pointB);
  gl.vertexAttribPointer(
    segmentProgramInfo.attribLocations.pointB,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    Float32Array.BYTES_PER_ELEMENT * 3 // offset
  );
  gl.vertexAttribDivisor(segmentProgramInfo.attribLocations.pointB, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, segBuffer);

  gl.enableVertexAttribArray(
    segmentProgramInfo.attribLocations.instancePosition
  );

  gl.vertexAttribPointer(
    segmentProgramInfo.attribLocations.instancePosition,
    2, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0 // offset
  );

  return segmentVAO;
}

function createJoinVAO(yarnBuffer, joinBuffer) {
  const joinVAO = gl.createVertexArray();
  gl.bindVertexArray(joinVAO);

  // use the yarn instance buffer again
  gl.bindBuffer(gl.ARRAY_BUFFER, yarnBuffer);

  gl.enableVertexAttribArray(joinProgramInfo.attribLocations.pointA);
  gl.vertexAttribPointer(
    joinProgramInfo.attribLocations.pointA,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    Float32Array.BYTES_PER_ELEMENT * 0 // offset
  );
  gl.vertexAttribDivisor(joinProgramInfo.attribLocations.pointA, 1);

  gl.enableVertexAttribArray(joinProgramInfo.attribLocations.pointB);
  gl.vertexAttribPointer(
    joinProgramInfo.attribLocations.pointB,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    Float32Array.BYTES_PER_ELEMENT * 3 // offset
  );
  gl.vertexAttribDivisor(joinProgramInfo.attribLocations.pointB, 1);

  gl.enableVertexAttribArray(joinProgramInfo.attribLocations.pointC);
  gl.vertexAttribPointer(
    joinProgramInfo.attribLocations.pointC,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    Float32Array.BYTES_PER_ELEMENT * 6 // offset
  );
  gl.vertexAttribDivisor(joinProgramInfo.attribLocations.pointC, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, joinBuffer);

  gl.enableVertexAttribArray(joinProgramInfo.attribLocations.instancePosition);
  gl.vertexAttribPointer(
    joinProgramInfo.attribLocations.instancePosition,
    2, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0 // offset
  );

  return joinVAO;
}

export function init(yarnData, canvas) {
  gl = canvas.getContext("webgl2");

  if (gl === null) {
    alert("No WebGL :(");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  if (!joinProgramInfo || !segmentProgramInfo) initShaders();

  initInstanceGeometryBuffers();

  yarnProgramData = yarnData.map((yarn) => {
    const splineBuffer = gl.createBuffer();
    const splinePts = buildYarnCurve(yarn.pts, DIVISIONS);

    gl.bindBuffer(gl.ARRAY_BUFFER, splineBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(splinePts),
      gl.DYNAMIC_DRAW
    );

    return {
      controlPoints: yarn.pts,
      yarnSplineBuffer: splineBuffer,
      segCount: splinePts.length / 3 - 1,
      u_color: yarn.color,
      u_width: yarn.diameter,
      segmentVAO: createSegmentVAO(splineBuffer, segmentInstanceBuffer),
      joinVAO: createJoinVAO(splineBuffer, joinInstanceBuffer),
    };
  });

  if (!camera.wasFit) fit();
}

export function toggleFlip() {
  camera.pos[2] = -camera.pos[2];
}

export function fit() {
  const allPts = yarnProgramData.reduce(
    (prev, cur) => prev.concat(cur.controlPoints),
    []
  );

  bbox = bbox3d(allPts);

  const zoom =
    1.2 *
    Math.max(
      Math.ceil(gl.canvas.clientWidth / bbox.dimensions[0]),
      Math.ceil(gl.canvas.clientHeight / bbox.dimensions[1])
    );

  camera.zoom = zoom;
  camera.pos = [bbox.center[0], bbox.center[1], 50];
  camera.target = bbox.center;
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

export function zoom(e) {
  e.preventDefault();
  const [clipX, clipY] = mouseClip(e);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  const preZoom = {
    x: clipX * camera.zoom,
    y: clipY * (camera.zoom / aspect),
  };

  const newZoom = camera.zoom / Math.pow(1.2, e.deltaY * -0.01);

  camera.zoom = Math.max(0.02, Math.min(100, newZoom));

  const postZoom = {
    x: clipX * camera.zoom,
    y: clipY * (camera.zoom / aspect),
  };

  let dx = Math.sign(camera.pos[2]) * (preZoom.x - postZoom.x);
  let dy = preZoom.y - postZoom.y;

  camera.pos[0] += dx;
  camera.pos[1] += dy;

  camera.target[0] += dx;
  camera.target[1] += dy;
}

export function pan(e) {
  let startX = camera.pos[0];
  let startY = camera.pos[1];
  let clipStart = mouseClip(e);

  const move = (e) => {
    if (e.buttons === 0) {
      end();
      return;
    }

    let clipCurrent = mouseClip(e);

    let dxClip = Math.sign(camera.pos[2]) * (clipCurrent[0] - clipStart[0]);
    let dyClip = clipCurrent[1] - clipStart[1];
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    let x = startX - dxClip * camera.zoom;
    let y = startY - (dyClip * camera.zoom) / aspect;

    camera.pos[0] = x;
    camera.pos[1] = y;
    camera.target[0] = x;
    camera.target[1] = y;

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

function drawYarn(yarn, viewMatrix, projectionMatrix) {
  ///////////////////////////////////////////
  // Draw yarn segments
  ///////////////////////////////////////////
  gl.useProgram(segmentProgramInfo.program);
  gl.bindVertexArray(yarn.segmentVAO);

  gl.uniformMatrix4fv(
    segmentProgramInfo.uniformLocations.u_view,
    false,
    viewMatrix
  );

  gl.uniformMatrix4fv(
    segmentProgramInfo.uniformLocations.u_projection,
    false,
    projectionMatrix
  );

  gl.uniform3f(
    segmentProgramInfo.uniformLocations.u_color,
    yarn.u_color[0],
    yarn.u_color[1],
    yarn.u_color[2]
  );

  gl.uniform1f(segmentProgramInfo.uniformLocations.u_width, yarn.u_width);

  gl.drawArraysInstanced(
    gl.TRIANGLE_STRIP,
    0,
    4, // Four verts in the segment geometry
    yarn.segCount // number of segment instances in this yarn
  );

  ///////////////////////////////////////////
  // Draw yarn joins
  ///////////////////////////////////////////
  gl.useProgram(joinProgramInfo.program);
  gl.bindVertexArray(yarn.joinVAO);

  gl.uniformMatrix4fv(
    joinProgramInfo.uniformLocations.u_view,
    false,
    viewMatrix
  );

  gl.uniformMatrix4fv(
    joinProgramInfo.uniformLocations.u_projection,
    false,
    projectionMatrix
  );

  gl.uniform3f(
    joinProgramInfo.uniformLocations.u_color,
    yarn.u_color[0],
    yarn.u_color[1],
    yarn.u_color[2]
  );

  gl.uniform1f(joinProgramInfo.uniformLocations.u_width, yarn.u_width);

  // Draw instanced triangle strip along the entire yarn
  gl.drawArraysInstanced(
    gl.TRIANGLES,
    0,
    3, // Three verts in the bevel join geometry
    yarn.segCount - 1 // Join instance count is one less than segment count
  );
}

function draw() {
  resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const cameraMatrix = m4.lookAt(camera.pos, camera.target, camera.up);
  const viewMatrix = m4.inverse(cameraMatrix);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  // const projectionMatrix = m4.perspective(1, aspect, camera.near, camera.far);

  const projectionMatrix = m4.orthographic(
    -1 * camera.zoom,
    1 * camera.zoom,
    (-1 * camera.zoom) / aspect,
    (1 * camera.zoom) / aspect,
    camera.near,
    camera.far
  );

  // console.log(orthoProjection, projectionMatrix);

  yarnProgramData.forEach((yarn) =>
    drawYarn(yarn, viewMatrix, projectionMatrix)
  );
}

function updateYarnGeometry(yarnData) {
  yarnData.forEach((yarn, yarnIndex) => {
    const splinePts = new Float32Array(buildYarnCurve(yarn.pts, DIVISIONS));
    gl.bindBuffer(gl.ARRAY_BUFFER, yarnProgramData[yarnIndex].yarnSplineBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(splinePts));
    yarnProgramData[yarnIndex].controlPoints = yarn.pts;
  });
}

export const renderer = {
  init,
  draw,
  updateYarnGeometry,
};
