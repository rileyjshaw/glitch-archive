'use strict';

function makeMarquee(
	msg,
	parent,
	{
		font = 'italic 16px monospace',
		speed = 10,
		colorA = '#fff',
		colorB = '#000',
		rowOffset = 0,
		rotate = 0,
		striped = false,
	} = {},
) {
	const angle = (rotate * Math.PI) / 180; // Read the client.

	const dpr = window.devicePixelRatio || 1;
	const _w = parent.clientWidth;
	const _h = parent.clientHeight;

	const _sin = Math.abs(Math.sin(angle));

	const _cos = Math.abs(Math.cos(angle));

	const width = _h * _sin + _w * _cos;
	const height = _w * _sin + _h * _cos; // Create elements.

	const _canvasA = document.createElement('canvas');

	const _canvasB = document.createElement('canvas');

	const canvas = document.createElement('canvas');
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	canvas.style.cssText = `height: ${height}px; width: ${width}px; transform: rotate(${rotate}deg);`;
	const ctx = canvas.getContext('2d');
	ctx.font = font;
	const msgWidth = Math.ceil(ctx.measureText(msg).width);
	const msgRawHeight = Math.ceil(ctx.measureText('M').width); // HACK!

	const msgYPadding = msgRawHeight;
	const msgHeight = msgRawHeight + msgYPadding;
	const extraWidth = width + msgWidth;
	const maxOffset = msgWidth * dpr;
	_canvasA.width = _canvasB.width = extraWidth * dpr;
	_canvasA.height = _canvasB.height = msgHeight * dpr;
	const msgRows = Math.ceil(height / msgHeight);
	const msgCols = Math.ceil(extraWidth / msgWidth); // Set up our background canvasses. This is the only time text is actually
	// drawn; subsequent operations copy the entire canvas image from here.

	const _ctxA = _canvasA.getContext('2d');

	const _ctxB = _canvasB.getContext('2d');

	_ctxA.font = _ctxB.font = font;

	_ctxA.scale(dpr, dpr);

	_ctxB.scale(dpr, dpr);

	_ctxA.fillStyle = colorA;
	_ctxB.fillStyle = striped ? colorB : colorA;

	_ctxA.fillRect(0, 0, extraWidth, msgHeight);

	_ctxB.fillRect(0, 0, extraWidth, msgHeight);

	_ctxA.fillStyle = colorB;
	_ctxB.fillStyle = striped ? colorA : colorB;

	for (let x = 0; x < msgCols; ++x) {
		_ctxA.fillText(msg, x * msgWidth, msgHeight - msgYPadding / 2);

		_ctxB.fillText(msg, x * msgWidth, msgHeight - msgYPadding / 2);
	} // Increment frame for the draw loop.

	let frame = 0;

	(function draw() {
		ctx.clearRect(0, 0, width * dpr, height * dpr);

		for (let row = 0; row < msgRows; ++row) {
			const odd = row % 2;
			const xSkew = (odd * 2 - 1) * ((frame + row * rowOffset) % maxOffset);
			const xOffset = odd * -maxOffset;
			const y = row * msgHeight * dpr;
			ctx.drawImage(odd ? _canvasA : _canvasB, xSkew + xOffset, y);
		}

		frame = (frame + speed) % maxOffset;
		window.requestAnimationFrame(draw);
	})();

	parent.appendChild(canvas);
}

makeMarquee('PAID   ', document.body, {
	font: "72px 'Roboto Slab', serif",
	colorA: 'transparent',
	colorB: '#9fb',
	rowOffset: 120,
	rotate: -8,
	speed: 0.5,
});
