'use strict';

function makeMarquee(msg, parent, _ref) {
	var _ref$font = _ref.font,
		font = _ref$font === void 0 ? 'italic 16px monospace' : _ref$font,
		_ref$speed = _ref.speed,
		speed = _ref$speed === void 0 ? 10 : _ref$speed,
		_ref$colorA = _ref.colorA,
		colorA = _ref$colorA === void 0 ? '#fff' : _ref$colorA,
		_ref$colorB = _ref.colorB,
		colorB = _ref$colorB === void 0 ? '#000' : _ref$colorB,
		_ref$rowOffset = _ref.rowOffset,
		rowOffset = _ref$rowOffset === void 0 ? 0 : _ref$rowOffset,
		_ref$resolution = _ref.resolution,
		resolution = _ref$resolution === void 0 ? 0 : _ref$resolution;
	// Read the client.
	var dpr = resolution || window.devicePixelRatio || 1;
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

var ALPHABET_SIZE = 26;
var FIRST_LETTER = 65;
function rotate(character, shift) {
	var charCode = character.toUpperCase().charCodeAt(0);
	if (charCode < FIRST_LETTER || charCode >= FIRST_LETTER + ALPHABET_SIZE) {
		return false;
	}
	return String.fromCharCode(FIRST_LETTER + ((charCode + shift + ALPHABET_SIZE - FIRST_LETTER) % ALPHABET_SIZE));
}

function randomColor(floor, ceiling) {
	return (
		'rgb(' +
		Math.floor(floor + Math.random() * (ceiling + 1)) +
		',' +
		Math.floor(floor + Math.random() * (ceiling + 1)) +
		',' +
		Math.floor(floor + Math.random() * (ceiling + 1)) +
		')'
	);
}
var light = ['rgb(249, 205, 22)', 'rgb(127, 255, 212)', 'rgb(255, 149, 149)', 'rgb(161, 253, 255)'];
var dark = ['rgb(40, 49, 255)'];

Array.from(document.querySelectorAll('div')).forEach(function (div, i) {
	var phrase = "there's a snake in my boot "
		.split('')
		.map(function (char) {
			return rotate(char, i + 1) || char;
		})
		.join('');
	var colorA = i % 2 ? light : dark;
	var colorB = i % 2 ? dark : light;
	colorA = colorA[Math.floor(Math.random() * colorA.length)];
	colorB = colorB[Math.floor(Math.random() * colorB.length)];
	makeMarquee(phrase, div, {
		speed: 20,
		colorA: colorA,
		colorB: colorB,
	});
});
