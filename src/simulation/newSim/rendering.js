import {
  bbox3d,
  resizeCanvasToDisplaySize,
  initShaderProgram,
} from "./helpers";

import { m4 } from "./math/m4";

const segVS = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_textureMatrix;
uniform float u_width;
uniform mat4 u_inverseViewMatrix;

out float across;
out vec4 v_shadowTexCoord;

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

  v_shadowTexCoord = u_textureMatrix * u_inverseViewMatrix * mvPosition;
}
`;

const joinVS = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;
in vec3 pointC;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_width;
uniform mat4 u_textureMatrix;
uniform mat4 u_inverseViewMatrix;

out float across;
out vec4 v_shadowTexCoord;

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

    // Pass the texture coord to the fragment shader.
  v_shadowTexCoord = u_textureMatrix * u_inverseViewMatrix * mvPosition;
}
`;

const FS = /* glsl */ `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_shadowTexCoord;
in float across;

uniform sampler2D u_shadowTexture;
uniform vec3 u_color;

out vec4 outColor;
// strip normal is always to the camera
vec3 normal = vec3(0.0, 0.0, 1.0);

void main() {

  vec3 projectedTexcoord = v_shadowTexCoord.xyz / v_shadowTexCoord.w;
  float currentDepth = (1.0-projectedTexcoord.z);

  vec3 highlight = normalize(vec3(0.0, across, 0.5));
  float outline = dot(normal, highlight);
  // outline = step(0.75, outline);

  outColor = vec4(u_color*currentDepth*outline, 1.0);
}
`;

const segColorVS = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_width;


void main() {
  vec4 p0 =  u_view * vec4(pointA, 1.0);
  vec4 p1 =  u_view * vec4(pointB, 1.0);

  // This is our position in the instance geometry. the x component is along the line segment
  vec2 tangent = p1.xy - p0.xy;
  vec2 normal =   normalize(vec2(-tangent.y, tangent.x)); // perp

  vec4 currentPoint = mix(p0, p1, instancePosition.x);
  vec2 pt = currentPoint.xy + u_width * (instancePosition.x * tangent +  instancePosition.y * normal);

  gl_Position = u_projection * vec4(pt, currentPoint.z, 1.0);
}
`;

const joinColorVS = /* glsl */ `#version 300 es
precision highp float;

in vec2 instancePosition;
in vec3 pointA;
in vec3 pointB;
in vec3 pointC;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_width;

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
  depthTexture,
  depthFramebuffer,
  segmentDepthProgramInfo,
  joinDepthProgramInfo,
  bbox;

const camera = {
  x: 0,
  y: 0,
  side: 1, // this should only be -1 or 1
  zoom: 1,
  aspect: 1,
  up: [0, 1, 0],
  near: 0.1,
  far: 100,
  wasFit: false,
};

const depthTextureSize = 512;

let yarnProgramData = [];

function initShaders() {
  segmentProgramInfo = initShaderProgram(gl, segVS, FS);
  joinProgramInfo = initShaderProgram(gl, joinVS, FS);
  segmentDepthProgramInfo = initShaderProgram(gl, segColorVS, colorFS);
  joinDepthProgramInfo = initShaderProgram(gl, joinColorVS, colorFS);
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

function initYarn(yarn) {
  const splineBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, splineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, yarn.splinePts, gl.STATIC_DRAW);

  return {
    controlPoints: yarn.pts,
    yarnSplineBuffer: splineBuffer,
    segCount: yarn.splinePts.length / 3 - 1,
    u_color: yarn.color,
    u_width: yarn.diameter,
    segmentVAO: createSegmentVAO(splineBuffer, segmentInstanceBuffer),
    joinVAO: createJoinVAO(splineBuffer, joinInstanceBuffer),
  };
}

function initDepth() {
  depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
    gl.TEXTURE_2D, // target
    0, // mip level
    gl.DEPTH_COMPONENT32F, // internal format
    depthTextureSize, // width
    depthTextureSize, // height
    0, // border
    gl.DEPTH_COMPONENT, // format
    gl.FLOAT, // type
    null // data
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  depthFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // target
    gl.DEPTH_ATTACHMENT, // attachment point
    gl.TEXTURE_2D, // texture target
    depthTexture, // texture
    0 // mip level
  );
}

