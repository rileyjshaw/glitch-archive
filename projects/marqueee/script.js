'use strict';

function makeMarquee(msg, parent) {
	var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
		_ref$font = _ref.font,
		font = _ref$font === void 0 ? 'italic 16px monospace' : _ref$font,
		_ref$speed = _ref.speed,
		speed = _ref$speed === void 0 ? 10 : _ref$speed,
		_ref$colorA = _ref.colorA,
		colorA = _ref$colorA === void 0 ? '#fff' : _ref$colorA,
		_ref$colorB = _ref.colorB,
		colorB = _ref$colorB === void 0 ? '#000' : _ref$colorB,
		_ref$rowOffset = _ref.rowOffset,
		rowOffset = _ref$rowOffset === void 0 ? 0 : _ref$rowOffset;

	// Read the client.
	var dpr = window.devicePixelRatio || 1;
	var width = parent.clientWidth;
	var height = parent.clientHeight; // Create elements.

	var _canvasA = document.createElement('canvas');

	var _canvasB = document.createElement('canvas');

	var canvas = document.createElement('canvas');
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	canvas.style.cssText = 'height: 100%; width: 100%;';
	var ctx = canvas.getContext('2d');
	ctx.font = font;
	var msgWidth = Math.ceil(ctx.measureText(msg).width);
	var msgRawHeight = Math.ceil(ctx.measureText('M').width); // HACK!

	var msgYPadding = msgRawHeight;
	var msgHeight = msgRawHeight + msgYPadding;
	var extraWidth = width + msgWidth;
	var maxOffset = msgWidth * dpr;
	_canvasA.width = _canvasB.width = extraWidth * dpr;
	_canvasA.height = _canvasB.height = msgHeight * dpr;
	var msgRows = Math.ceil(height / msgHeight);
	var msgCols = Math.ceil(extraWidth / msgWidth); // Set up our background canvasses. This is the only time text is actually
	// drawn; subsequent operations copy the entire canvas image from here.

	var _ctxA = _canvasA.getContext('2d');

	var _ctxB = _canvasB.getContext('2d');

	_ctxA.font = _ctxB.font = font;

	_ctxA.scale(dpr, dpr);

	_ctxB.scale(dpr, dpr);

	_ctxA.fillStyle = colorA;
	_ctxB.fillStyle = colorB;

	_ctxA.fillRect(0, 0, extraWidth, msgHeight);

	_ctxB.fillRect(0, 0, extraWidth, msgHeight);

	_ctxA.fillStyle = colorB;
	_ctxB.fillStyle = colorA;

	for (var x = 0; x < msgCols; ++x) {
		_ctxA.fillText(msg, x * msgWidth, msgHeight - msgYPadding / 2);

		_ctxB.fillText(msg, x * msgWidth, msgHeight - msgYPadding / 2);
	} // Increment frame for the draw loop.

	var frame = 0;

	(function draw() {
		ctx.clearRect(0, 0, width * dpr, height * dpr);

		for (var row = 0; row < msgRows; ++row) {
			var odd = row % 2;
			var xSkew = (odd * 2 - 1) * ((frame + row * rowOffset) % maxOffset);
			var xOffset = odd * -maxOffset;
			var y = row * msgHeight * dpr;
			ctx.drawImage(odd ? _canvasA : _canvasB, xSkew + xOffset, y);
		}

		frame = (frame + speed) % maxOffset;
		window.requestAnimationFrame(draw);
	})();

	parent.appendChild(canvas);
}

makeMarquee('x lxhw x lph p ESU ', document.body, { colorA: '#0a0', rowOffset: 42 });
