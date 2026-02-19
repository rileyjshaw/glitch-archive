(() => {
  // Initialize possible cell states.
  const states = [
    // {weight: 0, color: '#ffff00'},
    {weight: 0, color: '#ff0000'},
    {weight: 0, color: '#ff00ff'},
    {weight: 1, color: '#0000ff'},
    // {weight: 1, color: '#00ff00'},
    {weight: 1, color: '#00ffff'},
  ];
  const nStates = states.length;
  const buffer = new ArrayBuffer(nStates * (Uint8Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT));
  const weights = Int8Array.from(states.map(({weight}) => weight));
  const colors = states.map(({color}) => color);
  
  const size = 160;
  const pixelSize = 8;
  
  let {minWeight, maxWeight} = states.reduce((acc, {weight}) => {
    if (weight < acc.minWeight) acc.minWeight = weight;
    if (weight > acc.maxWeight) acc.maxWeight = weight;
    return acc;
  }, {minWeight: Infinity, maxWeight: -Infinity});
  minWeight *= 9; maxWeight *= 9;  // 9 neighbours.
  const nPotentialWeights = maxWeight - minWeight + 1;
  
  // Sparkles: [ 2, 4, 3, 4, 4, 4, 3, 0, 2 ]
  // Headache: [ 3, 3, 4, 2, 1, 0, 3, 0, 0 ]
  // Slimey: [ 4, 1, 0, 1, 4, 0, 3, 2, 2 ]
  // Broil: [ 3, 0, 3, 0, 3, 3, 0, 1, 1 ]
  // Amoebas: [ 3, 2, 3, 3, 3, 0, 0, 0, 1 ]
  // Bus seat: [ 2, 1, 4, 3, 2, 1, 1, 1, 1 ]
  // Fluffy: [ 3, 1, 3, 2, 0, 1, 2, 2, 2 ]
  // Lifelike: Weights: [0,1,1,255]  Rule: [2,3,1,1,2,2,4,4,0,4,0,0,1,1,0,2,2,3,0]
  // Arrows: Weights: [0,1,1,255]   Rule: [4,3,2,0,1,1,3,1,1,0,0,1,3,0,2,1,4,2,0]
  // Lakes: Weights: [0,1,1,1]  Rule: [4,0,2,2,0,3,0,3,4,1]
  // Slime: Weights: [0,0,0,1,1,1]  Rule: [2,1,0,1,3,1,6,4,3,6]
  // Caves: Weights: [0,0,0,1,1,1]  Rule: [2,2,6,0,6,5,4,3,2,5]
  // Blobs: Weights: [0,0,0,1,1,1]  Rule: [1,1,0,4,2,2,3,5,4,4]
  // Looks great with panning (nx from -2 to 0): Weights: [0,0,0,1,1,1]  Rule: [1,3,1,6,1,4,4,0,4,3]
  // Static blobs: Weights: [0,0,0,1,1,1]  Rule: [2,6,1,2,4,2,4,3,5,4]
  // ^but inverse: Weights: [0,0,0,1,1,1]  Rule: [4,5,3,6,3,2,6,2,2,2]
  // Slow mold: Weights: [0,0,0,1,1,1]  Rule: [1,4,5,0,6,3,5,3,6,4]
  // ^Another: Weights: [0,0,0,1,1,1]  Rule: [0,6,1,5,2,6,4,1,5,1]
  // Swiss cheese: Weights: [0,0,0,1,1,1]  Rule: [0,6,1,1,0,6,3,4,5,3]
  // Traffic: Weights: [0,0,0,1,1,1]  Rule: [0,1,2,4,6,6,0,3,6,2]
  // City with lakes: Weights: [0,0,0,1,1,1]  Rule: [4,5,3,6,1,6,6,2,2,2]
  // Splat: Weights: [0,0,0,1,1,1]  Rule: [0,6,6,0,2,3,6,3,3,3]
  // Camo: Weights: [0,0,1,1]  Rule: [0,4,1,0,4,4,3,3,3,3]
  // Slow blobs: Weights: [0,0,1,1]  Rule: [3,1,2,4,4,0,3,4,2,3]
  // Lakes: Weights: [0,0,1,1]  Rule: [1,1,1,0,2,1,3,3,4,3]
  // Shimmering lakes: Weights: [0,0,1,1]  Rule: [1,1,1,0,2,1,3,3,2,3]
  // or: Weights: [0,0,1,1]  Rule: [1,1,1,0,2,1,2,3,2,3]
  // Shards: Weights: [0,0,1,1]  Rule: [3,1,0,1,0,2,4,4,4,4]
  // Cracks: Weights: [0,0,1,1]  Rule: [4,4,3,3,4,0,4,4,3,4]
  // Stars (for Kalaaj): Weights: [0,0,1,1]  Rule: [0,4,0,0,2,3,1,4,4,0]
  // Vitreous: Weights: [0,0,1,1]  Rule: [2,3,4,1,4,2,4,0,3,2]
  // Sparks: Weights: [0,0,1,1]  Rule: [4,3,4,1,4,2,4,0,2,2]
  // Electric goop: Weights: [0,0,1,1]  Rule: [2,2,1,3,3,4,1,2,2,2]
  // Exploding islands: Weights: [0,0,1,1]  Rule: [1,4,2,3,3,4,0,2,3,2]
  // Radioactive residue: Weights: [0,0,1,1]  Rule: [0,1,1,1,1,4,2,3,4,4]
  // or: Weights: [0,0,1,1]  Rule: [0,1,1,1,1,4,2,3,4,4]
  // Goopy circuit: Weights: [0,0,1,1]  Rule: [1,0,1,3,4,0,0,2,4,4]
  // Add your fave combos here! <3
  
  // Initialize the canvas.
  const canvas = document.getElementById('ca-canvas');
  const ctx = canvas.getContext('2d');
  canvas.height = size * pixelSize;
  canvas.width = size * pixelSize;
  canvas.style.height = canvas.style.width = `${size * pixelSize / 2}px`;

  // We implement a sort of double-buffering system here. One
  // array holds the current state, and the other holds the
  // next state. On each iteration, we flip which is which.
  const gridA = new Uint8Array(size * size);
  const gridB = new Uint8Array(size * size);
  const priorRules = [Array.from({length: nPotentialWeights}, _ => Math.floor(Math.random() * (nStates + 1)))];
  let rule = Uint8Array.from(priorRules[0]);
  
  let doubleBufferFlip;
  
  function init(command) {
    doubleBufferFlip = false;
    
    // Start from random.
    for (let i = 0, _len = gridA.length; i < _len; ++i) {
      gridA[i] = Math.floor(Math.random() * nStates);
    }
    
    switch (command) {
      case 'UNDO':
        if (priorRules.length > 1) {
          priorRules.pop();
          rule = Uint8Array.from(priorRules[priorRules.length - 1]);
        }
        break;
      case 'MUTATE':
        // Change a single value in the rule.
        rule[Math.floor(Math.random() * rule.length)] = Math.floor(Math.random() * (nStates + 1));
        priorRules.push(Array.from(rule));
        break;
      case 'REPLACE':
        // Replace the rule with an entirely new one.
        priorRules.push(Array.from({length: nPotentialWeights}, _ => Math.floor(Math.random() * (nStates + 1))));
        rule = Uint8Array.from(priorRules[priorRules.length - 1]);
        break;
    }
    
    console.log(`${command}! Weights: [${weights}]  Rule: [${rule}]`);
  }
  
  init('START');
  
  (function loop () {
    const [grid, nextGrid] = doubleBufferFlip ? [gridB, gridA] : [gridA, gridB];
    
    for (let y = 0; y < size; ++y) {
      for (let x = 0; x < size; ++x) {
        const i = x + y * size;
        let count = 0;
        
        for (let dy = -1; dy <= 1; ++dy) {
          let ny = y + dy;
          if (ny < 0) ny += size;
          else if (ny >= size) ny -= size;
          
          for (let dx = -1; dx <= 1; ++dx) {
            let nx = x + dx;
            if (nx < 0) nx += size;
            else if (nx >= size) nx -= size;
            
            count += weights[grid[nx + ny * size]];
          }
        }

        const nextState = rule[Math.max(minWeight, Math.min(count, maxWeight)) - minWeight];
        nextGrid[i] = nextState === nStates ? grid[i] : nextState;  // If there are 4 states, a value of "4" indicates the cell should remain the same.
      }
    }
    
    for (let y = 0; y < size; ++y) {
      for (let x = 0; x < size; ++x) {
        const i = x + y * size;
        const state = nextGrid[i];
        ctx.fillStyle = colors[state];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
    
    doubleBufferFlip = !doubleBufferFlip;
    requestAnimationFrame(loop);
  })();
  
  let keysDown = {};
  window.addEventListener('keyup', function (event) {
    delete keysDown[event.key];
    
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }
  }, true);
  
  window.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || keysDown[event.key]) {
      return; // Do nothing if the event was already processed
    }

    switch (event.key) {
      case 'Down': // IE/Edge specific value
      case 'ArrowDown':
        // Restart the current iteration.
        init('RESET');
        break;
      case 'Up': // IE/Edge specific value
      case 'ArrowUp':
        init('REPLACE');
        break;
      case 'Left': // IE/Edge specific value
      case 'ArrowLeft':
        init('UNDO');
        break;
      case 'Right': // IE/Edge specific value
      case 'ArrowRight':
        init('MUTATE');
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }

    keysDown[event.key] = true;
    
    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  }, true);
})();
 