import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { default: viteConfig } = await import(path.resolve(__dirname, '../vite.config.js'));
const base = (viteConfig.base ?? '/').replace(/\/*$/, '/');

const projectsDir = path.resolve('projects');

const names = fs.existsSync(projectsDir)
	? fs
			.readdirSync(projectsDir, { withFileTypes: true })
			.filter(d => d.isDirectory())
			.filter(d => fs.existsSync(path.join(projectsDir, d.name, 'index.html')))
			.map(d => d.name)
			.sort((a, b) => a.localeCompare(b))
	: [];

const links = names.map(name => `<li><a href="${base}projects/${name}/">${name}</a></li>`).join('\n\t\t\t');

const html = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Glitch archive</title>
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
		<style>
			:root {
				--cfg: #000;
				--cbg: lightblue;
				counter-reset: item;
			}

			*, ::before, ::after {
				box-sizing: border-box;
				min-width: 0;
			}

			body, li {
				background: var(--cbg);
			}

			body {
				max-width: 900px;
				margin: 0 auto;
				padding: 24px;
				font: 2em 'Instrument Serif', serif;
				color: var(--cfg);
				text-align: center;
			}

			.header {
				display: flex;
				justify-content: center;
				align-items: center;
				gap: 1em;
			}

			h1 {
				margin: 0 0 0 -2px;
				font-weight: normal;
				text-decoration: underline dashed;
			}

			.logo {
				height: 2cap;
			}

			p {
				margin-top: 0.25em;
				text-wrap: balance;
			}

			a {
				color: inherit;
			}

			li a {
				text-decoration: none;
			}

			ol, li {
				all: unset;
			}

			ol {
				display: inline-flex;
				flex-direction: column;
				padding: 1em 0 2em;
			}

			li {
				counter-increment: link;
				display: block;
				text-align: center;
				padding: 0.1em 1em;
				border: 0.1em solid var(--cfg);
				margin-block: -0.05em;
				border-radius: 0 9in 9in 0;
				padding-inline: 0.75em 1.5em;
				margin-inline: 0.75em 0em;
				position: relative;
				border-inline-color: transparent var(--cfg);
				
				&::after {
					content: counter(link);
					display: grid;
					place-content: center;
					height: 80%;
					aspect-ratio: 1;
					font-size: 0.8em;
					border: 0.06em dashed var(--cfg);
					border-radius: 9in;
					box-shadow: inset 0 0 0 .125em var(--cfg);
					position: absolute;
					top: 10%;
					right: 0;
					margin-inline: 0.125em;
					animation: spin 24s linear infinite;
				}
			}

			li:nth-child(2n) {
				border-radius: 9in 0 0 9in;
				padding-inline: 1.5em 0.75em;
				margin-inline: 0 0.75em;
				border-inline-color: var(--cfg) transparent;
				
				&::after {
					left: 0;
					animation-direction: reverse;
				}
			}

			@keyframes spin {
				from {
					transform: rotate(0deg);
				}
				to {
					transform: rotate(360deg);
				}
			}
		</style>
	</head>
	<body>
		<div class="header"><h1>Glitch archive</h1><img class="logo" src="/logo.svg" alt="Glitch logo" /></div>
		<p>Glitch.com was a project hosting website that ended service on July 23, 2025. This archive collects public projects I made on Glitch.com between 2015 and 2025.</p>
		<ol>
			${links || '<li class="hint">No projects yet. Add folders under /projects.</li>'}
		</ol>
		<p>To browse or download the source code for these projects, I’ve <a href="https://github.com/rileyjshaw/glitch-dot-com-archive">archived them on GitHub</a>.</p>
	</body>
</html>
`;

fs.writeFileSync(path.resolve('index.html'), html);
console.log(`Wrote index.html with ${names.length} project(s).`);
