/**
 * Combines two images by alternating them row-by-row.
 *
 * Each row is placed to line up visually with the row above it, which causes a
 * subtle shearing effect.
 */
import aUrl from './a.jpg';
import bUrl from './b.jpg';

const ROW_HEIGHT = 1;
// The maximum +ve or -ve pixel offset for each row. Drastically effects speed.
const MAX_OFFSET = 100;

Promise.all(
	[aUrl, bUrl].map(
		src =>
			new Promise((resolve, reject) => {
				// Initialization: place each image on its own canvas.
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				const img = new Image();

				img.addEventListener('load', () => {
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;
					ctx.drawImage(img, 0, 0);
					resolve({ canvas, ctx, img });
				});
				img.addEventListener('error', e => {
					console.error(e);
					reject(new Error(`Failed to load image: ${src}`));
				});

				img.src = src;
			}),
	),
).then(([photoA, photoB]) => {
	const { width, height } = photoA.canvas;

	if (photoB.canvas.width !== width || photoB.canvas.height !== height) {
		alert('Bad! Images must be the same size.');
	}

	// To prevent jagged edges, the photo is cropped to a thinner width.
	const leftBound = MAX_OFFSET;
	const rightBound = width - MAX_OFFSET;

	for (let y = ROW_HEIGHT; y < height; y += ROW_HEIGHT) {
		const currentPhoto = y % 2 ? photoB : photoA;
		const rowA = photoA.ctx.getImageData(0, y - 1, width, 1).data;
		const rowB = currentPhoto.ctx.getImageData(0, y, width, 1).data;
		const distances = new Array(MAX_OFFSET * 2 + 1);
		distances.fill(0);

		for (let x = leftBound; x < rightBound; ++x) {
			for (let channel = 0; channel < 4; ++channel) {
				const valA = rowA[x * 4 + channel];

				for (let offset = -MAX_OFFSET; offset <= MAX_OFFSET; ++offset) {
					const valB = rowB[x * 4 + channel];
					distances[offset + MAX_OFFSET] += Math.abs(valA - valB);
				}
			}
		}

		const bestOffset = distances.indexOf(Math.min.apply(null, distances)) - MAX_OFFSET;
		photoA.ctx.clearRect(0, y, width, 1);
		photoA.ctx.drawImage(currentPhoto.img, 0, y, width, 1, bestOffset, y, width, 1);
	}

	photoA.ctx.clearRect(0, 0, MAX_OFFSET, height);
	photoA.ctx.clearRect(width - MAX_OFFSET, 0, MAX_OFFSET, height);
	document.body.appendChild(photoA.canvas);
});
