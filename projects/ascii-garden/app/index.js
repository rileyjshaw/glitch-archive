import { makeNoise2D } from 'open-simplex-noise';

const noise2D = makeNoise2D(7);

const horizontal = Symbol('—');
const ascending = Symbol('/');
const vertical = Symbol('|');
const descending = Symbol('\\');
const directions = Object.freeze([horizontal, ascending, vertical, descending]); // THIS ORDER IS IMPORTANT!
const characters = Object.freeze({
	[vertical]: '|',
	[horizontal]: '—',
	[ascending]: '/',
	[descending]: '\\',
});

const WIDTH = 60;
const HEIGHT = 45;

const gardenState = Object.seal(
	Array.from({ length: HEIGHT }, () =>
		Array.from({ length: WIDTH }, () => {
			return directions[Math.floor(Math.random() * directions.length)];
		}),
	),
);
const userState = Object.seal({
	drawing: false,
	sweeping: false,
	brushWeight: 3,
	entryPoint: undefined,
	lastActiveSquare: undefined,
});

const garden = document.createElement('div');
garden.classList.add('garden');

const noiseMax = Math.sqrt(3 / 4); // Use this to normalize values to [0, 1].
// Build a 2D noise grid by sampling noise2D at scaled coordinates (for bigger rocks).
// I'm doing this so that we can scale the X and Y coordinates, and make bigger rocks.
const noiseGrid = Array.from({ length: HEIGHT }, (_0, y) =>
	Array.from({ length: WIDTH }, (_1, x) => {
		return (noise2D(x / 20, y / 20) / noiseMax + 1) / 2;
	}),
);

const rows = Array.from({ length: HEIGHT }, (_0, y) =>
	Array.from({ length: WIDTH }, (_1, x) => {
		const square = document.createElement('div');
		square.classList.add('square');
		if (noiseGrid[y][x] > 0.15) {
			square.textContent = characters[gardenState[y][x]];
			square.classList.add('sand');
		} else square.classList.add('rock');
		return square;
	}),
);

for (const row of rows) {
	const container = document.createElement('div');
	container.classList.add('row');

	for (const square of row) {
		container.appendChild(square);
	}

	garden.appendChild(container);
}
document.body.appendChild(garden);

function onDown(e) {
	e.preventDefault();
	const { clientX, clientY } = e.touches ? e.touches[0] : e;

	userState.drawing = true;
	userState.entryPoint = { x: clientX, y: clientY };
	userState.lastActiveSquare = document.elementFromPoint(clientX, clientY);

	if (e.touches && e.touches.length > 1) userState.sweeping = !userState.sweeping;
	else if (userState.sweeping) {
		const square = document.elementFromPoint(clientX, clientY);
		if (square && square.classList.contains('sand')) square.textContent = '·';
	}
}