export function init(yarnData, canvas) {
  gl = canvas.getContext("webgl2");

  if (gl === null) {
    alert("No WebGL :(");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  if (
    !joinProgramInfo ||
    !segmentProgramInfo ||
    !joinDepthProgramInfo ||
    !segmentDepthProgramInfo
  )
    initShaders();

  initInstanceGeometryBuffers();
  initDepth();
  deleteBuffers();
  yarnProgramData = yarnData.map((yarn) => initYarn(yarn));

  stale = false;
  updateCamera();
  if (!camera.wasFit) fit();
}

export function toggleFlip() {
  camera.side = -camera.side;
}

function updateSwatchBbox() {
  const allPts = yarnProgramData.reduce(
    (prev, cur) => prev.concat(cur.controlPoints),
    []
  );

  bbox = bbox3d(allPts);
}

export function fit() {
  updateSwatchBbox();

  const swatchAspect = bbox.dimensions[0] / bbox.dimensions[1];
  const zoom =
    swatchAspect > camera.aspect
      ? (1.1 * bbox.dimensions[0]) / 2
      : (1.1 * bbox.dimensions[1] * camera.aspect) / 2;

  camera.zoom = zoom;
  camera.x = bbox.center[0];
  camera.y = bbox.center[1];
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

function drawYarn(
  yarn,
  viewMatrix,
  projectionMatrix,
  textureDepthMatrix,
  inverseViewMatrix
) {
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

  gl.uniformMatrix4fv(
    segmentProgramInfo.uniformLocations.u_textureMatrix,
    false,
    textureDepthMatrix
  );

  gl.uniformMatrix4fv(
    segmentProgramInfo.uniformLocations.u_inverseViewMatrix,
    false,
    inverseViewMatrix
  );

  gl.uniform1f(segmentProgramInfo.uniformLocations.u_width, yarn.u_width);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.uniform1i(segmentProgramInfo.uniformLocations.u_shadowTexture, 0);

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

  gl.uniformMatrix4fv(
    joinProgramInfo.uniformLocations.u_textureMatrix,
    false,
    textureDepthMatrix
  );

  gl.uniformMatrix4fv(
    joinProgramInfo.uniformLocations.u_inverseViewMatrix,
    false,
    inverseViewMatrix
  );

  gl.uniform1f(joinProgramInfo.uniformLocations.u_width, yarn.u_width);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.uniform1i(joinProgramInfo.uniformLocations.u_shadowTexture, 0);

  // Draw instanced triangle strip along the entire yarn
  gl.drawArraysInstanced(
    gl.TRIANGLES,
    0,
    3, // Three verts in the bevel join geometry
    yarn.segCount - 1 // Join instance count is one less than segment count
  );
}

function updateCamera() {
  resizeCanvasToDisplaySize(gl.canvas);

  camera.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
}

function computeLight() {
  const lightWorldMatrix = m4.lookAt(
    [bbox.center[0], bbox.center[1], Math.sign(camera.side) * 0.2], // position
    bbox.center, // target
    camera.up // up
  );
  const lightProjectionMatrix = m4.orthographic(
    (bbox.dimensions[0] + 1) / 2,
    (-bbox.dimensions[0] - 1) / 2,
    (bbox.dimensions[1] + 1) / 2,
    (-bbox.dimensions[1] - 1) / 2,
    0.1, // near
    1 // far
  );

  return { lightWorldMatrix, lightProjectionMatrix };
}

function computeViewProjection() {
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

  return { viewMatrix, projectionMatrix };
}

function drawYarnDepth(yarn, lightProjectionMatrix, lightViewMatrix) {
  ///////////////////////////////////////////
  // Draw yarn segments
  ///////////////////////////////////////////
  gl.useProgram(segmentDepthProgramInfo.program);
  gl.bindVertexArray(yarn.segmentVAO);

  gl.uniformMatrix4fv(
    segmentDepthProgramInfo.uniformLocations.u_view,
    false,
    lightViewMatrix
  );

  gl.uniformMatrix4fv(
    segmentDepthProgramInfo.uniformLocations.u_projection,
    false,
    lightProjectionMatrix
  );

  gl.uniform1f(segmentDepthProgramInfo.uniformLocations.u_width, yarn.u_width);

  gl.drawArraysInstanced(
    gl.TRIANGLE_STRIP,
    0,
    4, // Four verts in the segment geometry
    yarn.segCount // number of segment instances in this yarn
  );

  ///////////////////////////////////////////
  // Draw yarn joins
  ///////////////////////////////////////////
  gl.useProgram(joinDepthProgramInfo.program);
  gl.bindVertexArray(yarn.joinVAO);

  gl.uniformMatrix4fv(
    joinDepthProgramInfo.uniformLocations.u_view,
    false,
    lightViewMatrix
  );

  gl.uniformMatrix4fv(
    joinDepthProgramInfo.uniformLocations.u_projection,
    false,
    lightProjectionMatrix
  );

  gl.uniform1f(joinDepthProgramInfo.uniformLocations.u_width, yarn.u_width);

  // Draw instanced triangle strip along the entire yarn
  gl.drawArraysInstanced(
    gl.TRIANGLES,
    0,
    3, // Three verts in the bevel join geometry
    yarn.segCount - 1 // Join instance count is one less than segment count
  );
}

function deleteBuffers() {
  yarnProgramData.forEach((yarn) => gl.deleteBuffer(yarn.yarnSplineBuffer));
}

function draw() {
  updateCamera();

  if (stale) updateYarnGeometry();

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const { lightWorldMatrix, lightProjectionMatrix } = computeLight();

  // draw to the depth texture
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const lightViewMatrix = m4.inverse(lightWorldMatrix);

  yarnProgramData.forEach((yarn) =>
    drawYarnDepth(yarn, lightProjectionMatrix, lightViewMatrix)
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  textureMatrix = m4.multiply(textureMatrix, m4.inverse(lightWorldMatrix));

  const { viewMatrix, projectionMatrix } = computeViewProjection();

  const inverseViewMatrix = m4.inverse(viewMatrix);

  yarnProgramData.forEach((yarn) =>
    drawYarn(
      yarn,
      viewMatrix,
      projectionMatrix,
      textureMatrix,
      inverseViewMatrix
    )
  );
}

let yarnData;
let stale = false;

function uploadYarnData(newData) {
  yarnData = newData;
  stale = true;
}

function updateYarnGeometry() {
  yarnData.forEach((yarn, yarnIndex) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, yarnProgramData[yarnIndex].yarnSplineBuffer);
    // gl.bufferSubData(gl.ARRAY_BUFFER, 0, yarn.splinePts);
    gl.bufferData(gl.ARRAY_BUFFER, yarn.splinePts, gl.STATIC_DRAW);
  });

  stale = false;
}

export const renderer = {
  init,
  draw,
  uploadYarnData,
};
