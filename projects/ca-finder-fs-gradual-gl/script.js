const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 texCoords;

void main() {
  texCoords = (position + 1.0) / 2.0;
  texCoords.y = 1.0 - texCoords.y;
  gl_Position = vec4(position, 0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 texCoords;
uniform sampler2D textureSampler;
uniform float timestamp;

float filledFactor = 0.5;
float pixelRange = filledFactor * 127.5;

void main() {
  float lum = texture2D(textureSampler, texCoords).r * 255.0;
  float target = mod(timestamp / 50.0, 255.0);
  float dist = abs(lum - target);
  dist = abs(mod(dist + 128.0, 255.0) - 128.0);
  float isForeground = step(dist, pixelRange);
  gl_FragColor = vec4(0.11, 0.11, 0.098, 1.0) * isForeground;
}
`;

((_) => {
  const neighbourRange = 4;
  const flickerReductionFactor = 1.5;
  const pixelSize = 5;
  const maxWeight = 4;
  const nFramesPerMutate = 15;

  const colors = [
    [95, 87, 79],
    [29, 43, 83],
    [126, 37, 83],
    [0, 135, 81],
    [131, 118, 156],
    [171, 82, 54],
    [255, 0, 77],
    [41, 173, 255],
    [255, 163, 0],
    [194, 195, 199],
    [255, 204, 170],
  ].map(
    (c) =>
      (255 << 24) | // alpha
      (c[2] << 16) | // blue
      (c[1] << 8) | // green
      c[0] // red
  );
  const nColors = colors.length;
  const nNeighbours = Math.pow(neighbourRange * 2 + 1, 2);

  const WIDTH = Math.ceil(window.innerWidth / pixelSize);
  const HEIGHT = Math.ceil(window.innerHeight / pixelSize);
  const N_PIXELS = WIDTH * HEIGHT;

  function getRandomRuleValue() {
    return Math.min(
      Math.floor(Math.random() * (nColors + 1) * (1 + flickerReductionFactor)),
      nColors
    );
  }

  function getRandomWeightValue() {
    return Math.floor(Math.random() * (maxWeight + 1));
  }

  // Initialize the WebGL canvas.
  const canvas = document.getElementById("ca-canvas");
  canvas.height = HEIGHT;
  canvas.width = WIDTH;
  canvas.style.height = `${HEIGHT * pixelSize}px`;
  canvas.style.width = `${WIDTH * pixelSize}px`;

  const gl = canvas.getContext("webgl");
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  // Compile shaders.
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, VERTEX_SHADER);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
  gl.compileShader(fragmentShader);

  // Create and link program.
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Fullscreen quad vertices.
  const VERTICES = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "position");
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  const glTimestamp = gl.getUniformLocation(program, "timestamp");
  gl.uniform1i(gl.getUniformLocation(program, "textureSampler"), 0);

  // Create texture (RGBA for direct pixel upload).
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, WIDTH, HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Pre-allocate pixel buffer (RGBA) for texture upload.
  const pixelBuffer = new ArrayBuffer(N_PIXELS * 4);
  const pixelBuffer32 = new Uint32Array(pixelBuffer);
  const pixelBuffer8 = new Uint8Array(pixelBuffer);

  // Double-buffered CA grids.
  const gridA = new Uint8Array(N_PIXELS);
  const gridB = new Uint8Array(N_PIXELS);
  const priorRules = [];

  // Mutable state.
  let slowMotion = false;
  let rule;
  let weights;
  let doubleBufferFlip;
  let frame;
  let ruleLength;
  let minCount;
  let maxCount;

  function init(command, randomizeGrids) {
    doubleBufferFlip = false;
    frame = 0;

    if (randomizeGrids) {
      for (let i = 0; i < N_PIXELS; ++i) {
        gridA[i] = Math.floor(Math.random() * nColors);
        gridB[i] = Math.floor(Math.random() * nColors);
      }
    }

    switch (command) {
      case "UNDO":
        if (priorRules.length > 1) {
          weights = priorRules[priorRules.length - 2].map((arr) =>
            Uint8Array.from(arr)
          )[1];
        }
        break;
      case "MUTATE":
        const weightIdx = Math.floor(Math.random() * nColors);
        const oldWeightValue = weights[weightIdx];
        weights[weightIdx] =
          oldWeightValue === 0
            ? 1
            : oldWeightValue === maxWeight
            ? 2
            : oldWeightValue + (Math.random() < 0.5 ? -1 : 1);
        break;
      case "START":
      case "REPLACE":
        weights = Uint8Array.from(
          Array.from({ length: nColors }, getRandomWeightValue)
        );
        break;
    }

    const countStats = Array.from(weights).reduce(
      (acc, weight) => {
        if (weight < acc.minCount) acc.minCount = weight;
        if (weight > acc.maxCount) acc.maxCount = weight;
        return acc;
      },
      { minCount: Infinity, maxCount: -Infinity }
    );
    minCount = countStats.minCount * nNeighbours;
    maxCount = countStats.maxCount * nNeighbours;
    ruleLength = maxCount - minCount + 1;

    switch (command) {
      case "UNDO":
        if (priorRules.length > 1) {
          priorRules.pop();
          rule = priorRules[priorRules.length - 1].map((arr) =>
            Uint8Array.from(arr)
          )[0];
        }
        break;
      case "MUTATE":
        const ruleIdx = Math.floor(Math.random() * ruleLength);
        const oldRuleValue = rule[ruleIdx];
        let newRuleValue;
        do {
          newRuleValue = getRandomRuleValue();
        } while (newRuleValue === oldRuleValue);
        rule[ruleIdx] = newRuleValue;
        priorRules.push([Array.from(rule), Array.from(weights)]);
        break;
      case "START":
      case "REPLACE":
        rule = Uint8Array.from(
          Array.from({ length: ruleLength }, getRandomRuleValue)
        );
        priorRules.push([Array.from(rule), Array.from(weights)]);
        break;
    }

    console.log(
      `${command}! Weights: [${weights}]  Rule: [${rule}] Neighbour range: ${neighbourRange}`
    );
  }

  init("START", true);

  function loop(t) {
    const [grid, nextGrid] = doubleBufferFlip ? [gridB, gridA] : [gridA, gridB];
    nextGrid.set(grid);

    // CA simulation step.
    for (let y = 0; y < HEIGHT; ++y) {
      for (let x = 0; x < WIDTH; ++x) {
        const i = x + y * WIDTH;
        const currentColor = grid[i];
        let nextColor;

        if (Math.random() < 0.004) {
          nextColor = Math.floor(Math.random() * nColors);
        } else {
          let count = 0;
          for (let dy = -neighbourRange; dy <= neighbourRange; ++dy) {
            let ny = y + dy;
            if (ny < 0) ny += HEIGHT;
            else if (ny >= HEIGHT) ny -= HEIGHT;

            for (let dx = -neighbourRange; dx <= neighbourRange; ++dx) {
              let nx = x + dx;
              if (nx < 0) nx += WIDTH;
              else if (nx >= WIDTH) nx -= WIDTH;

              count += weights[grid[nx + ny * WIDTH]];
            }
          }
          nextColor = rule[count - minCount];
        }

        if (nextColor === nColors) nextColor = currentColor;
        if (nextColor !== currentColor) nextGrid[i] = nextColor;
      }
    }

    // Write nextGrid colors to pixel buffer.
    for (let i = 0; i < N_PIXELS; ++i) {
      pixelBuffer32[i] = colors[nextGrid[i]];
    }

    // Upload pixel buffer directly to texture and draw.
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer8);
    gl.uniform1f(glTimestamp, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    doubleBufferFlip = !doubleBufferFlip;
    ++frame;
    if (!(frame % nFramesPerMutate)) init("MUTATE");

    slowMotion ? setTimeout(() => requestAnimationFrame(loop), 41.66) : requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  let keysDown = {};
  window.addEventListener(
    "keyup",
    (event) => {
      delete keysDown[event.key];
    },
    true
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented || keysDown[event.key]) return;

      switch (event.key) {
        case "Down":
        case "ArrowDown":
          init("RESET", true);
          break;
        case "Up":
        case "ArrowUp":
          init("REPLACE", true);
          break;
        case "Left":
        case "ArrowLeft":
          init("UNDO", true);
          break;
        case "Right":
        case "ArrowRight":
          init("MUTATE", true);
          break;
        case " ":
          slowMotion = !slowMotion;
          return;
        default:
          return;
      }

      keysDown[event.key] = true;
      event.preventDefault();
    },
    true
  );
})();
