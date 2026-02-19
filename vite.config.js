import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { globSync } from 'glob';
import path from 'node:path';

const projectHtml = globSync('projects/*/index.html');

const inputs = Object.fromEntries(
	projectHtml.map(p => {
		const name = path.basename(path.dirname(p)); // folder name
		return [name, path.resolve(p)];
	}),
);

export default defineConfig({
	base: '/glitch-archive/',
	plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],

	build: {
		rollupOptions: {
			input: {
				home: path.resolve('index.html'),
				...inputs,
			},
			output: {
				entryFileNames: 'assets/[name].[hash].js',
				chunkFileNames: 'assets/chunks/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash][extname]',
			},
		},
	},
});
