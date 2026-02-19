const X_MAX = 9;
const Y_MAX = 9;

const ul = document.createElement('ul');
ul.className = 'grid';
ul.style.gridTemplateColumns = `repeat(${X_MAX}, 100vw)`;
ul.style.gridTemplateRows = `repeat(${Y_MAX}, 100vh)`;

for (let x = 1; x <= X_MAX; ++x) {
	for (let y = 1; y <= Y_MAX; ++y) {
		const li = document.createElement('li');
		const container = document.createElement('div');
		const grid = document.createElement('ul');
		const button = document.createElement('button');
		button.addEventListener('click', e => container.classList.toggle('clicked'));
		container.className = 'container';
		grid.className = 'grid-icon';
		grid.style.gridTemplateColumns = `repeat(${x}, 1fr)`;
		grid.style.gridTemplateRows = `repeat(${y}, 1fr)`;
		for (let i = 0; i < x * y; ++i) {
			grid.append(document.createElement('li'));
		}
		button.textContent = `${x} × ${y}`;
		container.append(grid);
		container.append(button);
		li.append(container);
		ul.append(li);
	}
}
document.body.append(ul);
const keys = {};
document.addEventListener('keydown', ({code}) => {
	if (keys[code] || !code.startsWith('Arrow')) return;
	keys[code] = true;
	const [left, top] = {
		Left: [-window.innerWidth, 0],
		Right: [window.innerWidth, 0],
		Up:  [0, -window.innerHeight],
		Down: [0, window.innerHeight],
	}[code.slice(5)];
	ul.scrollBy({top, left, behavior: 'smooth'});
});
document.addEventListener('keyup', ({code}) => {
	delete keys[code];
});
ul.scrollTo(Math.floor(X_MAX / 2) * window.innerWidth, Math.floor(Y_MAX / 2) * window.innerHeight);
