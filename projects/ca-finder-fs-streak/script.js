((_) => {
  const neighbourRange = 4;
  const flickerReductionFactor = 1; // Increases a rule value’s status of being “remain the same value”.
  const pixelSize = 5;
  const maxWeight = 4;
  const nFramesPerMutate = 15;

  const nColors = 6;
  const colors = Array.from({length: nColors}, (_, i) => Math.floor(i * 255 / (nColors - 1)));
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

  // Initialize the canvas.
  const canvas = document.getElementById("ca-canvas");
  const ctx = canvas.getContext("2d");
  canvas.height = HEIGHT;
  canvas.width = WIDTH;
  canvas.style.height = `${HEIGHT * pixelSize}px`;
  canvas.style.width = `${WIDTH * pixelSize}px`;

  // We create an image buffer for the format [0 0 0 A 0 0 0 A 0 0 0 A…],
  const imageBuffer = new ArrayBuffer(N_PIXELS * 4);
  const pixelBuffer8 = new Uint8ClampedArray(imageBuffer);

  // We implement a sort of double-buffering system here. One
  // array holds the current color, and the other holds the
  // next color. On each iteration, we flip which is which.
  const gridA = new Uint8Array(HEIGHT * WIDTH);
  const gridB = new Uint8Array(HEIGHT * WIDTH);
  const priorRules = [];

  // Mutable state…
  let slowMotion = false;
  // …the rest is initialized in `init()`.
  let rule;
  let weights;
  let doubleBufferFlip;
  let frame;
  let ruleLength;
  let minCount;
  let maxCount;

  function init(command, randomizeGrids) {
    doubleBufferFlip = false;

    // Reset frame-related state.
    frame = 0;
    
    if (randomizeGrids) {
      for (let i = 0; i < N_PIXELS; ++i) {
        gridA[i] = Math.floor(Math.random() * nColors);
        gridB[i] = Math.floor(Math.random() * nColors);
      }
    }

    // Update weights first. Updating rule and priorRules happen in the next switch.
    switch (command) {
      case "UNDO":
        if (priorRules.length > 1) {
          weights = priorRules[priorRules.length - 2].map((arr) =>
            Uint8Array.from(arr)
          )[1];
        }
        break;
      case "MUTATE":
        // Change a single value.
        const weightIdx = Math.floor(Math.random() * nColors);
        const oldWeightValue = weights[weightIdx];
        weights[weightIdx] = oldWeightValue === 0 ? 1 : oldWeightValue === maxWeight ? 2 : oldWeightValue + (Math.random() < 0.5 ? -1 : 1);
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
    minCount = countStats.minCount;
    maxCount = countStats.maxCount;

    minCount *= nNeighbours;
    maxCount *= nNeighbours;
    // Imagine minCount is 0 and maxCount is 1. The rule array would need
    // to be of length 2 to handle both outcomes. So we do the following:
    ruleLength = maxCount - minCount + 1;

    // …then, update the rule array using the new weights.
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
        // Change a single value.
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
        // Replace the rule with an entirely new one.
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

  (function loop() {
    const [grid, nextGrid] = doubleBufferFlip ? [gridB, gridA] : [gridA, gridB];
    nextGrid.set(grid);

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

        if (nextColor === nColors) nextColor = currentColor; // If there are 4 colors, a value of "4" indicates the cell should remain the same.
        const isColorDifferent = nextColor !== currentColor;
        if (isColorDifferent) nextGrid[i] = nextColor;
      }
    }

    for (let i = 0; i < N_PIXELS; ++i) {
      const color = nextGrid[i];
      pixelBuffer8[4 * i + 3] = colors[color];
    }
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    imageData.data.set(pixelBuffer8);
    ctx.putImageData(imageData, 0, 0);

    doubleBufferFlip = !doubleBufferFlip;
    slowMotion ? setTimeout(loop, 41.66) : requestAnimationFrame(loop);
    
    ++frame;
    if (!(frame % nFramesPerMutate)) init('MUTATE');
  })();

  let keysDown = {};
  window.addEventListener(
    "keyup",
    function (event) {
      delete keysDown[event.key];

      if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
      }
    },
    true
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (event.defaultPrevented || keysDown[event.key]) {
        return; // Do nothing if the event was already processed
      }

      switch (event.key) {
        case "Down": // IE/Edge specific value
        case "ArrowDown":
          // Restart the current iteration.
          init("RESET", true);
          break;
        case "Up": // IE/Edge specific value
        case "ArrowUp":
          init("REPLACE", true);
          break;
        case "Left": // IE/Edge specific value
        case "ArrowLeft":
          init("UNDO", true);
          break;
        case "Right": // IE/Edge specific value
        case "ArrowRight":
          init("MUTATE", true);
          break;
        case " ":
          slowMotion = !slowMotion;
          return;
        default:
          return; // Quit when this doesn't handle the key event.
      }

      keysDown[event.key] = true;

      // Cancel the default action to avoid it being handled twice.
      event.preventDefault();
    },
    true
  );
})();
