import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
import generateVersionPlugin from './vite-plugin-generate-version.js';

const isDev = process.env.NODE_ENV !== 'production';

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					
					// ⚡ FILTRAR: Ignorar errores internos de Firestore que son transitorios
					const isFirestoreInternalError = 
						requestUrl.includes('firestore.googleapis.com') && 
						(response.status === 400 || response.status === 500 || response.status === 503);
					
					// ⚡ FILTRAR: Ignorar errores de Firebase Auth que son transitorios
					const isFirebaseAuthError = 
						requestUrl.includes('identitytoolkit.googleapis.com') && 
						(response.status === 500 || response.status === 503);
					
					// ⚡ FILTRAR: Ignorar errores de Google Analytics (ERR_INSUFFICIENT_RESOURCES es común)
					const isGoogleAnalyticsError = 
						requestUrl.includes('google-analytics.com') || 
						requestUrl.includes('googletagmanager.com') ||
						requestUrl.includes('analytics.google.com') ||
						requestUrl.includes('G-PZQQL7WH39') ||
						requestUrl.includes('gtag');
					
					// ⚡ FILTRAR: Ignorar errores 304 (Not Modified) - son normales, no son errores
					const isNotModified = response.status === 304;
					
					// ⚡ FILTRAR: Ignorar errores de recursos locales en desarrollo (hot reload)
					const isLocalResourceError = 
						import.meta.env.DEV && 
						(requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1')) &&
						(requestUrl.includes('.jsx') || requestUrl.includes('.js') || requestUrl.includes('.ts'));
					
					// ⚡ FILTRAR: Ignorar errores de recursos insuficientes (ERR_INSUFFICIENT_RESOURCES)
					// Estos son errores del navegador cuando hay demasiadas peticiones, no errores reales
					const isInsufficientResources = 
						errorFromRes.includes('ERR_INSUFFICIENT_RESOURCES') ||
						errorFromRes.includes('net::ERR_INSUFFICIENT_RESOURCES');
					
					if (!isFirestoreInternalError && !isFirebaseAuthError && !isGoogleAnalyticsError && !isNotModified && !isLocalResourceError && !isInsufficientResources) {
						console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
					} else {
						// Log silencioso para debugging (solo en desarrollo)
						if (import.meta.env.DEV) {
							console.debug(\`[IGNORED] Transient error (\${response.status}): \${requestUrl}\`);
						}
					}
			}

			return response;
		})
		.catch(error => {
			// ⚡ FILTRAR: Ignorar errores de recursos insuficientes y Google Analytics
			const isInsufficientResources = 
				error.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
				error.message?.includes('net::ERR_INSUFFICIENT_RESOURCES');
			
			const isGoogleAnalyticsError = 
				url.includes('google-analytics.com') || 
				url.includes('googletagmanager.com') ||
				url.includes('analytics.google.com') ||
				url.includes('G-PZQQL7WH39') ||
				url.includes('gtag');
			
			const isLocalResourceError = 
				import.meta.env.DEV && 
				(url.includes('localhost') || url.includes('127.0.0.1')) &&
				(url.includes('.jsx') || url.includes('.js') || url.includes('.ts'));
			
			if (!url.match(/\.html?$/i) && !isInsufficientResources && !isGoogleAnalyticsError && !isLocalResourceError) {
				console.error(error);
			}

			throw error;
		});
};
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		const tags = [
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsRuntimeErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsViteErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: {type: 'module'},
				children: configHorizonsConsoleErrroHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configWindowFetchMonkeyPatch,
				injectTo: 'head',
			},
		];

		if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
			tags.push(
				{
					tag: 'script',
					attrs: {
						src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
						'template-redirect-url': process.env.TEMPLATE_REDIRECT_URL,
					},
					injectTo: 'head',
				}
			);
		}

		return {
			html,
			tags,
		};
	},
};

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

// ✅ AÑADIDO 2025-12-11: Plugin para remover console.logs en producción
const removeConsolePlugin = {
	name: 'remove-console',
	transform(code, id) {
		if (isDev || id.includes('node_modules')) return;

		// Remover console.log, console.debug, console.info, console.warn
		// Mantener console.error para producción
		return {
			code: code
				.replace(/console\.(log|debug|info|warn)\s*\([^)]*\);?/g, '')
				.replace(/console\.(log|debug|info|warn)\s*\(`[^`]*`\);?/g, ''),
			map: null
		};
	}
};

export default defineConfig({
	customLogger: logger,
	plugins: [
		generateVersionPlugin(), // 🔄 Generar version.json en cada build
		...(isDev ? [inlineEditPlugin(), editModeDevPlugin(), iframeRouteRestorationPlugin()] : []),
		react(),
		addTransformIndexHtml,
		// removeConsolePlugin // ⚠️ TEMPORALMENTE DESHABILITADO - Causa error de parseo
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types'
			]
		}
	},
	publicDir: 'public'
});