function onMove(e) {
	e.preventDefault();

	if (!userState.drawing) return;

	const { clientX, clientY } = e.touches ? e.touches[0] : e;
	const activeSquare = document.elementFromPoint(clientX, clientY);
	const { lastActiveSquare } = userState;
	const activeIsSquare = activeSquare && activeSquare.classList.contains('square');
	const lastActiveIsSquare = lastActiveSquare && lastActiveSquare.classList.contains('square');

	// Early returns.
	if (activeIsSquare && !lastActiveIsSquare) {
		userState.entryPoint = { x: clientX, y: clientY };
		userState.lastActiveSquare = activeSquare;
		return;
	}
	if (!activeIsSquare && !lastActiveIsSquare) return;
	if (activeSquare === lastActiveSquare) return;

	// // Debug.
	// if (document.querySelector('.activeSquare')) document.querySelector('.activeSquare').classList.remove('activeSquare');
	// if (document.querySelector('.lastActiveSquare')) document.querySelector('.lastActiveSquare').classList.remove('lastActiveSquare');
	// if (activeIsSquare) activeSquare.classList.add('activeSquare');
	// if (lastActiveIsSquare) lastActiveSquare.classList.add('lastActiveSquare');

	const {
		entryPoint: { x: entryX, y: entryY },
	} = userState;
	const diffX = clientX - entryX;
	const diffY = entryY - clientY; // Inverted Y axis.
	const dist = Math.hypot(diffX, diffY);

	// HACK!
	const i = rows.flat().indexOf(lastActiveSquare);
	const x = i % WIDTH;
	const y = Math.floor(i / WIDTH);

	// if (dist > 5) {  // Is this check really necessary?
	const angle = (Math.atan2(diffY, diffX) / Math.PI + 1) * 180;
	for (let i = 0, a = -22.5; (a += 45); ++i) {
		if (angle < a) {
			const direction = directions[i % directions.length];
			const character = userState.sweeping ? '·' : characters[direction];
			if (lastActiveSquare.classList.contains('sand')) lastActiveSquare.textContent = character;

			switch (direction) {
				case horizontal:
					if (userState.brushWeight > 2 && rows[y - 2] && rows[y - 2][x].classList.contains('sand'))
						rows[y - 2][x].textContent = character;
					if (userState.brushWeight > 1 && rows[y - 1] && rows[y - 1][x].classList.contains('sand'))
						rows[y - 1][x].textContent = character;
					if (userState.brushWeight > 1 && rows[y + 1] && rows[y + 1][x].classList.contains('sand'))
						rows[y + 1][x].textContent = character;
					if (userState.brushWeight > 2 && rows[y + 2] && rows[y + 2][x].classList.contains('sand'))
						rows[y + 2][x].textContent = character;
					break;
				case vertical:
					if (userState.brushWeight > 2 && rows[y][x - 2] && rows[y][x - 2].classList.contains('sand'))
						rows[y][x - 2].textContent = character;
					if (userState.brushWeight > 1 && rows[y][x - 1] && rows[y][x - 1].classList.contains('sand'))
						rows[y][x - 1].textContent = character;
					if (userState.brushWeight > 1 && rows[y][x + 1] && rows[y][x + 1].classList.contains('sand'))
						rows[y][x + 1].textContent = character;
					if (userState.brushWeight > 2 && rows[y][x + 2] && rows[y][x + 2].classList.contains('sand'))
						rows[y][x + 2].textContent = character;
					break;
				case ascending:
					if (
						userState.brushWeight > 2 &&
						rows[y - 2] &&
						rows[y - 2][x - 2] &&
						rows[y - 2][x - 2].classList.contains('sand')
					)
						rows[y - 2][x - 2].textContent = character;
					if (
						userState.brushWeight > 1 &&
						rows[y - 1] &&
						rows[y - 1][x - 1] &&
						rows[y - 1][x - 1].classList.contains('sand')
					)
						rows[y - 1][x - 1].textContent = character;
					if (
						userState.brushWeight > 1 &&
						rows[y + 1] &&
						rows[y + 1][x + 1] &&
						rows[y + 1][x + 1].classList.contains('sand')
					)
						rows[y + 1][x + 1].textContent = character;
					if (
						userState.brushWeight > 2 &&
						rows[y + 2] &&
						rows[y + 2][x + 2] &&
						rows[y + 2][x + 2].classList.contains('sand')
					)
						rows[y + 2][x + 2].textContent = character;
					break;
				case descending:
					if (
						userState.brushWeight > 2 &&
						rows[y - 2] &&
						rows[y - 2][x + 2] &&
						rows[y - 2][x + 2].classList.contains('sand')
					)
						rows[y - 2][x + 2].textContent = character;
					if (
						userState.brushWeight > 1 &&
						rows[y - 1] &&
						rows[y - 1][x + 1] &&
						rows[y - 1][x + 1].classList.contains('sand')
					)
						rows[y - 1][x + 1].textContent = character;
					if (
						userState.brushWeight > 1 &&
						rows[y + 1] &&
						rows[y + 1][x - 1] &&
						rows[y + 1][x - 1].classList.contains('sand')
					)
						rows[y + 1][x - 1].textContent = character;
					if (
						userState.brushWeight > 2 &&
						rows[y + 2] &&
						rows[y + 2][x - 2] &&
						rows[y + 2][x - 2].classList.contains('sand')
					)
						rows[y + 2][x - 2].textContent = character;
					break;
			}

			break;
		}
		// }
	}

	userState.entryPoint = { x: clientX, y: clientY };
	userState.lastActiveSquare = activeSquare;

	return false;
}

function onUp(e) {
	e.preventDefault();

	userState.drawing = false;
}

document.addEventListener('mousedown', onDown, false);
document.body.addEventListener('touchstart', onDown, false);
document.addEventListener('mousemove', onMove, false);
document.body.addEventListener('touchmove', onMove);
document.addEventListener('mouseup', onUp, false);
document.body.addEventListener('touchend', onUp);

document.addEventListener(
	'keyup',
	({ key }) => {
		switch (key.toLowerCase()) {
			case 's':
				userState.sweeping = !userState.sweeping;
				break;
			case '1':
				userState.brushWeight = 1;
				break;
			case '2':
				userState.brushWeight = 2;
				break;
			case '3':
				userState.brushWeight = 3;
				break;
		}
	},
	false,
);
