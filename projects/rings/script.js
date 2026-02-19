var DEBUG = false;
var N_RINGS = 9;  // TODO(riley): 2, 3: same problems with `angle`.
                  //              even: totally wrong.
var N_ANTS = 5;
var RING_RADIUS = 300;
var RING_WIDTH = 40;
var BORDER_WIDTH = 1; // TODO(riley)
var BLOCKER_RADIUS = RING_RADIUS / 3;
var UGLY_OVERLAP_ANGLE_OFFSET = 0.46;
var SIZE = RING_RADIUS * 4 + RING_WIDTH + BORDER_WIDTH + 4;  // 2px padding.
var PERIOD = 10000; // Milliseconds.
var BG = '#fffaf4';

var CENTER = SIZE / 2;
var PI = Math.PI;
var PI2 = 2 * PI;
var ANGLE_PER_SEGMENT = PI2 / N_RINGS;
var TILT = DEBUG ? 0 : ANGLE_PER_SEGMENT / 4;

var r1Sq = Math.pow(BLOCKER_RADIUS, 2);
var r2Sq = Math.pow(RING_RADIUS, 2);
var y = Math.sqrt(r1Sq * (1 - r1Sq / 4 / r2Sq))
var THE_SPOT = -Math.asin(y / BLOCKER_RADIUS) - TILT;

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
document.body.style.background = BG;
canvas.width = canvas.height = SIZE;
canvas.style.width = canvas.style.height = CENTER + 'px';
canvas.style.position = 'absolute';
canvas.style.top = canvas.style.left = '50%';
canvas.style.margin = '-' + SIZE / 4 + 'px';

var rings = Array.from({length: N_RINGS}, (_, i) => {
  var normalizedAngle = i / N_RINGS;
  var angle = normalizedAngle * PI2 - TILT;

  return {
    // TODO(riley): lol wat.
    angle: (angle + PI + PI / N_RINGS * (N_RINGS - 1 + (N_RINGS % 2) ? 1 : 0)) % PI2,
    hue: Math.floor(normalizedAngle * 360),
    x: Math.cos(angle) * RING_RADIUS + CENTER,
    y: Math.sin(angle) * RING_RADIUS + CENTER,
  };
});

function getColor (hue, t) {
  return 'hsl(' + (hue + t * 360) + ', 100%, 20%)';
}

function drawRing ({angle, hue, x, y}, a1, a2, t, debug) {
  // Inner ring.
  ctx.lineWidth = RING_WIDTH;
  if (debug) {
    var r = 230 + ~~(Math.random() * 16);
    var g = 230 + ~~(Math.random() * 16);
    var b = 230 + ~~(Math.random() * 16);
    ctx.strokeStyle = 'rgb(' + [r, g, b] + ')';
  } else {
    ctx.strokeStyle = BG;
  }
  ctx.beginPath();
  ctx.arc(x, y, RING_RADIUS, a1, a2);
  ctx.stroke();

  // Outer rings.
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeStyle = getColor(hue, t);
  ctx.beginPath();
  ctx.arc(x, y, RING_RADIUS - RING_WIDTH / 2, a1, a2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, RING_RADIUS + RING_WIDTH / 2, a1, a2);
  ctx.stroke();

  // Marching ants.
  ctx.lineWidth = 1;
  var antOffset = (t * N_ANTS) % 2;
  if (a2 < a1) alert('no');
  for (var i = 0; i < N_ANTS; ++i) {
    var aa1 = (PI / N_ANTS * (i * 2 + antOffset)) % PI2;
    var aa2 = aa1 + PI / N_ANTS;

    // Only draw ants within the segment.
    // TODO(riley): Could use some cleanup :(
    // If the end of our ant comes before the beginning of our ring segment,
    // we might want to skip drawing it. Before we do that, let's add 360deg to
    // both of our angles and see if *that* falls within the segment.
    if (aa2 < a1) {
      aa1 += PI2;
      aa2 += PI2;
    } else if (aa1 > a2) {
      aa1 -= PI2;
      aa2 -= PI2;
    }

    // TODO(riley): Still unreliable.
    aa1 = Math.max(aa1, a1);
    aa2 = Math.min(aa2, a2);

    if (aa1 > aa2) aa2 += PI2;
    if (aa2 - aa1 > PI / N_ANTS + 0.01) continue;

    ctx.beginPath();
    ctx.arc(x, y, RING_RADIUS, aa1, aa2);
    ctx.stroke();
  }
}

!function draw (t) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  t /= PERIOD;

  // Draw the rings with no consideration for overlapping.
  rings.forEach(ring => drawRing(ring, 0, PI2, t, false));

  // Redraw ring segments to correct for overlapping.
  rings.forEach((ring, i) => {
    var {angle} = ring;

    for (var s = 0, _len = N_RINGS - 1; s < _len; s += 2) {
      if (s - _len / 2 >= 0 && s - _len / 2 <= 1) ++s;
      var center = (angle + s * ANGLE_PER_SEGMENT) % PI2;
      var a1 = s || i < _len / 2
        ? (PI2 + center - UGLY_OVERLAP_ANGLE_OFFSET) % PI2
        : center;
      var a2 = a1 + (center - a1) + UGLY_OVERLAP_ANGLE_OFFSET;
      drawRing(ring, a1, a2, t, DEBUG);
    }
  });

  // Draw the blocker.
  ctx.beginPath();
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeStyle = getColor(0, t);
  ctx.fillStyle = BG;
  ctx.arc(CENTER, CENTER, BLOCKER_RADIUS, 0, PI2);
  ctx.fill();
  ctx.stroke();
  // Add strokes around the cleared area.
  rings.forEach(({hue}, i) => {
    const center = THE_SPOT + i * ANGLE_PER_SEGMENT;
    const a1 = center - ANGLE_PER_SEGMENT / 2;
    const a2 = a1 + ANGLE_PER_SEGMENT;
    ctx.beginPath();
    ctx.strokeStyle = getColor(hue, t);
    ctx.arc(CENTER, CENTER, BLOCKER_RADIUS, a1, a2);
    ctx.stroke();

    // Turn the blocker into a donut if it's big enough.
    if (BLOCKER_RADIUS > RING_WIDTH) {
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, BLOCKER_RADIUS - RING_WIDTH, a1, a2);
      ctx.stroke();
    }
  });

  if (!DEBUG) requestAnimationFrame(draw);
}(0);

document.body.appendChild(canvas);
