((_) => {
  const chaosRatioMin = 0.5;
  const chaosRatioMax = 0.22;
  const nColorsMin = 2;
  const nColorsMax = Infinity;
  const qualityCheckStartFrame = 360; // Grace period before chaos threshold is analyzed.
  const qualityCheckEndFrame = 900; // Don’t auto-update the rule based on chaos after this point.
  const qualityCheckConsecutiveFrames = 80; // Number of frames in a row that need to fall out-of-range to trigger qualityCheckCommand.
  const qualityCheckCommand = "MUTATE";
  const neighbourRange = 3;
  const flickerReductionFactor = 1; // Increases a rule value’s status of being “remain the same value”.
  const pixelSize = 3;

  // Initialize possible cell states.
  // Colors borrowed from PICO-8! :)
  // originalStates is kept here for some saved rules below.
  // const originalStates = [
  //   {weight: 0, color: '#000000'},
  //   {weight: 0, color: '#1D2B53'},
  //   {weight: 0, color: '#7E2553'},
  //   {weight: 0, color: '#008751'},
  //   {weight: 1, color: '#AB5236'},
  //   {weight: 1, color: '#5F574F'},
  //   {weight: 1, color: '#C2C3C7'},
  //   {weight: 1, color: '#FFF1E8'},
  //   {weight: 0, color: '#FF004D'},
  //   {weight: 0, color: '#FFA300'},
  //   {weight: 1, color: '#FFEC27'},
  //   {weight: 1, color: '#00E436'},
  //   {weight: 1, color: '#29ADFF'},
  //   {weight: 1, color: '#83769C'},
  //   {weight: 1, color: '#FF77A8'},
  //   {weight: 1, color: '#FFCCAA'},
  // ];
  const colors = [
    [0, 0, 0],
    [95, 87, 79],
    [29, 43, 83],
    [126, 37, 83],
    [0, 135, 81],
    [131, 118, 156],
    // [171, 82, 54],
    [255, 0, 77],
    [41, 173, 255],
    [255, 163, 0],
    // [255, 119, 168],
    [194, 195, 199],
    // [0, 228, 54],
    [255, 204, 170],
    [255, 236, 39],
    // [255, 241, 232],
  ].map(
    (c) =>
      (255 << 24)  | // alpha
      (c[2] << 16) | // blue
      (c[1] << 8)  | // green
      c[0]           // red
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
    return Math.random() > 0.5 ? 0 : 1;
  }

  // // Before color reorganization:
  //   Camo: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [3,1,0,1,0,2,4,4,4,4] Neighbour range: 1
  //   Multicolor GOL: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [14,7,11,11,15,16,8,10,15,7] Neighbour range: 1
  //   Crawlers: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [4,4,1,0,3,1,14,10,9,4] Neighbour range: 1
  //   ^ another: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [4,4,1,0,3,1,3,10,9,4] Neighbour range: 1
  //   Rainbow cow: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,2,9,9,4,13,8,16,12,12] Neighbour range: 1
  //   ^ another: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,2,9,9,4,7,8,16,12,12] Neighbour range: 1
  //   N Dimensional: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [3,1,0,1,0,2,4,4,4,4] Neighbour range: 2
  //   Ooze: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [15,4,11,7,9,6,16,6,1,12,8,8,1,8,0,12,3,4,3,8,13,16,16,14,16,12] Neighbour range: 2
  //   Yellow: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,12,16,6,15,14,14,0,1,0,2,0,0,14,7,9,5,1,13,13,16,3,15,11,16,10] Neighbour range: 2
  //   !! Yellow ooze: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,12,16,6,15,8,14,0,1,0,2,0,0,14,7,9,5,1,13,13,16,3,3,11,16,10] Neighbour range: 2
  //   ^ another: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,12,0,6,15,8,14,0,1,8,2,0,0,3,7,9,5,1,10,13,16,3,3,11,16,10] Neighbour range: 2
  //   ^ another: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [0,12,0,6,15,8,14,0,1,8,2,0,0,3,7,9,5,1,10,13,11,3,3,11,16,10] Neighbour range: 2
  //   Maximum strobe: Weights: [0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1]  Rule: [11,16,3,7,9,6,15,5,4,4,12,14,12,11,10,10,14,8,13,0,2,5,9,13,2,0] Neighbour range: 2
  //   Yellow squids: Weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  Rule: [10,16,9,16,14,8,5,11,7,10,4,16,0,9,10,4,14,5,6,12,2,6,2,1,1,2] Neighbour range: 2
  //   Cave painting: Weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  Rule: [16,0,0,13,13,12,5,12,8,16,14,7,14,8,12,13,6,7,11,11,13,4,10,0,14,4] Neighbour range: 2
  //   Agar: Weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  Rule: [5,4,2,4,16,11,7,15,15,9,14,1,3,15,11,1,12,16,5,9,8,7,13,10,1,13] Neighbour range: 2
  //   Bubble pop: Weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  Rule: [7,0,2,4,14,16,2,12,0,9,4,11,8,3,10,1,4,11,12,15,9,8,10,6,8,9] Neighbour range: 2
  //   Rusty motherboard: Weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  Rule: [16,6,4,10,2,0,14,1,3,2,11,6,2,7,7,8,12,12,5,12,6,2,16,16,6,3] Neighbour range: 2

  //   After color reorganization:
  //   Neurons: MUTATE! Weights: [1,1,1,0,0,1,1,0,0,0,1,0,0,1,1,0]  Rule: [16,16,0,0,16,3,16,10,4,16] Neighbour range: 1
  //   Sunflowers: Weights: [0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0]  Rule: [13,0,10,15,12,0,16,14,4,5] Neighbour range: 1
  //   Mazerunner: Weights: [0,1,1,1,0,1,0,1,1,0,1,0,0,1,0,1]  Rule: [6,16,10,16,16,14,1,16,6,3] Neighbour range: 1
  //   Farmers: Weights: [0,1,0,1,0,0,0,0,0,1,1,0,0,0,1,1]  Rule: [9,5,1,16,7,16,12,13,9,16] Neighbour range: 1
  //   PCB:  Weights: [0,0,0,1,0,0,0,1,1,1,0,1,0,1,0,1]  Rule: [1,0,16,9,15,16,1,16,16,12] Neighbour range: 1
  //   Stained glass: Weights: [1,1,1,1,0,0,1,1,1,0,0,0,0,1,0,1]  Rule: [3,16,15,7,16,16,2,0,5,11] Neighbour range: 1
  //   Mutant gene: Weights: [1,0,1,0,0,1,1,0,0,1,0,0,0,0,1,1]  Rule: [6,1,5,15,12,4,12,4,7,1] Neighbour range: 1
  //   !!! Hi-fi infection: Weights: [1,0,1,0,1,0,1,0,0,1,1,1,0,1,0,0]  Rule: [16,1,9,1,16,8,7,6,12,0,4,9,16,6,2,7,3,16,11,16,16,6,7,16,3,3,5,0,9,13,13,14,4,16,16,16,4,5,11,3,16,11,16,10,9,4,5,6,1,2] Neighbour range: 3
  //   !!! Hi-fi puddle ripples: Weights: [1,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0]  Rule: [16,8,16,1,16,8,6,13,16,11,16,0,2,16,2,6,1,7,2,6,7,11,12,11,16,7,14,0,0,16,14,16,8,16,9,1,5,16,6,7,13,9,16,16,15,9,4,8,10,15] Neighbour range: 3
  //   Retro wallpaper: Weights: [1,0,1,1,1,1,1,0,1,1,0,1,1,1,0,0]  Rule: [0,16,1,10,12,6,0,16,8,9,3,16,11,7,7,16,14,6,16,1,3,11,11,16,2,15,7,3,15,14,5,0,3,1,12,0,2,8,16,16,8,0,16,9,16,11,16,9,10,8] Neighbour range: 3
  //   Pink elephants: MUTATE! Weights: [1,1,0,1,0,1,1,0,0,1,1,1,1,1,1,1]  Rule: [8,6,15,10,5,1,16,6,11,1,5,14,16,9,8,16,5,16,16,15,16,1,8,16,14,13,16,5,16,8,10,7,10,1,8,16,11,13,9,13,16,13,2,16,16,3,15,1,7,15] Neighbour range: 3
  //   !!! Hi-fi: Sweat drops: Weights: [1,0,0,0,1,0,1,0,0,1,0,1,1,0,0,0]  Rule: [16,5,9,10,13,6,16,15,5,13,13,14,11,16,5,16,3,2,4,7,16,16,0,0,8,16,16,11,14,16,16,0,1,16,15,0,16,2,2,12,16,13,16,16,14,14,16,0,7,13] Neighbour range: 3
  //   !!! Hi-fi: ^ another: Weights: [1,0,1,0,1,0,1,0,0,1,0,0,1,0,0,0]  Rule: [16,5,9,14,13,6,16,15,5,13,13,14,11,16,5,16,3,2,4,7,16,16,0,0,8,16,16,11,14,16,16,0,1,16,15,0,16,2,2,12,16,13,16,16,14,14,16,0,7,12] Neighbour range: 3
  //   !!! Hi-fi: Slow evaporation: Weights: [1,0,0,0,1,0,1,0,0,0,0,1,1,0,0,0]  Rule: [16,5,9,10,13,6,16,15,5,13,13,14,11,16,5,16,3,3,4,7,16,16,0,0,8,16,16,11,14,16,16,0,1,16,15,0,16,2,2,12,16,13,16,16,14,14,16,0,7,13] Neighbour range: 3
  //   !!! Hi-fi: Heavy rain: Weights: [0,0,0,0,1,0,1,1,1,0,0,0,1,0,0,0]  Rule: [16,5,9,10,13,6,16,6,5,13,13,14,11,16,5,13,3,3,4,7,16,16,0,0,8,16,16,11,14,16,16,8,1,16,15,0,16,2,2,12,16,13,16,16,14,14,16,13,7,13] Neighbour range: 3
  //   !!! Hi-fi: ^ another: Weights: [0,1,0,0,1,0,1,0,1,0,1,0,1,0,0,0]  Rule: [0,1,9,10,13,6,16,6,5,13,13,14,11,16,5,13,3,3,4,7,16,16,0,0,8,16,16,11,14,16,16,8,1,16,9,0,16,2,2,12,16,13,16,16,14,14,16,13,7,13] Neighbour range: 3
  //   !!! Hi-fi: School of fish: Weights: [1,1,0,0,1,1,0,0,1,0,1,0,0,1,0,1]  Rule: [0,5,9,10,13,6,16,6,5,13,13,14,11,16,16,13,3,3,4,7,16,13,16,11,8,16,16,16,14,16,16,8,1,0,9,0,16,2,9,2,3,13,16,16,16,10,10,10,7,13] Neighbour range: 3
  //   Abstract swirl: Weights: [0,1,0,0,1,1,0,0,0,1,0,1,0,0,0,1]  Rule: [11,5,16,16,13,14,14,4,12,6,12,4,5,8,6,6,16,16,15,16,15,2,16,0,9,6,5,9,16,6,16,3,8,5,4,16,15,16,16,4,1,16,16,16,12,1,10,4,2,16] Neighbour range: 3
  //   Slugs: Weights: [0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,1]  Rule: [14,1,1,15,16,13,16,12,9,9,16,13,16,2,9,8,16,16,8,4,2,3,3,5,7,8,15,16,16,16,7,8,13,6,15,9,4,6,6,0,16,5,16,0,9,5,9,15,12,11] Neighbour range: 3
  //   Wind in the trees: Weights: [1,1,0,1,1,1,0,0,1,0,1,0,1,0,1,0]  Rule: [5,16,16,6,1,9,8,16,2,16,3,16,15,13,4,10,8,16,0,11,1,16,6,9,16,13,1,16,0,16,16,2,12,2,1,6,8,2,1,16,16,3,6,16,16,6,3,2,9,2] Neighbour range: 3
  //   !!! Hi-fi: 90s hackers: Weights: [0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1]  Rule: [12,0,12,16,8,15,8,9,13,5,16,8,12,16,16,8,4,8,4,16,16,8,5,13,11,4,12,11,16,16,1,1,3,0,16,6,7,1,1,1,2,9,9,2,2,2,7,2,12,1] Neighbour range: 3
  //   ^ another: Weights: [0,1,1,1,0,1,1,0,0,1,1,1,0,1,1,1]  Rule: [12,0,12,16,8,15,8,9,13,5,16,8,12,16,16,8,4,8,4,16,16,8,0,13,11,4,12,11,16,16,1,1,3,0,16,6,7,1,1,1,2,9,9,2,2,2,7,2,12,1] Neighbour range: 3
  //   Forest fire: Weights: [0,0,0,0,1,1,1,1,1,1,1,1,0,1,0,1]  Rule: [5,8,5,9,5,9,3,9,7,16,16,1,16,16,1,16,0,1,11,12,16,16,3,4,0,7,15,16,16,0,11,2,6,2,10,14,8,16,4,5,7,5,9,16,13,11,0,9,0,15] Neighbour range: 3
  //   Max forest fire: Weights: [0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,1]  Rule: [16,8,1,16,5,9,3,9,7,16,16,1,16,16,1,16,0,1,11,12,16,16,3,5,0,7,15,16,16,0,11,2,6,2,10,14,8,16,4,5,7,5,9,16,13,11,0,4,0,15] Neighbour range: 3
  //   Shimmering water: Weights: [1,1,1,0,0,1,1,0,1,1,0,0,1,1,0,0]  Rule: [10,16,8,15,3,13,16,11,16,16,16,8,16,10,16,16,16,3,16,16,8,14,10,5,3,2] Neighbour range: 2
  //   Termites: Weights: 0,1,0,1,1,0,0,0,1,0,0,0,1,0,0,1]  Rule: [16,16,16,7,1,16,16,11,16,6,16,14,16,16,10,6,3,16,11,1,16,9,2,1,16,0] Neighbour range: 2
  //   !!! Hi-fi: Trellis: Weights: [1,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1]  Rule: [16,16,15,13,4,16,13,16,16,16,1,0,16,16,0,1,16,16,2,4,10,16,16,12,1,3] Neighbour range: 2
  //   Ghosts: Weights: [0,0,1,0,0,0,0,1,1,1,1,1,1,1,0,0]  Rule: [16,16,16,15,9,2,16,16,0,16,16,7,16,5,16,8,0,16,16,9,16,9,10,4,8,16] Neighbour range: 2
  //   !!! FROGS: Weights: [1,1,1,0,1,1,0,1,1,1,0,1,0,0,0,0]  Rule: [16,15,9,2,5,13,5,10,16,16,16,15,12,9,16,16,16,16,16,2,2,16,12,8,4,16] Neighbour range: 2
  // Add your fave combos here! <3

  // Initialize the canvas.
  const canvas = document.getElementById("ca-canvas");
  const ctx = canvas.getContext("2d");
  canvas.height = HEIGHT;
  canvas.width = WIDTH;
  canvas.style.height = `${HEIGHT * pixelSize}px`;
  canvas.style.width = `${WIDTH * pixelSize}px`;

  // We create an image buffer for the format [R G B A R G B A R G B A…],
  // but write to it only once per color by using this technique:
  // https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays
  const imageBuffer = new ArrayBuffer(N_PIXELS * 4);

  // We implement a sort of double-buffering system here. One
  // array holds the current color, and the other holds the
  // next color. On each iteration, we flip which is which.
  const gridA = new Uint8Array(HEIGHT * WIDTH);
  const gridB = new Uint8Array(HEIGHT * WIDTH);
  const priorRules = [];

  // Mutable state…
  let prevAutoMutateFrame = 0;
  let slowMotion = false;
  // …the rest is initialized in `init()`.
  let rule;
  let weights;
  let doubleBufferFlip;
  let frame;
  let consecutiveBadFrames;
  let minCount;
  let maxCount;
  let ruleLength;

  function init(command, randomizeGrids) {
    doubleBufferFlip = false;

    // Reset frame-related state.
    frame = 0;
    consecutiveBadFrames = 0;
    
    if (randomizeGrids) {
      for (let i = 0; i < N_PIXELS; ++i) {
        gridA[i] = Math.floor(Math.random() * nColors);
        gridB[i] = Math.floor(Math.random() * nColors);
      }
    } else {
      // Add a bit of spice.
      for (let i = 0; i < N_PIXELS / 200; ++i) {
        let index = Math.floor(Math.random() * N_PIXELS);
        gridA[index] = Math.floor(Math.random() * nColors);
        gridB[index] = Math.floor(Math.random() * nColors);
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
        weights[weightIdx] = 1 - weights[weightIdx];
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

    const colorsSeen = new Set();
    let chaosCount = 0;
    for (let y = 0; y < HEIGHT; ++y) {
      for (let x = 0; x < WIDTH; ++x) {
        const i = x + y * WIDTH;
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

        const currentColor = grid[i];
        let nextColor = rule[count - minCount];
        if (nextColor === nColors) nextColor = currentColor; // If there are 4 colors, a value of "4" indicates the cell should remain the same.

        colorsSeen.add(nextColor);
        const isColorDifferent = nextColor !== currentColor;
        if (isColorDifferent) {
          nextGrid[i] = nextColor;
          ++chaosCount;
        }
      }
    }

    if (frame > qualityCheckStartFrame && frame < qualityCheckEndFrame) {
      const chaosRatio = chaosCount / N_PIXELS;
      const nColorsSeen = colorsSeen.size;
      if (
        chaosRatio < chaosRatioMin ||
        chaosRatio > chaosRatioMax ||
        nColorsSeen < nColorsMin ||
        nColorsSeen > nColorsMax
      ) {
        ++consecutiveBadFrames;
        if (consecutiveBadFrames > qualityCheckConsecutiveFrames) {
          console.log(
            `Auto-mutating.\tchaosRatio: ${chaosRatio}\tnColorsSeen: ${nColorsSeen}\tFrame: ${frame}`
          );
          if (prevAutoMutateFrame <= frame) {
            // If this auto-mutation lasted longer than the last, mutate it…
            prevAutoMutateFrame = frame;
            init(qualityCheckCommand);
          } else {
            // …otherwise, the last rule was better. Go back and mutate it.
            init("UNDO");
            init(qualityCheckCommand);
          }
        }
      } else consecutiveBadFrames = 0;
    }

    // Draw nextGrid to the canvas.
    const pixelBuffer32 = new Uint32Array(imageBuffer); // 32-bit view into the array, for quicker insertion.
    const pixelBuffer8 = new Uint8ClampedArray(imageBuffer); // 8-bit view into the array, for imageData compatibility.
    for (let i = 0; i < N_PIXELS; ++i) {
      const color = nextGrid[i];
      pixelBuffer32[i] = colors[color];
    }
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    imageData.data.set(pixelBuffer8);
    ctx.putImageData(imageData, 0, 0);

    doubleBufferFlip = !doubleBufferFlip;
    slowMotion ? setTimeout(loop, 41.66) : requestAnimationFrame(loop);
    ++frame;
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

      // This was a manual action, so clear all auto-mutate state.
      prevAutoMutateFrame = 0;

      // Cancel the default action to avoid it being handled twice.
      event.preventDefault();
    },
    true
  );
})();
