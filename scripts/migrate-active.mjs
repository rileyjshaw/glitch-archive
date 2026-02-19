#!/usr/bin/env node
/**
 * Migrate projects from active/ to projects/.
 * CSS and JS are copied into the project folder and referenced with ./ so Vite can bundle them.
 * Use public/ only for assets Vite can't handle (e.g. fonts, images that must be at a fixed URL).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const activeDir = path.join(root, 'active');
const projectsDir = path.join(root, 'projects');

// Projects that require a real backend (Twitter API, scraping, etc.) — do not migrate
const SKIP_BACKEND = new Set([
	'husky-historical-arithmetic', // Twitter API + Socket.IO stream
	'iodized-telling-earthworm', // scrape-it backend, /posts /pages /title
	'classy-week', // same scraper app
]);

// Projects with no pre-built output and no simple static entry (e.g. CRA-only, no build folder)
const SKIP_NO_BUILD = new Set([
	'observant-ankle', // CRA, no build/ present
]);

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest, filter = () => true) {
	ensureDir(dest);
	for (const name of fs.readdirSync(src)) {
		const s = path.join(src, name);
		const d = path.join(dest, name);
		if (fs.statSync(s).isDirectory()) {
			if (
				name === 'node_modules' ||
				name === '.cache' ||
				name === 'build' ||
				name === '.config' ||
				name.startsWith('.')
			)
				continue;
			copyDir(s, d, filter);
		} else if (filter(s, name)) {
			fs.copyFileSync(s, d);
		}
	}
}

function rewriteAssetPaths(html) {
	return html
		.replace(/href="\/style\.css"/gi, 'href="./style.css"')
		.replace(/href="\/client\.js"/gi, 'href="./client.js"')
		.replace(/src="\/script\.js"/gi, 'src="./script.js"')
		.replace(/src="\/bundle\.js"/gi, 'src="./bundle.js"')
		.replace(/src="\/client\.js"/gi, 'src="./client.js"')
		.replace(/href="style\.css"/g, 'href="./style.css"')
		.replace(/src="script\.js"/g, 'src="./script.js"')
		.replace(/\b(src|href)="\.\/([^"]+)"/g, (_, attr, file) => `${attr}="./${file}"`);
}

function migrateSimple(name) {
	const src = path.join(activeDir, name);
	const indexPath = path.join(src, 'index.html');
	if (!fs.existsSync(indexPath)) return false;
	const publicSrc = path.join(src, 'public');
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);

	let html = fs.readFileSync(indexPath, 'utf8');
	// Copy assets from active's public/ into project folder (for Vite to bundle)
	if (fs.existsSync(publicSrc)) {
		for (const f of fs.readdirSync(publicSrc)) {
			const s = path.join(publicSrc, f);
			if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(destProject, f));
		}
	}
	// Copy root-level script/style if present
	for (const f of ['script.js', 'style.css', 'script.es6.js']) {
		const s = path.join(src, f);
		if (fs.existsSync(s) && fs.statSync(s).isFile()) {
			fs.copyFileSync(s, path.join(destProject, f));
			if (f === 'script.es6.js' && !fs.existsSync(path.join(destProject, 'script.js'))) {
				fs.copyFileSync(s, path.join(destProject, 'script.js'));
			}
		}
	}
	// Shaders (stay in project so Vite can serve them)
	for (const f of ['shader.vert', 'shader.frag']) {
		const s = path.join(src, f);
		if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destProject, f));
	}
	html = rewriteAssetPaths(html);
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migrateViews(name, viewsIndex = 'views/index.html') {
	const src = path.join(activeDir, name);
	const indexPath = path.join(src, viewsIndex);
	if (!fs.existsSync(indexPath)) return false;
	const publicSrc = path.join(src, 'public');
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	let html = fs.readFileSync(indexPath, 'utf8');
	if (fs.existsSync(publicSrc)) {
		for (const f of fs.readdirSync(publicSrc)) {
			const s = path.join(publicSrc, f);
			if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(destProject, f));
		}
	}
	html = rewriteAssetPaths(html);
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migrateApp(name, appIndex = 'app/index.html') {
	const src = path.join(activeDir, name);
	const indexPath = path.join(src, appIndex);
	if (!fs.existsSync(indexPath)) return false;
	const publicSrc = path.join(src, 'public');
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	let html = fs.readFileSync(indexPath, 'utf8');
	if (fs.existsSync(publicSrc)) {
		for (const f of fs.readdirSync(publicSrc)) {
			const s = path.join(publicSrc, f);
			if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(destProject, f));
		}
	}
	html = rewriteAssetPaths(html);
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migrateBuild(name) {
	const src = path.join(activeDir, name);
	const buildIndex = path.join(src, 'build', 'index.html');
	if (!fs.existsSync(buildIndex)) return false;
	const buildDir = path.join(src, 'build');
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	let html = fs.readFileSync(buildIndex, 'utf8');
	// CRA build: copy build/static into project and use ./static/... so assets are served from project
	const staticDir = path.join(buildDir, 'static');
	if (fs.existsSync(staticDir)) {
		copyDir(staticDir, path.join(destProject, 'static'));
		html = html.replace(/(src|href)="(\/static\/[^"]+)"/g, (_, attr, p) => `${attr}="./${p.slice(1)}"`);
	}
	for (const f of ['favicon.ico', 'manifest.json', 'robots.txt']) {
		const s = path.join(buildDir, f);
		if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destProject, f));
	}
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migrateGridExperiment() {
	const name = 'grid-experiment';
	const src = path.join(activeDir, name);
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	for (const f of ['script.js', 'style.css', 'ka_logo.svg', 'ltr.svg', 'rc_logo.svg', 'rtl.svg', 'vertical.svg']) {
		const s = path.join(src, f);
		if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destProject, f));
	}
	const listn = path.join(src, 'listn_logo.png');
	if (fs.existsSync(listn)) fs.copyFileSync(listn, path.join(destProject, 'listn_logo.png'));
	let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
	html = rewriteAssetPaths(html);
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migratePo33() {
	const name = 'po-33';
	const src = path.join(activeDir, name);
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	const publicSrc = path.join(src, 'public');
	if (fs.existsSync(publicSrc)) {
		for (const f of fs.readdirSync(publicSrc)) {
			const s = path.join(publicSrc, f);
			if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(destProject, f));
		}
	}
	for (const f of ['script.js', 'style.css']) {
		const s = path.join(src, f);
		if (fs.existsSync(s)) fs.copyFileSync(s, path.join(destProject, f));
	}
	let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
	html = rewriteAssetPaths(html);
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

function migrateErasers() {
	const name = 'erasers';
	const src = path.join(activeDir, name);
	const destProject = path.join(projectsDir, name);
	ensureDir(destProject);
	const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
	// No local assets; uses external CDN. Just copy index.
	fs.writeFileSync(path.join(destProject, 'index.html'), html);
	return true;
}

const simple = [
	'ca-finder',
	'ca-finder-fs-gradual',
	'ca-finder-fs-gradual-gl',
	'ca-finder-fs-streak',
	'ca-finder-fs-tweaks',
	'fs-ca-finder',
	'marqueee',
	'marqueee-boxes',
	'marqueee-rotated',
	'scroll-snap-grid',
	'rings',
];
const views = ['brassy-moonflower', 'locrian-vein'];
const app = ['ascii-garden', 'photo-experiment', 'txt-flowers', 'typing-lazy', 'vancouver-hack-space-ca-display'];
const build = ['mountainous-savory-dingo', 'sensor-dashboard'];

const dirs = fs.readdirSync(activeDir).filter(d => {
	const p = path.join(activeDir, d);
	return fs.statSync(p).isDirectory() && !d.startsWith('.');
});

const skipped = [];
const migrated = [];

for (const name of dirs) {
	if (SKIP_BACKEND.has(name)) {
		skipped.push({ name, reason: 'backend (API/scraper)' });
		continue;
	}
	if (SKIP_NO_BUILD.has(name)) {
		skipped.push({ name, reason: 'no build output' });
		continue;
	}
	let done = false;
	if (name === 'grid-experiment') {
		migrateGridExperiment();
		done = true;
	} else if (name === 'po-33') {
		migratePo33();
		done = true;
	} else if (name === 'erasers') {
		migrateErasers();
		done = true;
	} else if (build.includes(name)) {
		done = migrateBuild(name);
	} else if (app.includes(name)) {
		done = migrateApp(name);
	} else if (views.includes(name)) {
		done = migrateViews(name);
	} else if (simple.includes(name)) {
		done = migrateSimple(name);
	} else {
		done = migrateSimple(name) || migrateViews(name) || migrateApp(name);
	}
	if (done) migrated.push(name);
	else if (!SKIP_BACKEND.has(name)) skipped.push({ name, reason: 'no index found' });
}

console.log('Migrated:', migrated.length, migrated.join(', '));
console.log('Skipped:', skipped.length);
skipped.forEach(s => console.log('  -', s.name, s.reason));
