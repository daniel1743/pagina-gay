// vite.config.js
import path2 from "node:path";
import react from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/@vitejs/plugin-react/dist/index.js";
import { createLogger, defineConfig } from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/vite/dist/node/index.js";

// plugins/visual-editor/vite-plugin-react-inline-editor.js
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/@babel/parser/lib/index.js";
import traverseBabel from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/@babel/traverse/lib/index.js";
import generate from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/node_modules/@babel/types/lib/index.js";
import fs from "fs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/plugins/visual-editor/vite-plugin-react-inline-editor.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname2 = path.dirname(__filename);
var VITE_PROJECT_ROOT = path.resolve(__dirname2, "../..");
var EDITABLE_HTML_TAGS = ["a", "Button", "button", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "Label", "img"];
function parseEditId(editId) {
  const parts = editId.split(":");
  if (parts.length < 3) {
    return null;
  }
  const column = parseInt(parts.at(-1), 10);
  const line = parseInt(parts.at(-2), 10);
  const filePath = parts.slice(0, -2).join(":");
  if (!filePath || isNaN(line) || isNaN(column)) {
    return null;
  }
  return { filePath, line, column };
}
function checkTagNameEditable(openingElementNode, editableTagsList) {
  if (!openingElementNode || !openingElementNode.name)
    return false;
  const nameNode = openingElementNode.name;
  if (nameNode.type === "JSXIdentifier" && editableTagsList.includes(nameNode.name)) {
    return true;
  }
  if (nameNode.type === "JSXMemberExpression" && nameNode.property && nameNode.property.type === "JSXIdentifier" && editableTagsList.includes(nameNode.property.name)) {
    return true;
  }
  return false;
}
function validateImageSrc(openingNode) {
  if (!openingNode || !openingNode.name || openingNode.name.name !== "img") {
    return { isValid: true, reason: null };
  }
  const hasPropsSpread = openingNode.attributes.some(
    (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
  );
  if (hasPropsSpread) {
    return { isValid: false, reason: "props-spread" };
  }
  const srcAttr = openingNode.attributes.find(
    (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
  );
  if (!srcAttr) {
    return { isValid: false, reason: "missing-src" };
  }
  if (!t.isStringLiteral(srcAttr.value)) {
    return { isValid: false, reason: "dynamic-src" };
  }
  if (!srcAttr.value.value || srcAttr.value.value.trim() === "") {
    return { isValid: false, reason: "empty-src" };
  }
  return { isValid: true, reason: null };
}
function inlineEditPlugin() {
  return {
    name: "vite-inline-edit-plugin",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(jsx|tsx)$/.test(id) || !id.startsWith(VITE_PROJECT_ROOT) || id.includes("node_modules")) {
        return null;
      }
      const relativeFilePath = path.relative(VITE_PROJECT_ROOT, id);
      const webRelativeFilePath = relativeFilePath.split(path.sep).join("/");
      try {
        const babelAst = parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
          errorRecovery: true
        });
        let attributesAdded = 0;
        traverseBabel.default(babelAst, {
          enter(path3) {
            if (path3.isJSXOpeningElement()) {
              const openingNode = path3.node;
              const elementNode = path3.parentPath.node;
              if (!openingNode.loc) {
                return;
              }
              const alreadyHasId = openingNode.attributes.some(
                (attr) => t.isJSXAttribute(attr) && attr.name.name === "data-edit-id"
              );
              if (alreadyHasId) {
                return;
              }
              const isCurrentElementEditable = checkTagNameEditable(openingNode, EDITABLE_HTML_TAGS);
              if (!isCurrentElementEditable) {
                return;
              }
              const imageValidation = validateImageSrc(openingNode);
              if (!imageValidation.isValid) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              let shouldBeDisabledDueToChildren = false;
              if (t.isJSXElement(elementNode) && elementNode.children) {
                const hasPropsSpread = openingNode.attributes.some(
                  (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
                );
                const hasDynamicChild = elementNode.children.some(
                  (child) => t.isJSXExpressionContainer(child)
                );
                if (hasDynamicChild || hasPropsSpread) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (!shouldBeDisabledDueToChildren && t.isJSXElement(elementNode) && elementNode.children) {
                const hasEditableJsxChild = elementNode.children.some((child) => {
                  if (t.isJSXElement(child)) {
                    return checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS);
                  }
                  return false;
                });
                if (hasEditableJsxChild) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (shouldBeDisabledDueToChildren) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              if (t.isJSXElement(elementNode) && elementNode.children && elementNode.children.length > 0) {
                let hasNonEditableJsxChild = false;
                for (const child of elementNode.children) {
                  if (t.isJSXElement(child)) {
                    if (!checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS)) {
                      hasNonEditableJsxChild = true;
                      break;
                    }
                  }
                }
                if (hasNonEditableJsxChild) {
                  const disabledAttribute = t.jsxAttribute(
                    t.jsxIdentifier("data-edit-disabled"),
                    t.stringLiteral("true")
                  );
                  openingNode.attributes.push(disabledAttribute);
                  attributesAdded++;
                  return;
                }
              }
              let currentAncestorCandidatePath = path3.parentPath.parentPath;
              while (currentAncestorCandidatePath) {
                const ancestorJsxElementPath = currentAncestorCandidatePath.isJSXElement() ? currentAncestorCandidatePath : currentAncestorCandidatePath.findParent((p) => p.isJSXElement());
                if (!ancestorJsxElementPath) {
                  break;
                }
                if (checkTagNameEditable(ancestorJsxElementPath.node.openingElement, EDITABLE_HTML_TAGS)) {
                  return;
                }
                currentAncestorCandidatePath = ancestorJsxElementPath.parentPath;
              }
              const line = openingNode.loc.start.line;
              const column = openingNode.loc.start.column + 1;
              const editId = `${webRelativeFilePath}:${line}:${column}`;
              const idAttribute = t.jsxAttribute(
                t.jsxIdentifier("data-edit-id"),
                t.stringLiteral(editId)
              );
              openingNode.attributes.push(idAttribute);
              attributesAdded++;
            }
          }
        });
        if (attributesAdded > 0) {
          const generateFunction = generate.default || generate;
          const output = generateFunction(babelAst, {
            sourceMaps: true,
            sourceFileName: webRelativeFilePath
          }, code);
          return { code: output.code, map: output.map };
        }
        return null;
      } catch (error) {
        console.error(`[vite][visual-editor] Error transforming ${id}:`, error);
        return null;
      }
    },
    // Updates source code based on the changes received from the client
    configureServer(server) {
      server.middlewares.use("/api/apply-edit", async (req, res, next) => {
        if (req.method !== "POST")
          return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          var _a;
          let absoluteFilePath = "";
          try {
            const { editId, newFullText } = JSON.parse(body);
            if (!editId || typeof newFullText === "undefined") {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Missing editId or newFullText" }));
            }
            const parsedId = parseEditId(editId);
            if (!parsedId) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid editId format (filePath:line:column)" }));
            }
            const { filePath, line, column } = parsedId;
            absoluteFilePath = path.resolve(VITE_PROJECT_ROOT, filePath);
            if (filePath.includes("..") || !absoluteFilePath.startsWith(VITE_PROJECT_ROOT) || absoluteFilePath.includes("node_modules")) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid path" }));
            }
            const originalContent = fs.readFileSync(absoluteFilePath, "utf-8");
            const babelAst = parse(originalContent, {
              sourceType: "module",
              plugins: ["jsx", "typescript"],
              errorRecovery: true
            });
            let targetNodePath = null;
            const visitor = {
              JSXOpeningElement(path3) {
                const node = path3.node;
                if (node.loc && node.loc.start.line === line && node.loc.start.column + 1 === column) {
                  targetNodePath = path3;
                  path3.stop();
                }
              }
            };
            traverseBabel.default(babelAst, visitor);
            if (!targetNodePath) {
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Target node not found by line/column", editId }));
            }
            const generateFunction = generate.default || generate;
            const targetOpeningElement = targetNodePath.node;
            const parentElementNode = (_a = targetNodePath.parentPath) == null ? void 0 : _a.node;
            const isImageElement = targetOpeningElement.name && targetOpeningElement.name.name === "img";
            let beforeCode = "";
            let afterCode = "";
            let modified = false;
            if (isImageElement) {
              const beforeOutput = generateFunction(targetOpeningElement, {});
              beforeCode = beforeOutput.code;
              const srcAttr = targetOpeningElement.attributes.find(
                (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
              );
              if (srcAttr && t.isStringLiteral(srcAttr.value)) {
                srcAttr.value = t.stringLiteral(newFullText);
                modified = true;
                const afterOutput = generateFunction(targetOpeningElement, {});
                afterCode = afterOutput.code;
              }
            } else {
              if (parentElementNode && t.isJSXElement(parentElementNode)) {
                const beforeOutput = generateFunction(parentElementNode, {});
                beforeCode = beforeOutput.code;
                parentElementNode.children = [];
                if (newFullText && newFullText.trim() !== "") {
                  const newTextNode = t.jsxText(newFullText);
                  parentElementNode.children.push(newTextNode);
                }
                modified = true;
                const afterOutput = generateFunction(parentElementNode, {});
                afterCode = afterOutput.code;
              }
            }
            if (!modified) {
              res.writeHead(409, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Could not apply changes to AST." }));
            }
            const output = generateFunction(babelAst, {});
            const newContent = output.code;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: true,
              newFileContent: newContent,
              beforeCode,
              afterCode
            }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error during edit application." }));
          }
        });
      });
    }
  };
}

// plugins/visual-editor/vite-plugin-edit-mode.js
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// plugins/visual-editor/visual-editor-config.js
var POPUP_STYLES = `
#inline-editor-popup {
  width: 360px;
  position: fixed;
  z-index: 10000;
  background: #161718;
  color: white;
  border: 1px solid #4a5568;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  flex-direction: column;
  gap: 10px;
  display: none;
}

@media (max-width: 768px) {
  #inline-editor-popup {
    width: calc(100% - 20px);
  }
}

#inline-editor-popup.is-active {
  display: flex;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

#inline-editor-popup.is-disabled-view {
  padding: 10px 15px;
}

#inline-editor-popup textarea {
  height: 100px;
  padding: 4px 8px;
  background: transparent;
  color: white;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.42;
  resize: none;
  outline: none;
}

#inline-editor-popup .button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

#inline-editor-popup .popup-button {
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  height: 34px;
  outline: none;
}

#inline-editor-popup .save-button {
  background: #673de6;
  color: white;
}

#inline-editor-popup .cancel-button {
  background: transparent;
  border: 1px solid #3b3d4a;
  color: white;

  &:hover {
    background:#474958;
  }
}
`;
var EDIT_MODE_STYLES = `
  #root[data-edit-mode-enabled="true"] [data-edit-id] {
    cursor: pointer; 
    outline: 2px dashed #357DF9; 
    outline-offset: 2px;
    min-height: 1em;
  }
  #root[data-edit-mode-enabled="true"] img[data-edit-id] {
    outline-offset: -2px;
  }
  #root[data-edit-mode-enabled="true"] {
    cursor: pointer;
  }
  #root[data-edit-mode-enabled="true"] [data-edit-id]:hover {
    background-color: #357DF933;
    outline-color: #357DF9; 
  }

  @keyframes fadeInTooltip {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  #inline-editor-disabled-tooltip {
    display: none; 
    opacity: 0; 
    position: absolute;
    background-color: #1D1E20;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    z-index: 10001;
    font-size: 14px;
    border: 1px solid #3B3D4A;
    max-width: 184px;
    text-align: center;
  }

  #inline-editor-disabled-tooltip.tooltip-active {
    display: block;
    animation: fadeInTooltip 0.2s ease-out forwards;
  }
`;

// plugins/visual-editor/vite-plugin-edit-mode.js
var __vite_injected_original_import_meta_url2 = "file:///C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/plugins/visual-editor/vite-plugin-edit-mode.js";
var __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
var __dirname3 = resolve(__filename2, "..");
function inlineEditDevPlugin() {
  return {
    name: "vite:inline-edit-dev",
    apply: "serve",
    transformIndexHtml() {
      const scriptPath = resolve(__dirname3, "edit-mode-script.js");
      let scriptContent = readFileSync(scriptPath, "utf-8");
      scriptContent = scriptContent.replace(
        "import { POPUP_STYLES } from './visual-editor-config.js';",
        `const POPUP_STYLES = ${JSON.stringify(POPUP_STYLES)};`
      );
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: scriptContent,
          injectTo: "body"
        },
        {
          tag: "style",
          children: EDIT_MODE_STYLES,
          injectTo: "head"
        }
      ];
    }
  };
}

// plugins/vite-plugin-iframe-route-restoration.js
function iframeRouteRestorationPlugin() {
  return {
    name: "vite:iframe-route-restoration",
    apply: "serve",
    transformIndexHtml() {
      const script = `
        // Check to see if the page is in an iframe
        if (window.self !== window.top) {
          const STORAGE_KEY = 'horizons-iframe-saved-route';

          const getCurrentRoute = () => location.pathname + location.search + location.hash;

          const save = () => {
            try {
              const currentRoute = getCurrentRoute();
              sessionStorage.setItem(STORAGE_KEY, currentRoute);
              window.parent.postMessage({message: 'route-changed', route: currentRoute}, '*');
            } catch {}
          };

          const replaceHistoryState = (url) => {
            try {
              history.replaceState(null, '', url);
              window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
              return true;
            } catch {}
            return false;
          };

          const restore = () => {
            try {
              const saved = sessionStorage.getItem(STORAGE_KEY);
              if (!saved) return;

              if (!saved.startsWith('/')) {
                sessionStorage.removeItem(STORAGE_KEY);
                return;
              }

              const current = getCurrentRoute();
              if (current !== saved) {
                if (!replaceHistoryState(saved)) {
                  replaceHistoryState('/');
                }

                requestAnimationFrame(() => setTimeout(() => {
                  try {
                    const text = (document.body?.innerText || '').trim();

                    // If the restored route results in too little content, assume it is invalid and navigate home
                    if (text.length < 50) {
                      replaceHistoryState('/');
                    }
                  } catch {}
                }, 1000));
              }
            } catch {}
          };

          const originalPushState = history.pushState;
          history.pushState = function(...args) {
            originalPushState.apply(this, args);
            save();
          };

          const originalReplaceState = history.replaceState;
          history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            save();
          };

          window.addEventListener('popstate', save);
          window.addEventListener('hashchange', save);

          restore();
        }
      `;
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: script,
          injectTo: "head"
        }
      ];
    }
  };
}

// vite-plugin-generate-version.js
import { execSync } from "child_process";
import { writeFileSync } from "fs";
function generateVersionPlugin() {
  return {
    name: "generate-version",
    buildStart() {
      try {
        const timestamp = Date.now();
        let gitHash = "unknown";
        try {
          gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
        } catch (error) {
          console.warn("\u26A0\uFE0F Git no disponible, usando solo timestamp para versi\xF3n");
        }
        const version = {
          version: `${timestamp}-${gitHash}`,
          timestamp,
          gitHash,
          buildDate: (/* @__PURE__ */ new Date()).toISOString()
        };
        writeFileSync(
          "./public/version.json",
          JSON.stringify(version, null, 2),
          "utf-8"
        );
        console.log("\u2705 [VERSION] Versi\xF3n generada:", version.version);
      } catch (error) {
        console.error("\u274C [VERSION] Error generando versi\xF3n:", error);
      }
    }
  };
}

// vite.config.js
var __vite_injected_original_dirname = "C:\\Users\\Lenovo\\Desktop\\proyectos desplegados importante\\gay chat";
var isDev = process.env.NODE_ENV !== "production";
var reactPath = path2.resolve(__vite_injected_original_dirname, "./node_modules/react");
var reactDomPath = path2.resolve(__vite_injected_original_dirname, "./node_modules/react-dom");
var configHorizonsViteErrorHandler = `
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
var configHorizonsRuntimeErrorHandler = `
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
var configHorizonsConsoleErrroHandler = `
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
var configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;
const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
			.then(async response => {
				const contentType = response.headers.get('Content-Type') || '';
				const requestUrl = response.url || (url || '');

				// Exclude HTML document responses
				const isDocumentResponse =
					contentType.includes('text/html') ||
					contentType.includes('application/xhtml+xml');

				// Requests opacas/no-cors (ej: analytics) a veces no traen URL visible.
				const isOpaqueOrNoUrl = response.type === 'opaque' || !requestUrl;

				if (!response.ok && !isDocumentResponse && !isOpaqueOrNoUrl) {
						const responseClone = response.clone();
						const errorFromRes = await responseClone.text();
						
						// \u26A1 FILTRAR: Ignorar errores internos de Firestore que son transitorios
						const isFirestoreInternalError = 
						requestUrl.includes('firestore.googleapis.com') && 
						(response.status === 400 || response.status === 500 || response.status === 503);
					
					// \u26A1 FILTRAR: Ignorar errores de Firebase Auth que son transitorios
					const isFirebaseAuthError = 
						requestUrl.includes('identitytoolkit.googleapis.com') && 
						(response.status === 500 || response.status === 503);
					
					// \u26A1 FILTRAR: Ignorar errores de Google Analytics (ERR_INSUFFICIENT_RESOURCES es com\xFAn)
					const isGoogleAnalyticsError = 
						requestUrl.includes('google-analytics.com') || 
						requestUrl.includes('googletagmanager.com') ||
						requestUrl.includes('analytics.google.com') ||
						requestUrl.includes('G-PZQQL7WH39') ||
						requestUrl.includes('gtag');
					
					// \u26A1 FILTRAR: Ignorar errores 304 (Not Modified) - son normales, no son errores
					const isNotModified = response.status === 304;
					
						// \u26A1 FILTRAR: Ignorar errores de recursos locales en desarrollo (hot reload)
						const isLocalResourceError = 
							isDevMode && 
							(requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1')) &&
							(requestUrl.includes('.jsx') || requestUrl.includes('.js') || requestUrl.includes('.ts'));
					
					// \u26A1 FILTRAR: Ignorar errores de recursos insuficientes (ERR_INSUFFICIENT_RESOURCES)
					// Estos son errores del navegador cuando hay demasiadas peticiones, no errores reales
					const isInsufficientResources = 
						errorFromRes.includes('ERR_INSUFFICIENT_RESOURCES') ||
						errorFromRes.includes('net::ERR_INSUFFICIENT_RESOURCES');
					
						if (!isFirestoreInternalError && !isFirebaseAuthError && !isGoogleAnalyticsError && !isNotModified && !isLocalResourceError && !isInsufficientResources) {
							console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
						} else {
							// Log silencioso para debugging (solo en desarrollo)
							if (isDevMode) {
								console.debug(\`[IGNORED] Transient error (\${response.status}): \${requestUrl}\`);
							}
						}
			}

			return response;
		})
		.catch(error => {
			// \u26A1 FILTRAR: Ignorar errores de recursos insuficientes y Google Analytics
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
					isDevMode && 
					(url.includes('localhost') || url.includes('127.0.0.1')) &&
					(url.includes('.jsx') || url.includes('.js') || url.includes('.ts'));
			
			if (!url.match(/.html?$/i) && !isInsufficientResources && !isGoogleAnalyticsError && !isLocalResourceError) {
				console.error(error);
			}

			throw error;
		});
};
`;
var addTransformIndexHtml = {
  name: "add-transform-index-html",
  transformIndexHtml(html) {
    const tags = [
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsRuntimeErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsViteErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsConsoleErrroHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configWindowFetchMonkeyPatch,
        injectTo: "head"
      }
    ];
    if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
      tags.push(
        {
          tag: "script",
          attrs: {
            src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
            "template-redirect-url": process.env.TEMPLATE_REDIRECT_URL
          },
          injectTo: "head"
        }
      );
    }
    return {
      html,
      tags
    };
  }
};
console.warn = () => {
};
var logger = createLogger();
var loggerError = logger.error;
logger.error = (msg, options) => {
  var _a;
  if ((_a = options == null ? void 0 : options.error) == null ? void 0 : _a.toString().includes("CssSyntaxError: [postcss]")) {
    return;
  }
  loggerError(msg, options);
};
var vite_config_default = defineConfig({
  customLogger: logger,
  plugins: [
    generateVersionPlugin(),
    // 🔄 Generar version.json en cada build
    ...isDev ? [inlineEditPlugin(), inlineEditDevPlugin(), iframeRouteRestorationPlugin()] : [],
    react(),
    addTransformIndexHtml
    // removeConsolePlugin // ⚠️ TEMPORALMENTE DESHABILITADO - Causa error de parseo
  ],
  define: {
    // ✅ Fix para Supabase 2.90.0 - Definir variables de entorno
    "import.meta.env.DEV": JSON.stringify(isDev),
    "import.meta.env.PROD": JSON.stringify(!isDev),
    "import.meta.env.MODE": JSON.stringify(isDev ? "development" : "production")
  },
  server: {
    host: "localhost",
    port: 3e3,
    strictPort: true,
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless"
    },
    allowedHosts: true,
    hmr: {
      host: "localhost",
      port: 3e3,
      protocol: "ws"
    }
  },
  resolve: {
    extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path2.resolve(__vite_injected_original_dirname, "./src"),
      react: reactPath,
      "react-dom": reactDomPath,
      "react-dom/client": path2.resolve(reactDomPath, "./client.js"),
      "react/jsx-runtime": path2.resolve(reactPath, "./jsx-runtime.js"),
      "react/jsx-dev-runtime": path2.resolve(reactPath, "./jsx-dev-runtime.js")
    }
  },
  // ⚡ OPTIMIZACIÓN: Pre-bundlear dependencias pesadas para dev server más rápido
  optimizeDeps: {
    include: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
      "framer-motion",
      "date-fns"
    ],
    // Excluir módulos problemáticos del pre-bundling
    exclude: ["react", "react-dom", "react-dom/client", "react-router-dom"]
  },
  build: {
    target: "es2015",
    minify: "terser",
    sourcemap: false,
    // ⚡ Desactivar sourcemaps en producción (reduce tamaño)
    terserOptions: {
      compress: {
        drop_console: true,
        // Eliminar console.log en producción
        drop_debugger: true,
        pure_funcs: ["console.log", "console.debug", "console.info"],
        passes: 2,
        // ⚡ Optimizaciones adicionales
        ecma: 2015,
        toplevel: true,
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
        // ⚡ Eliminar comentarios
      }
    },
    rollupOptions: {
      external: [
        "@babel/parser",
        "@babel/traverse",
        "@babel/generator",
        "@babel/types"
      ],
      output: {
        // ⚡ MANUAL CHUNKS: Separar vendors grandes para mejor caching
        manualChunks: {
          // React core (carga en todas las páginas, buen candidato para cache)
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Firebase (grande, separado para no afectar bundle principal)
          "firebase-vendor": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage"
          ],
          // UI Libraries (Radix UI - solo se carga cuando se necesita)
          "ui-vendor": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot"
          ],
          // Animations (Framer Motion - pesado, separado)
          "animation-vendor": ["framer-motion"],
          // Utils (pequeños, pueden estar juntos)
          "utils-vendor": [
            "date-fns",
            "clsx",
            "tailwind-merge",
            "class-variance-authority"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500
    // Advertir si un chunk > 500KB
  },
  publicDir: "public"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLXJlYWN0LWlubGluZS1lZGl0b3IuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLWVkaXQtbW9kZS5qcyIsICJwbHVnaW5zL3Zpc3VhbC1lZGl0b3IvdmlzdWFsLWVkaXRvci1jb25maWcuanMiLCAicGx1Z2lucy92aXRlLXBsdWdpbi1pZnJhbWUtcm91dGUtcmVzdG9yYXRpb24uanMiLCAidml0ZS1wbHVnaW4tZ2VuZXJhdGUtdmVyc2lvbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlbm92b1xcXFxEZXNrdG9wXFxcXHByb3llY3RvcyBkZXNwbGVnYWRvcyBpbXBvcnRhbnRlXFxcXGdheSBjaGF0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxwcm95ZWN0b3MgZGVzcGxlZ2Fkb3MgaW1wb3J0YW50ZVxcXFxnYXkgY2hhdFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGVub3ZvL0Rlc2t0b3AvcHJveWVjdG9zJTIwZGVzcGxlZ2Fkb3MlMjBpbXBvcnRhbnRlL2dheSUyMGNoYXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciwgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgaW5saW5lRWRpdFBsdWdpbiBmcm9tICcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzJztcbmltcG9ydCBlZGl0TW9kZURldlBsdWdpbiBmcm9tICcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1lZGl0LW1vZGUuanMnO1xuaW1wb3J0IGlmcmFtZVJvdXRlUmVzdG9yYXRpb25QbHVnaW4gZnJvbSAnLi9wbHVnaW5zL3ZpdGUtcGx1Z2luLWlmcmFtZS1yb3V0ZS1yZXN0b3JhdGlvbi5qcyc7XG5pbXBvcnQgZ2VuZXJhdGVWZXJzaW9uUGx1Z2luIGZyb20gJy4vdml0ZS1wbHVnaW4tZ2VuZXJhdGUtdmVyc2lvbi5qcyc7XG5cbmNvbnN0IGlzRGV2ID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJztcbmNvbnN0IHJlYWN0UGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpO1xuY29uc3QgcmVhY3REb21QYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbScpO1xuXG5jb25zdCBjb25maWdIb3Jpem9uc1ZpdGVFcnJvckhhbmRsZXIgPSBgXG5jb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0Zm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnMpIHtcblx0XHRmb3IgKGNvbnN0IGFkZGVkTm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdGFkZGVkTm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiZcblx0XHRcdFx0KFxuXHRcdFx0XHRcdGFkZGVkTm9kZS50YWdOYW1lPy50b0xvd2VyQ2FzZSgpID09PSAndml0ZS1lcnJvci1vdmVybGF5JyB8fFxuXHRcdFx0XHRcdGFkZGVkTm9kZS5jbGFzc0xpc3Q/LmNvbnRhaW5zKCdiYWNrZHJvcCcpXG5cdFx0XHRcdClcblx0XHRcdCkge1xuXHRcdFx0XHRoYW5kbGVWaXRlT3ZlcmxheShhZGRlZE5vZGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSk7XG5cbm9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7XG5cdGNoaWxkTGlzdDogdHJ1ZSxcblx0c3VidHJlZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIGhhbmRsZVZpdGVPdmVybGF5KG5vZGUpIHtcblx0aWYgKCFub2RlLnNoYWRvd1Jvb3QpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBiYWNrZHJvcCA9IG5vZGUuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcuYmFja2Ryb3AnKTtcblxuXHRpZiAoYmFja2Ryb3ApIHtcblx0XHRjb25zdCBvdmVybGF5SHRtbCA9IGJhY2tkcm9wLm91dGVySFRNTDtcblx0XHRjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG5cdFx0Y29uc3QgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhvdmVybGF5SHRtbCwgJ3RleHQvaHRtbCcpO1xuXHRcdGNvbnN0IG1lc3NhZ2VCb2R5RWxlbWVudCA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZS1ib2R5Jyk7XG5cdFx0Y29uc3QgZmlsZUVsZW1lbnQgPSBkb2MucXVlcnlTZWxlY3RvcignLmZpbGUnKTtcblx0XHRjb25zdCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2VCb2R5RWxlbWVudCA/IG1lc3NhZ2VCb2R5RWxlbWVudC50ZXh0Q29udGVudC50cmltKCkgOiAnJztcblx0XHRjb25zdCBmaWxlVGV4dCA9IGZpbGVFbGVtZW50ID8gZmlsZUVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpIDogJyc7XG5cdFx0Y29uc3QgZXJyb3IgPSBtZXNzYWdlVGV4dCArIChmaWxlVGV4dCA/ICcgRmlsZTonICsgZmlsZVRleHQgOiAnJyk7XG5cblx0XHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6ICdob3Jpem9ucy12aXRlLWVycm9yJyxcblx0XHRcdGVycm9yLFxuXHRcdH0sICcqJyk7XG5cdH1cbn1cbmA7XG5cbmNvbnN0IGNvbmZpZ0hvcml6b25zUnVudGltZUVycm9ySGFuZGxlciA9IGBcbndpbmRvdy5vbmVycm9yID0gKG1lc3NhZ2UsIHNvdXJjZSwgbGluZW5vLCBjb2xubywgZXJyb3JPYmopID0+IHtcblx0Y29uc3QgZXJyb3JEZXRhaWxzID0gZXJyb3JPYmogPyBKU09OLnN0cmluZ2lmeSh7XG5cdFx0bmFtZTogZXJyb3JPYmoubmFtZSxcblx0XHRtZXNzYWdlOiBlcnJvck9iai5tZXNzYWdlLFxuXHRcdHN0YWNrOiBlcnJvck9iai5zdGFjayxcblx0XHRzb3VyY2UsXG5cdFx0bGluZW5vLFxuXHRcdGNvbG5vLFxuXHR9KSA6IG51bGw7XG5cblx0d2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7XG5cdFx0dHlwZTogJ2hvcml6b25zLXJ1bnRpbWUtZXJyb3InLFxuXHRcdG1lc3NhZ2UsXG5cdFx0ZXJyb3I6IGVycm9yRGV0YWlsc1xuXHR9LCAnKicpO1xufTtcbmA7XG5cbmNvbnN0IGNvbmZpZ0hvcml6b25zQ29uc29sZUVycnJvSGFuZGxlciA9IGBcbmNvbnN0IG9yaWdpbmFsQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cdG9yaWdpbmFsQ29uc29sZUVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuXG5cdGxldCBlcnJvclN0cmluZyA9ICcnO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGFyZyA9IGFyZ3NbaV07XG5cdFx0aWYgKGFyZyBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRlcnJvclN0cmluZyA9IGFyZy5zdGFjayB8fCBcXGBcXCR7YXJnLm5hbWV9OiBcXCR7YXJnLm1lc3NhZ2V9XFxgO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFlcnJvclN0cmluZykge1xuXHRcdGVycm9yU3RyaW5nID0gYXJncy5tYXAoYXJnID0+IHR5cGVvZiBhcmcgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYXJnKSA6IFN0cmluZyhhcmcpKS5qb2luKCcgJyk7XG5cdH1cblxuXHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHR0eXBlOiAnaG9yaXpvbnMtY29uc29sZS1lcnJvcicsXG5cdFx0ZXJyb3I6IGVycm9yU3RyaW5nXG5cdH0sICcqJyk7XG59O1xuYDtcblxuY29uc3QgY29uZmlnV2luZG93RmV0Y2hNb25rZXlQYXRjaCA9IGBcbmNvbnN0IG9yaWdpbmFsRmV0Y2ggPSB3aW5kb3cuZmV0Y2g7XG5jb25zdCBpc0Rldk1vZGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJzEyNy4wLjAuMSc7XG5cbndpbmRvdy5mZXRjaCA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0Y29uc3QgdXJsID0gYXJnc1swXSBpbnN0YW5jZW9mIFJlcXVlc3QgPyBhcmdzWzBdLnVybCA6IGFyZ3NbMF07XG5cblx0Ly8gU2tpcCBXZWJTb2NrZXQgVVJMc1xuXHRpZiAodXJsLnN0YXJ0c1dpdGgoJ3dzOicpIHx8IHVybC5zdGFydHNXaXRoKCd3c3M6JykpIHtcblx0XHRyZXR1cm4gb3JpZ2luYWxGZXRjaC5hcHBseSh0aGlzLCBhcmdzKTtcblx0fVxuXG5cdHJldHVybiBvcmlnaW5hbEZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdFx0XHQudGhlbihhc3luYyByZXNwb25zZSA9PiB7XG5cdFx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpIHx8ICcnO1xuXHRcdFx0XHRjb25zdCByZXF1ZXN0VXJsID0gcmVzcG9uc2UudXJsIHx8ICh1cmwgfHwgJycpO1xuXG5cdFx0XHRcdC8vIEV4Y2x1ZGUgSFRNTCBkb2N1bWVudCByZXNwb25zZXNcblx0XHRcdFx0Y29uc3QgaXNEb2N1bWVudFJlc3BvbnNlID1cblx0XHRcdFx0XHRjb250ZW50VHlwZS5pbmNsdWRlcygndGV4dC9odG1sJykgfHxcblx0XHRcdFx0XHRjb250ZW50VHlwZS5pbmNsdWRlcygnYXBwbGljYXRpb24veGh0bWwreG1sJyk7XG5cblx0XHRcdFx0Ly8gUmVxdWVzdHMgb3BhY2FzL25vLWNvcnMgKGVqOiBhbmFseXRpY3MpIGEgdmVjZXMgbm8gdHJhZW4gVVJMIHZpc2libGUuXG5cdFx0XHRcdGNvbnN0IGlzT3BhcXVlT3JOb1VybCA9IHJlc3BvbnNlLnR5cGUgPT09ICdvcGFxdWUnIHx8ICFyZXF1ZXN0VXJsO1xuXG5cdFx0XHRcdGlmICghcmVzcG9uc2Uub2sgJiYgIWlzRG9jdW1lbnRSZXNwb25zZSAmJiAhaXNPcGFxdWVPck5vVXJsKSB7XG5cdFx0XHRcdFx0XHRjb25zdCByZXNwb25zZUNsb25lID0gcmVzcG9uc2UuY2xvbmUoKTtcblx0XHRcdFx0XHRcdGNvbnN0IGVycm9yRnJvbVJlcyA9IGF3YWl0IHJlc3BvbnNlQ2xvbmUudGV4dCgpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBcdTI2QTEgRklMVFJBUjogSWdub3JhciBlcnJvcmVzIGludGVybm9zIGRlIEZpcmVzdG9yZSBxdWUgc29uIHRyYW5zaXRvcmlvc1xuXHRcdFx0XHRcdFx0Y29uc3QgaXNGaXJlc3RvcmVJbnRlcm5hbEVycm9yID0gXG5cdFx0XHRcdFx0XHRyZXF1ZXN0VXJsLmluY2x1ZGVzKCdmaXJlc3RvcmUuZ29vZ2xlYXBpcy5jb20nKSAmJiBcblx0XHRcdFx0XHRcdChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCB8fCByZXNwb25zZS5zdGF0dXMgPT09IDUwMCB8fCByZXNwb25zZS5zdGF0dXMgPT09IDUwMyk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gXHUyNkExIEZJTFRSQVI6IElnbm9yYXIgZXJyb3JlcyBkZSBGaXJlYmFzZSBBdXRoIHF1ZSBzb24gdHJhbnNpdG9yaW9zXG5cdFx0XHRcdFx0Y29uc3QgaXNGaXJlYmFzZUF1dGhFcnJvciA9IFxuXHRcdFx0XHRcdFx0cmVxdWVzdFVybC5pbmNsdWRlcygnaWRlbnRpdHl0b29sa2l0Lmdvb2dsZWFwaXMuY29tJykgJiYgXG5cdFx0XHRcdFx0XHQocmVzcG9uc2Uuc3RhdHVzID09PSA1MDAgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA1MDMpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIFx1MjZBMSBGSUxUUkFSOiBJZ25vcmFyIGVycm9yZXMgZGUgR29vZ2xlIEFuYWx5dGljcyAoRVJSX0lOU1VGRklDSUVOVF9SRVNPVVJDRVMgZXMgY29tXHUwMEZBbilcblx0XHRcdFx0XHRjb25zdCBpc0dvb2dsZUFuYWx5dGljc0Vycm9yID0gXG5cdFx0XHRcdFx0XHRyZXF1ZXN0VXJsLmluY2x1ZGVzKCdnb29nbGUtYW5hbHl0aWNzLmNvbScpIHx8IFxuXHRcdFx0XHRcdFx0cmVxdWVzdFVybC5pbmNsdWRlcygnZ29vZ2xldGFnbWFuYWdlci5jb20nKSB8fFxuXHRcdFx0XHRcdFx0cmVxdWVzdFVybC5pbmNsdWRlcygnYW5hbHl0aWNzLmdvb2dsZS5jb20nKSB8fFxuXHRcdFx0XHRcdFx0cmVxdWVzdFVybC5pbmNsdWRlcygnRy1QWlFRTDdXSDM5JykgfHxcblx0XHRcdFx0XHRcdHJlcXVlc3RVcmwuaW5jbHVkZXMoJ2d0YWcnKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBcdTI2QTEgRklMVFJBUjogSWdub3JhciBlcnJvcmVzIDMwNCAoTm90IE1vZGlmaWVkKSAtIHNvbiBub3JtYWxlcywgbm8gc29uIGVycm9yZXNcblx0XHRcdFx0XHRjb25zdCBpc05vdE1vZGlmaWVkID0gcmVzcG9uc2Uuc3RhdHVzID09PSAzMDQ7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBcdTI2QTEgRklMVFJBUjogSWdub3JhciBlcnJvcmVzIGRlIHJlY3Vyc29zIGxvY2FsZXMgZW4gZGVzYXJyb2xsbyAoaG90IHJlbG9hZClcblx0XHRcdFx0XHRcdGNvbnN0IGlzTG9jYWxSZXNvdXJjZUVycm9yID0gXG5cdFx0XHRcdFx0XHRcdGlzRGV2TW9kZSAmJiBcblx0XHRcdFx0XHRcdFx0KHJlcXVlc3RVcmwuaW5jbHVkZXMoJ2xvY2FsaG9zdCcpIHx8IHJlcXVlc3RVcmwuaW5jbHVkZXMoJzEyNy4wLjAuMScpKSAmJlxuXHRcdFx0XHRcdFx0XHQocmVxdWVzdFVybC5pbmNsdWRlcygnLmpzeCcpIHx8IHJlcXVlc3RVcmwuaW5jbHVkZXMoJy5qcycpIHx8IHJlcXVlc3RVcmwuaW5jbHVkZXMoJy50cycpKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBcdTI2QTEgRklMVFJBUjogSWdub3JhciBlcnJvcmVzIGRlIHJlY3Vyc29zIGluc3VmaWNpZW50ZXMgKEVSUl9JTlNVRkZJQ0lFTlRfUkVTT1VSQ0VTKVxuXHRcdFx0XHRcdC8vIEVzdG9zIHNvbiBlcnJvcmVzIGRlbCBuYXZlZ2Fkb3IgY3VhbmRvIGhheSBkZW1hc2lhZGFzIHBldGljaW9uZXMsIG5vIGVycm9yZXMgcmVhbGVzXG5cdFx0XHRcdFx0Y29uc3QgaXNJbnN1ZmZpY2llbnRSZXNvdXJjZXMgPSBcblx0XHRcdFx0XHRcdGVycm9yRnJvbVJlcy5pbmNsdWRlcygnRVJSX0lOU1VGRklDSUVOVF9SRVNPVVJDRVMnKSB8fFxuXHRcdFx0XHRcdFx0ZXJyb3JGcm9tUmVzLmluY2x1ZGVzKCduZXQ6OkVSUl9JTlNVRkZJQ0lFTlRfUkVTT1VSQ0VTJyk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRpZiAoIWlzRmlyZXN0b3JlSW50ZXJuYWxFcnJvciAmJiAhaXNGaXJlYmFzZUF1dGhFcnJvciAmJiAhaXNHb29nbGVBbmFseXRpY3NFcnJvciAmJiAhaXNOb3RNb2RpZmllZCAmJiAhaXNMb2NhbFJlc291cmNlRXJyb3IgJiYgIWlzSW5zdWZmaWNpZW50UmVzb3VyY2VzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXFxgRmV0Y2ggZXJyb3IgZnJvbSBcXCR7cmVxdWVzdFVybH06IFxcJHtlcnJvckZyb21SZXN9XFxgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdC8vIExvZyBzaWxlbmNpb3NvIHBhcmEgZGVidWdnaW5nIChzb2xvIGVuIGRlc2Fycm9sbG8pXG5cdFx0XHRcdFx0XHRcdGlmIChpc0Rldk1vZGUpIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmRlYnVnKFxcYFtJR05PUkVEXSBUcmFuc2llbnQgZXJyb3IgKFxcJHtyZXNwb25zZS5zdGF0dXN9KTogXFwke3JlcXVlc3RVcmx9XFxgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fSlcblx0XHQuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0Ly8gXHUyNkExIEZJTFRSQVI6IElnbm9yYXIgZXJyb3JlcyBkZSByZWN1cnNvcyBpbnN1ZmljaWVudGVzIHkgR29vZ2xlIEFuYWx5dGljc1xuXHRcdFx0Y29uc3QgaXNJbnN1ZmZpY2llbnRSZXNvdXJjZXMgPSBcblx0XHRcdFx0ZXJyb3IubWVzc2FnZT8uaW5jbHVkZXMoJ0VSUl9JTlNVRkZJQ0lFTlRfUkVTT1VSQ0VTJykgfHxcblx0XHRcdFx0ZXJyb3IubWVzc2FnZT8uaW5jbHVkZXMoJ25ldDo6RVJSX0lOU1VGRklDSUVOVF9SRVNPVVJDRVMnKTtcblx0XHRcdFxuXHRcdFx0Y29uc3QgaXNHb29nbGVBbmFseXRpY3NFcnJvciA9IFxuXHRcdFx0XHR1cmwuaW5jbHVkZXMoJ2dvb2dsZS1hbmFseXRpY3MuY29tJykgfHwgXG5cdFx0XHRcdHVybC5pbmNsdWRlcygnZ29vZ2xldGFnbWFuYWdlci5jb20nKSB8fFxuXHRcdFx0XHR1cmwuaW5jbHVkZXMoJ2FuYWx5dGljcy5nb29nbGUuY29tJykgfHxcblx0XHRcdFx0dXJsLmluY2x1ZGVzKCdHLVBaUVFMN1dIMzknKSB8fFxuXHRcdFx0XHR1cmwuaW5jbHVkZXMoJ2d0YWcnKTtcblx0XHRcdFxuXHRcdFx0XHRjb25zdCBpc0xvY2FsUmVzb3VyY2VFcnJvciA9IFxuXHRcdFx0XHRcdGlzRGV2TW9kZSAmJiBcblx0XHRcdFx0XHQodXJsLmluY2x1ZGVzKCdsb2NhbGhvc3QnKSB8fCB1cmwuaW5jbHVkZXMoJzEyNy4wLjAuMScpKSAmJlxuXHRcdFx0XHRcdCh1cmwuaW5jbHVkZXMoJy5qc3gnKSB8fCB1cmwuaW5jbHVkZXMoJy5qcycpIHx8IHVybC5pbmNsdWRlcygnLnRzJykpO1xuXHRcdFx0XG5cdFx0XHRpZiAoIXVybC5tYXRjaCgvXFwuaHRtbD8kL2kpICYmICFpc0luc3VmZmljaWVudFJlc291cmNlcyAmJiAhaXNHb29nbGVBbmFseXRpY3NFcnJvciAmJiAhaXNMb2NhbFJlc291cmNlRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0XHR9XG5cblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH0pO1xufTtcbmA7XG5cbmNvbnN0IGFkZFRyYW5zZm9ybUluZGV4SHRtbCA9IHtcblx0bmFtZTogJ2FkZC10cmFuc2Zvcm0taW5kZXgtaHRtbCcsXG5cdHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XG5cdFx0Y29uc3QgdGFncyA9IFtcblx0XHRcdHtcblx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zUnVudGltZUVycm9ySGFuZGxlcixcblx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdGNoaWxkcmVuOiBjb25maWdIb3Jpem9uc1ZpdGVFcnJvckhhbmRsZXIsXG5cdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRhdHRyczoge3R5cGU6ICdtb2R1bGUnfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zQ29uc29sZUVycnJvSGFuZGxlcixcblx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdGNoaWxkcmVuOiBjb25maWdXaW5kb3dGZXRjaE1vbmtleVBhdGNoLFxuXHRcdFx0XHRpbmplY3RUbzogJ2hlYWQnLFxuXHRcdFx0fSxcblx0XHRdO1xuXG5cdFx0aWYgKCFpc0RldiAmJiBwcm9jZXNzLmVudi5URU1QTEFURV9CQU5ORVJfU0NSSVBUX1VSTCAmJiBwcm9jZXNzLmVudi5URU1QTEFURV9SRURJUkVDVF9VUkwpIHtcblx0XHRcdHRhZ3MucHVzaChcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdFx0YXR0cnM6IHtcblx0XHRcdFx0XHRcdHNyYzogcHJvY2Vzcy5lbnYuVEVNUExBVEVfQkFOTkVSX1NDUklQVF9VUkwsXG5cdFx0XHRcdFx0XHQndGVtcGxhdGUtcmVkaXJlY3QtdXJsJzogcHJvY2Vzcy5lbnYuVEVNUExBVEVfUkVESVJFQ1RfVVJMLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aHRtbCxcblx0XHRcdHRhZ3MsXG5cdFx0fTtcblx0fSxcbn07XG5cbmNvbnNvbGUud2FybiA9ICgpID0+IHt9O1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoKVxuY29uc3QgbG9nZ2VyRXJyb3IgPSBsb2dnZXIuZXJyb3JcblxubG9nZ2VyLmVycm9yID0gKG1zZywgb3B0aW9ucykgPT4ge1xuXHRpZiAob3B0aW9ucz8uZXJyb3I/LnRvU3RyaW5nKCkuaW5jbHVkZXMoJ0Nzc1N5bnRheEVycm9yOiBbcG9zdGNzc10nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxvZ2dlckVycm9yKG1zZywgb3B0aW9ucyk7XG59XG5cbi8vIFx1MjcwNSBBXHUwMEQxQURJRE8gMjAyNS0xMi0xMTogUGx1Z2luIHBhcmEgcmVtb3ZlciBjb25zb2xlLmxvZ3MgZW4gcHJvZHVjY2lcdTAwRjNuXG5jb25zdCByZW1vdmVDb25zb2xlUGx1Z2luID0ge1xuXHRuYW1lOiAncmVtb3ZlLWNvbnNvbGUnLFxuXHR0cmFuc2Zvcm0oY29kZSwgaWQpIHtcblx0XHRpZiAoaXNEZXYgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSByZXR1cm47XG5cblx0XHQvLyBSZW1vdmVyIGNvbnNvbGUubG9nLCBjb25zb2xlLmRlYnVnLCBjb25zb2xlLmluZm8sIGNvbnNvbGUud2FyblxuXHRcdC8vIE1hbnRlbmVyIGNvbnNvbGUuZXJyb3IgcGFyYSBwcm9kdWNjaVx1MDBGM25cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29kZTogY29kZVxuXHRcdFx0XHQucmVwbGFjZSgvY29uc29sZVxcLihsb2d8ZGVidWd8aW5mb3x3YXJuKVxccypcXChbXildKlxcKTs/L2csICcnKVxuXHRcdFx0XHQucmVwbGFjZSgvY29uc29sZVxcLihsb2d8ZGVidWd8aW5mb3x3YXJuKVxccypcXChgW15gXSpgXFwpOz8vZywgJycpLFxuXHRcdFx0bWFwOiBudWxsXG5cdFx0fTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcblx0Y3VzdG9tTG9nZ2VyOiBsb2dnZXIsXG5cdHBsdWdpbnM6IFtcblx0XHRnZW5lcmF0ZVZlcnNpb25QbHVnaW4oKSwgLy8gXHVEODNEXHVERDA0IEdlbmVyYXIgdmVyc2lvbi5qc29uIGVuIGNhZGEgYnVpbGRcblx0XHQuLi4oaXNEZXYgPyBbaW5saW5lRWRpdFBsdWdpbigpLCBlZGl0TW9kZURldlBsdWdpbigpLCBpZnJhbWVSb3V0ZVJlc3RvcmF0aW9uUGx1Z2luKCldIDogW10pLFxuXHRcdHJlYWN0KCksXG5cdFx0YWRkVHJhbnNmb3JtSW5kZXhIdG1sLFxuXHRcdC8vIHJlbW92ZUNvbnNvbGVQbHVnaW4gLy8gXHUyNkEwXHVGRTBGIFRFTVBPUkFMTUVOVEUgREVTSEFCSUxJVEFETyAtIENhdXNhIGVycm9yIGRlIHBhcnNlb1xuXHRdLFxuXHRkZWZpbmU6IHtcblx0XHQvLyBcdTI3MDUgRml4IHBhcmEgU3VwYWJhc2UgMi45MC4wIC0gRGVmaW5pciB2YXJpYWJsZXMgZGUgZW50b3Jub1xuXHRcdCdpbXBvcnQubWV0YS5lbnYuREVWJzogSlNPTi5zdHJpbmdpZnkoaXNEZXYpLFxuXHRcdCdpbXBvcnQubWV0YS5lbnYuUFJPRCc6IEpTT04uc3RyaW5naWZ5KCFpc0RldiksXG5cdFx0J2ltcG9ydC5tZXRhLmVudi5NT0RFJzogSlNPTi5zdHJpbmdpZnkoaXNEZXYgPyAnZGV2ZWxvcG1lbnQnIDogJ3Byb2R1Y3Rpb24nKSxcblx0fSxcblx0c2VydmVyOiB7XG5cdFx0aG9zdDogJ2xvY2FsaG9zdCcsXG5cdFx0cG9ydDogMzAwMCxcblx0XHRzdHJpY3RQb3J0OiB0cnVlLFxuXHRcdGNvcnM6IHRydWUsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAnY3JlZGVudGlhbGxlc3MnLFxuXHRcdH0sXG5cdFx0YWxsb3dlZEhvc3RzOiB0cnVlLFxuXHRcdGhtcjoge1xuXHRcdFx0aG9zdDogJ2xvY2FsaG9zdCcsXG5cdFx0XHRwb3J0OiAzMDAwLFxuXHRcdFx0cHJvdG9jb2w6ICd3cycsXG5cdFx0fSxcblx0fSxcblx0cmVzb2x2ZToge1xuXHRcdGV4dGVuc2lvbnM6IFsnLmpzeCcsICcuanMnLCAnLnRzeCcsICcudHMnLCAnLmpzb24nLCBdLFxuXHRcdGRlZHVwZTogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcblx0XHRhbGlhczoge1xuXHRcdFx0J0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcblx0XHRcdHJlYWN0OiByZWFjdFBhdGgsXG5cdFx0XHQncmVhY3QtZG9tJzogcmVhY3REb21QYXRoLFxuXHRcdFx0J3JlYWN0LWRvbS9jbGllbnQnOiBwYXRoLnJlc29sdmUocmVhY3REb21QYXRoLCAnLi9jbGllbnQuanMnKSxcblx0XHRcdCdyZWFjdC9qc3gtcnVudGltZSc6IHBhdGgucmVzb2x2ZShyZWFjdFBhdGgsICcuL2pzeC1ydW50aW1lLmpzJyksXG5cdFx0XHQncmVhY3QvanN4LWRldi1ydW50aW1lJzogcGF0aC5yZXNvbHZlKHJlYWN0UGF0aCwgJy4vanN4LWRldi1ydW50aW1lLmpzJyksXG5cdFx0fSxcblx0fSxcblx0Ly8gXHUyNkExIE9QVElNSVpBQ0lcdTAwRDNOOiBQcmUtYnVuZGxlYXIgZGVwZW5kZW5jaWFzIHBlc2FkYXMgcGFyYSBkZXYgc2VydmVyIG1cdTAwRTFzIHJcdTAwRTFwaWRvXG5cdG9wdGltaXplRGVwczoge1xuXHRcdGluY2x1ZGU6IFtcblx0XHRcdCdmaXJlYmFzZS9hcHAnLFxuXHRcdFx0J2ZpcmViYXNlL2F1dGgnLFxuXHRcdFx0J2ZpcmViYXNlL2ZpcmVzdG9yZScsXG5cdFx0XHQnZmlyZWJhc2Uvc3RvcmFnZScsXG5cdFx0XHQnZnJhbWVyLW1vdGlvbicsXG5cdFx0XHQnZGF0ZS1mbnMnLFxuXHRcdF0sXG5cdFx0Ly8gRXhjbHVpciBtXHUwMEYzZHVsb3MgcHJvYmxlbVx1MDBFMXRpY29zIGRlbCBwcmUtYnVuZGxpbmdcblx0XHRleGNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1kb20vY2xpZW50JywgJ3JlYWN0LXJvdXRlci1kb20nXSxcblx0fSxcblx0YnVpbGQ6IHtcblx0XHR0YXJnZXQ6ICdlczIwMTUnLFxuXHRcdG1pbmlmeTogJ3RlcnNlcicsXG5cdFx0c291cmNlbWFwOiBmYWxzZSwgLy8gXHUyNkExIERlc2FjdGl2YXIgc291cmNlbWFwcyBlbiBwcm9kdWNjaVx1MDBGM24gKHJlZHVjZSB0YW1hXHUwMEYxbylcblx0XHR0ZXJzZXJPcHRpb25zOiB7XG5cdFx0XHRjb21wcmVzczoge1xuXHRcdFx0XHRkcm9wX2NvbnNvbGU6IHRydWUsIC8vIEVsaW1pbmFyIGNvbnNvbGUubG9nIGVuIHByb2R1Y2NpXHUwMEYzblxuXHRcdFx0XHRkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuXHRcdFx0XHRwdXJlX2Z1bmNzOiBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuZGVidWcnLCAnY29uc29sZS5pbmZvJ10sXG5cdFx0XHRcdHBhc3NlczogMixcblx0XHRcdFx0Ly8gXHUyNkExIE9wdGltaXphY2lvbmVzIGFkaWNpb25hbGVzXG5cdFx0XHRcdGVjbWE6IDIwMTUsXG5cdFx0XHRcdHRvcGxldmVsOiB0cnVlLFxuXHRcdFx0XHR1bnNhZmVfYXJyb3dzOiB0cnVlLFxuXHRcdFx0XHR1bnNhZmVfbWV0aG9kczogdHJ1ZSxcblx0XHRcdH0sXG5cdFx0XHRtYW5nbGU6IHtcblx0XHRcdFx0c2FmYXJpMTA6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0Zm9ybWF0OiB7XG5cdFx0XHRcdGNvbW1lbnRzOiBmYWxzZSwgLy8gXHUyNkExIEVsaW1pbmFyIGNvbWVudGFyaW9zXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0cm9sbHVwT3B0aW9uczoge1xuXHRcdFx0ZXh0ZXJuYWw6IFtcblx0XHRcdFx0J0BiYWJlbC9wYXJzZXInLFxuXHRcdFx0XHQnQGJhYmVsL3RyYXZlcnNlJyxcblx0XHRcdFx0J0BiYWJlbC9nZW5lcmF0b3InLFxuXHRcdFx0XHQnQGJhYmVsL3R5cGVzJ1xuXHRcdFx0XSxcblx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHQvLyBcdTI2QTEgTUFOVUFMIENIVU5LUzogU2VwYXJhciB2ZW5kb3JzIGdyYW5kZXMgcGFyYSBtZWpvciBjYWNoaW5nXG5cdFx0XHRcdG1hbnVhbENodW5rczoge1xuXHRcdFx0XHRcdC8vIFJlYWN0IGNvcmUgKGNhcmdhIGVuIHRvZGFzIGxhcyBwXHUwMEUxZ2luYXMsIGJ1ZW4gY2FuZGlkYXRvIHBhcmEgY2FjaGUpXG5cdFx0XHRcdFx0J3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcblxuXHRcdFx0XHRcdC8vIEZpcmViYXNlIChncmFuZGUsIHNlcGFyYWRvIHBhcmEgbm8gYWZlY3RhciBidW5kbGUgcHJpbmNpcGFsKVxuXHRcdFx0XHRcdCdmaXJlYmFzZS12ZW5kb3InOiBbXG5cdFx0XHRcdFx0XHQnZmlyZWJhc2UvYXBwJyxcblx0XHRcdFx0XHRcdCdmaXJlYmFzZS9hdXRoJyxcblx0XHRcdFx0XHRcdCdmaXJlYmFzZS9maXJlc3RvcmUnLFxuXHRcdFx0XHRcdFx0J2ZpcmViYXNlL3N0b3JhZ2UnXG5cdFx0XHRcdFx0XSxcblxuXHRcdFx0XHRcdC8vIFVJIExpYnJhcmllcyAoUmFkaXggVUkgLSBzb2xvIHNlIGNhcmdhIGN1YW5kbyBzZSBuZWNlc2l0YSlcblx0XHRcdFx0XHQndWktdmVuZG9yJzogW1xuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1hdmF0YXInLFxuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51Jyxcblx0XHRcdFx0XHRcdCdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0Jyxcblx0XHRcdFx0XHRcdCdAcmFkaXgtdWkvcmVhY3QtdGFicycsXG5cdFx0XHRcdFx0XHQnQHJhZGl4LXVpL3JlYWN0LXRvYXN0Jyxcblx0XHRcdFx0XHRcdCdAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nJyxcblx0XHRcdFx0XHRcdCdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1sYWJlbCcsXG5cdFx0XHRcdFx0XHQnQHJhZGl4LXVpL3JlYWN0LXJhZGlvLWdyb3VwJyxcblx0XHRcdFx0XHRcdCdAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWEnLFxuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1zbGlkZXInLFxuXHRcdFx0XHRcdFx0J0ByYWRpeC11aS9yZWFjdC1zbG90J1xuXHRcdFx0XHRcdF0sXG5cblx0XHRcdFx0XHQvLyBBbmltYXRpb25zIChGcmFtZXIgTW90aW9uIC0gcGVzYWRvLCBzZXBhcmFkbylcblx0XHRcdFx0XHQnYW5pbWF0aW9uLXZlbmRvcic6IFsnZnJhbWVyLW1vdGlvbiddLFxuXG5cdFx0XHRcdFx0Ly8gVXRpbHMgKHBlcXVlXHUwMEYxb3MsIHB1ZWRlbiBlc3RhciBqdW50b3MpXG5cdFx0XHRcdFx0J3V0aWxzLXZlbmRvcic6IFtcblx0XHRcdFx0XHRcdCdkYXRlLWZucycsXG5cdFx0XHRcdFx0XHQnY2xzeCcsXG5cdFx0XHRcdFx0XHQndGFpbHdpbmQtbWVyZ2UnLFxuXHRcdFx0XHRcdFx0J2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eSdcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLCAvLyBBZHZlcnRpciBzaSB1biBjaHVuayA+IDUwMEtCXG5cdH0sXG5cdHB1YmxpY0RpcjogJ3B1YmxpYydcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxwcm95ZWN0b3MgZGVzcGxlZ2Fkb3MgaW1wb3J0YW50ZVxcXFxnYXkgY2hhdFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlbm92b1xcXFxEZXNrdG9wXFxcXHByb3llY3RvcyBkZXNwbGVnYWRvcyBpbXBvcnRhbnRlXFxcXGdheSBjaGF0XFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclxcXFx2aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9MZW5vdm8vRGVza3RvcC9wcm95ZWN0b3MlMjBkZXNwbGVnYWRvcyUyMGltcG9ydGFudGUvZ2F5JTIwY2hhdC9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qc1wiO2ltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IHRyYXZlcnNlQmFiZWwgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCBnZW5lcmF0ZSBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJztcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XG5jb25zdCBWSVRFX1BST0pFQ1RfUk9PVCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLicpO1xuY29uc3QgRURJVEFCTEVfSFRNTF9UQUdTID0gW1wiYVwiLCBcIkJ1dHRvblwiLCBcImJ1dHRvblwiLCBcInBcIiwgXCJzcGFuXCIsIFwiaDFcIiwgXCJoMlwiLCBcImgzXCIsIFwiaDRcIiwgXCJoNVwiLCBcImg2XCIsIFwibGFiZWxcIiwgXCJMYWJlbFwiLCBcImltZ1wiXTtcblxuZnVuY3Rpb24gcGFyc2VFZGl0SWQoZWRpdElkKSB7XG4gIGNvbnN0IHBhcnRzID0gZWRpdElkLnNwbGl0KCc6Jyk7XG5cbiAgaWYgKHBhcnRzLmxlbmd0aCA8IDMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNvbHVtbiA9IHBhcnNlSW50KHBhcnRzLmF0KC0xKSwgMTApO1xuICBjb25zdCBsaW5lID0gcGFyc2VJbnQocGFydHMuYXQoLTIpLCAxMCk7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGFydHMuc2xpY2UoMCwgLTIpLmpvaW4oJzonKTtcblxuICBpZiAoIWZpbGVQYXRoIHx8IGlzTmFOKGxpbmUpIHx8IGlzTmFOKGNvbHVtbikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7IGZpbGVQYXRoLCBsaW5lLCBjb2x1bW4gfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tUYWdOYW1lRWRpdGFibGUob3BlbmluZ0VsZW1lbnROb2RlLCBlZGl0YWJsZVRhZ3NMaXN0KSB7XG4gICAgaWYgKCFvcGVuaW5nRWxlbWVudE5vZGUgfHwgIW9wZW5pbmdFbGVtZW50Tm9kZS5uYW1lKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbmFtZU5vZGUgPSBvcGVuaW5nRWxlbWVudE5vZGUubmFtZTtcblxuICAgIC8vIENoZWNrIDE6IERpcmVjdCBuYW1lIChmb3IgPHA+LCA8QnV0dG9uPilcbiAgICBpZiAobmFtZU5vZGUudHlwZSA9PT0gJ0pTWElkZW50aWZpZXInICYmIGVkaXRhYmxlVGFnc0xpc3QuaW5jbHVkZXMobmFtZU5vZGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgMjogUHJvcGVydHkgbmFtZSBvZiBhIG1lbWJlciBleHByZXNzaW9uIChmb3IgPG1vdGlvbi5oMT4sIGNoZWNrIGlmIFwiaDFcIiBpcyBpbiBlZGl0YWJsZVRhZ3NMaXN0KVxuICAgIGlmIChuYW1lTm9kZS50eXBlID09PSAnSlNYTWVtYmVyRXhwcmVzc2lvbicgJiYgbmFtZU5vZGUucHJvcGVydHkgJiYgbmFtZU5vZGUucHJvcGVydHkudHlwZSA9PT0gJ0pTWElkZW50aWZpZXInICYmIGVkaXRhYmxlVGFnc0xpc3QuaW5jbHVkZXMobmFtZU5vZGUucHJvcGVydHkubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUltYWdlU3JjKG9wZW5pbmdOb2RlKSB7XG4gICAgaWYgKCFvcGVuaW5nTm9kZSB8fCAhb3BlbmluZ05vZGUubmFtZSB8fCBvcGVuaW5nTm9kZS5uYW1lLm5hbWUgIT09ICdpbWcnKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IHRydWUsIHJlYXNvbjogbnVsbCB9OyAvLyBOb3QgYW4gaW1hZ2UsIHNraXAgdmFsaWRhdGlvblxuICAgIH1cblxuICAgIGNvbnN0IGhhc1Byb3BzU3ByZWFkID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5zb21lKGF0dHIgPT5cbiAgICAgICAgdC5pc0pTWFNwcmVhZEF0dHJpYnV0ZShhdHRyKSAmJlxuICAgICAgICBhdHRyLmFyZ3VtZW50ICYmXG4gICAgICAgIHQuaXNJZGVudGlmaWVyKGF0dHIuYXJndW1lbnQpICYmXG4gICAgICAgIGF0dHIuYXJndW1lbnQubmFtZSA9PT0gJ3Byb3BzJ1xuICAgICk7XG5cbiAgICBpZiAoaGFzUHJvcHNTcHJlYWQpIHtcbiAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ3Byb3BzLXNwcmVhZCcgfTtcbiAgICB9XG5cbiAgICBjb25zdCBzcmNBdHRyID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5maW5kKGF0dHIgPT5cbiAgICAgICAgdC5pc0pTWEF0dHJpYnV0ZShhdHRyKSAmJlxuICAgICAgICBhdHRyLm5hbWUgJiZcbiAgICAgICAgYXR0ci5uYW1lLm5hbWUgPT09ICdzcmMnXG4gICAgKTtcblxuICAgIGlmICghc3JjQXR0cikge1xuICAgICAgICByZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1zcmMnIH07XG4gICAgfVxuXG4gICAgaWYgKCF0LmlzU3RyaW5nTGl0ZXJhbChzcmNBdHRyLnZhbHVlKSkge1xuICAgICAgICByZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgcmVhc29uOiAnZHluYW1pYy1zcmMnIH07XG4gICAgfVxuXG4gICAgaWYgKCFzcmNBdHRyLnZhbHVlLnZhbHVlIHx8IHNyY0F0dHIudmFsdWUudmFsdWUudHJpbSgpID09PSAnJykge1xuICAgICAgICByZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgcmVhc29uOiAnZW1wdHktc3JjJyB9O1xuICAgIH1cblxuICAgIHJldHVybiB7IGlzVmFsaWQ6IHRydWUsIHJlYXNvbjogbnVsbCB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbmxpbmVFZGl0UGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2aXRlLWlubGluZS1lZGl0LXBsdWdpbicsXG4gICAgZW5mb3JjZTogJ3ByZScsXG5cbiAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgIGlmICghL1xcLihqc3h8dHN4KSQvLnRlc3QoaWQpIHx8ICFpZC5zdGFydHNXaXRoKFZJVEVfUFJPSkVDVF9ST09UKSB8fCBpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSBwYXRoLnJlbGF0aXZlKFZJVEVfUFJPSkVDVF9ST09ULCBpZCk7XG4gICAgICBjb25zdCB3ZWJSZWxhdGl2ZUZpbGVQYXRoID0gcmVsYXRpdmVGaWxlUGF0aC5zcGxpdChwYXRoLnNlcCkuam9pbignLycpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBiYWJlbEFzdCA9IHBhcnNlKGNvZGUsIHtcbiAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICBwbHVnaW5zOiBbJ2pzeCcsICd0eXBlc2NyaXB0J10sXG4gICAgICAgICAgZXJyb3JSZWNvdmVyeTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgYXR0cmlidXRlc0FkZGVkID0gMDtcblxuICAgICAgICB0cmF2ZXJzZUJhYmVsLmRlZmF1bHQoYmFiZWxBc3QsIHtcbiAgICAgICAgICBlbnRlcihwYXRoKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5pc0pTWE9wZW5pbmdFbGVtZW50KCkpIHtcbiAgICAgICAgICAgICAgY29uc3Qgb3BlbmluZ05vZGUgPSBwYXRoLm5vZGU7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlID0gcGF0aC5wYXJlbnRQYXRoLm5vZGU7IC8vIFRoZSBKU1hFbGVtZW50IGl0c2VsZlxuXG4gICAgICAgICAgICAgIGlmICghb3BlbmluZ05vZGUubG9jKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgYWxyZWFkeUhhc0lkID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5zb21lKFxuICAgICAgICAgICAgICAgIChhdHRyKSA9PiB0LmlzSlNYQXR0cmlidXRlKGF0dHIpICYmIGF0dHIubmFtZS5uYW1lID09PSAnZGF0YS1lZGl0LWlkJ1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGlmIChhbHJlYWR5SGFzSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDb25kaXRpb24gMTogSXMgdGhlIGN1cnJlbnQgZWxlbWVudCB0YWcgdHlwZSBlZGl0YWJsZT9cbiAgICAgICAgICAgICAgY29uc3QgaXNDdXJyZW50RWxlbWVudEVkaXRhYmxlID0gY2hlY2tUYWdOYW1lRWRpdGFibGUob3BlbmluZ05vZGUsIEVESVRBQkxFX0hUTUxfVEFHUyk7XG4gICAgICAgICAgICAgIGlmICghaXNDdXJyZW50RWxlbWVudEVkaXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VWYWxpZGF0aW9uID0gdmFsaWRhdGVJbWFnZVNyYyhvcGVuaW5nTm9kZSk7XG4gICAgICAgICAgICAgIGlmICghaW1hZ2VWYWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlZEF0dHJpYnV0ZSA9IHQuanN4QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgdC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtZGlzYWJsZWQnKSxcbiAgICAgICAgICAgICAgICAgIHQuc3RyaW5nTGl0ZXJhbCgndHJ1ZScpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnB1c2goZGlzYWJsZWRBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNBZGRlZCsrO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGxldCBzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgIC8vIENvbmRpdGlvbiAyOiBEb2VzIHRoZSBlbGVtZW50IGhhdmUgZHluYW1pYyBvciBlZGl0YWJsZSBjaGlsZHJlblxuICAgICAgICAgICAgICBpZiAodC5pc0pTWEVsZW1lbnQoZWxlbWVudE5vZGUpICYmIGVsZW1lbnROb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZWxlbWVudCBoYXMgey4uLnByb3BzfSBzcHJlYWQgYXR0cmlidXRlIC0gZGlzYWJsZSBlZGl0aW5nIGlmIGl0IGRvZXNcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNQcm9wc1NwcmVhZCA9IG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMuc29tZShhdHRyID0+IHQuaXNKU1hTcHJlYWRBdHRyaWJ1dGUoYXR0cilcbiAgICAgICAgICAgICAgICAmJiBhdHRyLmFyZ3VtZW50XG4gICAgICAgICAgICAgICAgJiYgdC5pc0lkZW50aWZpZXIoYXR0ci5hcmd1bWVudClcbiAgICAgICAgICAgICAgICAmJiBhdHRyLmFyZ3VtZW50Lm5hbWUgPT09ICdwcm9wcydcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzRHluYW1pY0NoaWxkID0gZWxlbWVudE5vZGUuY2hpbGRyZW4uc29tZShjaGlsZCA9PlxuICAgICAgICAgICAgICAgICAgdC5pc0pTWEV4cHJlc3Npb25Db250YWluZXIoY2hpbGQpXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNEeW5hbWljQ2hpbGQgfHwgaGFzUHJvcHNTcHJlYWQpIHtcbiAgICAgICAgICAgICAgICAgIHNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIXNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuICYmIHQuaXNKU1hFbGVtZW50KGVsZW1lbnROb2RlKSAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc0VkaXRhYmxlSnN4Q2hpbGQgPSBlbGVtZW50Tm9kZS5jaGlsZHJlbi5zb21lKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICh0LmlzSlNYRWxlbWVudChjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoZWNrVGFnTmFtZUVkaXRhYmxlKGNoaWxkLm9wZW5pbmdFbGVtZW50LCBFRElUQUJMRV9IVE1MX1RBR1MpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzRWRpdGFibGVKc3hDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkQXR0cmlidXRlID0gdC5qc3hBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICB0LmpzeElkZW50aWZpZXIoJ2RhdGEtZWRpdC1kaXNhYmxlZCcpLFxuICAgICAgICAgICAgICAgICAgdC5zdHJpbmdMaXRlcmFsKCd0cnVlJylcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgb3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGRpc2FibGVkQXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzQWRkZWQrKztcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDb25kaXRpb24gMzogUGFyZW50IGlzIG5vbi1lZGl0YWJsZSBpZiBBVCBMRUFTVCBPTkUgY2hpbGQgSlNYRWxlbWVudCBpcyBhIG5vbi1lZGl0YWJsZSB0eXBlLlxuICAgICAgICAgICAgICBpZiAodC5pc0pTWEVsZW1lbnQoZWxlbWVudE5vZGUpICYmIGVsZW1lbnROb2RlLmNoaWxkcmVuICYmIGVsZW1lbnROb2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGxldCBoYXNOb25FZGl0YWJsZUpzeENoaWxkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVsZW1lbnROb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHQuaXNKU1hFbGVtZW50KGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrVGFnTmFtZUVkaXRhYmxlKGNoaWxkLm9wZW5pbmdFbGVtZW50LCBFRElUQUJMRV9IVE1MX1RBR1MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNOb25FZGl0YWJsZUpzeENoaWxkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKGhhc05vbkVkaXRhYmxlSnN4Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlZEF0dHJpYnV0ZSA9IHQuanN4QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgdC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtZGlzYWJsZWQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuc3RyaW5nTGl0ZXJhbChcInRydWVcIilcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChkaXNhYmxlZEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlc0FkZGVkKys7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ29uZGl0aW9uIDQ6IElzIGFueSBhbmNlc3RvciBKU1hFbGVtZW50IGFsc28gZWRpdGFibGU/XG4gICAgICAgICAgICAgIGxldCBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoID0gcGF0aC5wYXJlbnRQYXRoLnBhcmVudFBhdGg7XG4gICAgICAgICAgICAgIHdoaWxlIChjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhbmNlc3RvckpzeEVsZW1lbnRQYXRoID0gY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aC5pc0pTWEVsZW1lbnQoKVxuICAgICAgICAgICAgICAgICAgICAgID8gY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aFxuICAgICAgICAgICAgICAgICAgICAgIDogY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aC5maW5kUGFyZW50KHAgPT4gcC5pc0pTWEVsZW1lbnQoKSk7XG5cbiAgICAgICAgICAgICAgICAgIGlmICghYW5jZXN0b3JKc3hFbGVtZW50UGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAoY2hlY2tUYWdOYW1lRWRpdGFibGUoYW5jZXN0b3JKc3hFbGVtZW50UGF0aC5ub2RlLm9wZW5pbmdFbGVtZW50LCBFRElUQUJMRV9IVE1MX1RBR1MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aCA9IGFuY2VzdG9ySnN4RWxlbWVudFBhdGgucGFyZW50UGF0aDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBvcGVuaW5nTm9kZS5sb2Muc3RhcnQubGluZTtcbiAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0gb3BlbmluZ05vZGUubG9jLnN0YXJ0LmNvbHVtbiArIDE7XG4gICAgICAgICAgICAgIGNvbnN0IGVkaXRJZCA9IGAke3dlYlJlbGF0aXZlRmlsZVBhdGh9OiR7bGluZX06JHtjb2x1bW59YDtcblxuICAgICAgICAgICAgICBjb25zdCBpZEF0dHJpYnV0ZSA9IHQuanN4QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgIHQuanN4SWRlbnRpZmllcignZGF0YS1lZGl0LWlkJyksXG4gICAgICAgICAgICAgICAgdC5zdHJpbmdMaXRlcmFsKGVkaXRJZClcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnB1c2goaWRBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICBhdHRyaWJ1dGVzQWRkZWQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChhdHRyaWJ1dGVzQWRkZWQgPiAwKSB7XG4gICAgICAgICAgY29uc3QgZ2VuZXJhdGVGdW5jdGlvbiA9IGdlbmVyYXRlLmRlZmF1bHQgfHwgZ2VuZXJhdGU7XG4gICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZ2VuZXJhdGVGdW5jdGlvbihiYWJlbEFzdCwge1xuICAgICAgICAgICAgc291cmNlTWFwczogdHJ1ZSxcbiAgICAgICAgICAgIHNvdXJjZUZpbGVOYW1lOiB3ZWJSZWxhdGl2ZUZpbGVQYXRoXG4gICAgICAgICAgfSwgY29kZSk7XG5cbiAgICAgICAgICByZXR1cm4geyBjb2RlOiBvdXRwdXQuY29kZSwgbWFwOiBvdXRwdXQubWFwIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFt2aXRlXVt2aXN1YWwtZWRpdG9yXSBFcnJvciB0cmFuc2Zvcm1pbmcgJHtpZH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvLyBVcGRhdGVzIHNvdXJjZSBjb2RlIGJhc2VkIG9uIHRoZSBjaGFuZ2VzIHJlY2VpdmVkIGZyb20gdGhlIGNsaWVudFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXBwbHktZWRpdCcsIGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuay50b1N0cmluZygpOyB9KTtcblxuICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBsZXQgYWJzb2x1dGVGaWxlUGF0aCA9ICcnO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGVkaXRJZCwgbmV3RnVsbFRleHQgfSA9IEpTT04ucGFyc2UoYm9keSk7XG5cbiAgICAgICAgICAgIGlmICghZWRpdElkIHx8IHR5cGVvZiBuZXdGdWxsVGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3NpbmcgZWRpdElkIG9yIG5ld0Z1bGxUZXh0JyB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZElkID0gcGFyc2VFZGl0SWQoZWRpdElkKTtcbiAgICAgICAgICAgIGlmICghcGFyc2VkSWQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludmFsaWQgZWRpdElkIGZvcm1hdCAoZmlsZVBhdGg6bGluZTpjb2x1bW4pJyB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZmlsZVBhdGgsIGxpbmUsIGNvbHVtbiB9ID0gcGFyc2VkSWQ7XG5cbiAgICAgICAgICAgIGFic29sdXRlRmlsZVBhdGggPSBwYXRoLnJlc29sdmUoVklURV9QUk9KRUNUX1JPT1QsIGZpbGVQYXRoKTtcbiAgICAgICAgICAgIGlmIChmaWxlUGF0aC5pbmNsdWRlcygnLi4nKSB8fCAhYWJzb2x1dGVGaWxlUGF0aC5zdGFydHNXaXRoKFZJVEVfUFJPSkVDVF9ST09UKSB8fCBhYnNvbHV0ZUZpbGVQYXRoLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBwYXRoJyB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhhYnNvbHV0ZUZpbGVQYXRoLCAndXRmLTgnKTtcblxuICAgICAgICAgICAgY29uc3QgYmFiZWxBc3QgPSBwYXJzZShvcmlnaW5hbENvbnRlbnQsIHtcbiAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZScsXG4gICAgICAgICAgICAgIHBsdWdpbnM6IFsnanN4JywgJ3R5cGVzY3JpcHQnXSxcbiAgICAgICAgICAgICAgZXJyb3JSZWNvdmVyeTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCB0YXJnZXROb2RlUGF0aCA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCB2aXNpdG9yID0ge1xuICAgICAgICAgICAgICBKU1hPcGVuaW5nRWxlbWVudChwYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5sb2MgJiYgbm9kZS5sb2Muc3RhcnQubGluZSA9PT0gbGluZSAmJiBub2RlLmxvYy5zdGFydC5jb2x1bW4gKyAxID09PSBjb2x1bW4pIHtcbiAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGVQYXRoID0gcGF0aDtcbiAgICAgICAgICAgICAgICAgIHBhdGguc3RvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRyYXZlcnNlQmFiZWwuZGVmYXVsdChiYWJlbEFzdCwgdmlzaXRvcik7XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0Tm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1RhcmdldCBub2RlIG5vdCBmb3VuZCBieSBsaW5lL2NvbHVtbicsIGVkaXRJZCB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRlRnVuY3Rpb24gPSBnZW5lcmF0ZS5kZWZhdWx0IHx8IGdlbmVyYXRlO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0T3BlbmluZ0VsZW1lbnQgPSB0YXJnZXROb2RlUGF0aC5ub2RlO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50RWxlbWVudE5vZGUgPSB0YXJnZXROb2RlUGF0aC5wYXJlbnRQYXRoPy5ub2RlO1xuXG4gICAgICAgICAgICBjb25zdCBpc0ltYWdlRWxlbWVudCA9IHRhcmdldE9wZW5pbmdFbGVtZW50Lm5hbWUgJiYgdGFyZ2V0T3BlbmluZ0VsZW1lbnQubmFtZS5uYW1lID09PSAnaW1nJztcblxuICAgICAgICAgICAgbGV0IGJlZm9yZUNvZGUgPSAnJztcbiAgICAgICAgICAgIGxldCBhZnRlckNvZGUgPSAnJztcbiAgICAgICAgICAgIGxldCBtb2RpZmllZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoaXNJbWFnZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgLy8gSGFuZGxlIGltYWdlIHNyYyBhdHRyaWJ1dGUgdXBkYXRlXG4gICAgICAgICAgICAgIGNvbnN0IGJlZm9yZU91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24odGFyZ2V0T3BlbmluZ0VsZW1lbnQsIHt9KTtcbiAgICAgICAgICAgICAgYmVmb3JlQ29kZSA9IGJlZm9yZU91dHB1dC5jb2RlO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHNyY0F0dHIgPSB0YXJnZXRPcGVuaW5nRWxlbWVudC5hdHRyaWJ1dGVzLmZpbmQoYXR0ciA9PlxuICAgICAgICAgICAgICAgIHQuaXNKU1hBdHRyaWJ1dGUoYXR0cikgJiYgYXR0ci5uYW1lICYmIGF0dHIubmFtZS5uYW1lID09PSAnc3JjJ1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGlmIChzcmNBdHRyICYmIHQuaXNTdHJpbmdMaXRlcmFsKHNyY0F0dHIudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgc3JjQXR0ci52YWx1ZSA9IHQuc3RyaW5nTGl0ZXJhbChuZXdGdWxsVGV4dCk7XG4gICAgICAgICAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXJPdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKHRhcmdldE9wZW5pbmdFbGVtZW50LCB7fSk7XG4gICAgICAgICAgICAgICAgYWZ0ZXJDb2RlID0gYWZ0ZXJPdXRwdXQuY29kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHBhcmVudEVsZW1lbnROb2RlICYmIHQuaXNKU1hFbGVtZW50KHBhcmVudEVsZW1lbnROb2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZU91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24ocGFyZW50RWxlbWVudE5vZGUsIHt9KTtcbiAgICAgICAgICAgICAgICBiZWZvcmVDb2RlID0gYmVmb3JlT3V0cHV0LmNvZGU7XG5cbiAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50Tm9kZS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChuZXdGdWxsVGV4dCAmJiBuZXdGdWxsVGV4dC50cmltKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBuZXdUZXh0Tm9kZSA9IHQuanN4VGV4dChuZXdGdWxsVGV4dCk7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50Tm9kZS5jaGlsZHJlbi5wdXNoKG5ld1RleHROb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXJPdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKHBhcmVudEVsZW1lbnROb2RlLCB7fSk7XG4gICAgICAgICAgICAgICAgYWZ0ZXJDb2RlID0gYWZ0ZXJPdXRwdXQuY29kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW1vZGlmaWVkKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA5LCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdDb3VsZCBub3QgYXBwbHkgY2hhbmdlcyB0byBBU1QuJyB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24oYmFiZWxBc3QsIHt9KTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0NvbnRlbnQgPSBvdXRwdXQuY29kZTtcblxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbmV3RmlsZUNvbnRlbnQ6IG5ld0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgYmVmb3JlQ29kZSxcbiAgICAgICAgICAgICAgICBhZnRlckNvZGUsXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBkdXJpbmcgZWRpdCBhcHBsaWNhdGlvbi4nIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGVub3ZvXFxcXERlc2t0b3BcXFxccHJveWVjdG9zIGRlc3BsZWdhZG9zIGltcG9ydGFudGVcXFxcZ2F5IGNoYXRcXFxccGx1Z2luc1xcXFx2aXN1YWwtZWRpdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxwcm95ZWN0b3MgZGVzcGxlZ2Fkb3MgaW1wb3J0YW50ZVxcXFxnYXkgY2hhdFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdml0ZS1wbHVnaW4tZWRpdC1tb2RlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9MZW5vdm8vRGVza3RvcC9wcm95ZWN0b3MlMjBkZXNwbGVnYWRvcyUyMGltcG9ydGFudGUvZ2F5JTIwY2hhdC9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tZWRpdC1tb2RlLmpzXCI7aW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBFRElUX01PREVfU1RZTEVTLCBQT1BVUF9TVFlMRVMgfSBmcm9tICcuL3Zpc3VhbC1lZGl0b3ItY29uZmlnJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHJlc29sdmUoX19maWxlbmFtZSwgJy4uJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlubGluZUVkaXREZXZQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGU6aW5saW5lLWVkaXQtZGV2JyxcbiAgICBhcHBseTogJ3NlcnZlJyxcbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoKSB7XG4gICAgICBjb25zdCBzY3JpcHRQYXRoID0gcmVzb2x2ZShfX2Rpcm5hbWUsICdlZGl0LW1vZGUtc2NyaXB0LmpzJyk7XG4gICAgICBsZXQgc2NyaXB0Q29udGVudCA9IHJlYWRGaWxlU3luYyhzY3JpcHRQYXRoLCAndXRmLTgnKTtcbiAgICAgIFxuICAgICAgLy8gUmVlbXBsYXphciBlbCBpbXBvcnQgcG9yIGVsIGNvbnRlbmlkbyBkaXJlY3RvXG4gICAgICBzY3JpcHRDb250ZW50ID0gc2NyaXB0Q29udGVudC5yZXBsYWNlKFxuICAgICAgICBcImltcG9ydCB7IFBPUFVQX1NUWUxFUyB9IGZyb20gJy4vdmlzdWFsLWVkaXRvci1jb25maWcuanMnO1wiLFxuICAgICAgICBgY29uc3QgUE9QVVBfU1RZTEVTID0gJHtKU09OLnN0cmluZ2lmeShQT1BVUF9TVFlMRVMpfTtgXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgdGFnOiAnc2NyaXB0JyxcbiAgICAgICAgICBhdHRyczogeyB0eXBlOiAnbW9kdWxlJyB9LFxuICAgICAgICAgIGNoaWxkcmVuOiBzY3JpcHRDb250ZW50LFxuICAgICAgICAgIGluamVjdFRvOiAnYm9keSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRhZzogJ3N0eWxlJyxcbiAgICAgICAgICBjaGlsZHJlbjogRURJVF9NT0RFX1NUWUxFUyxcbiAgICAgICAgICBpbmplY3RUbzogJ2hlYWQnXG4gICAgICAgIH1cbiAgICAgIF07XG4gICAgfVxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxwcm95ZWN0b3MgZGVzcGxlZ2Fkb3MgaW1wb3J0YW50ZVxcXFxnYXkgY2hhdFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlbm92b1xcXFxEZXNrdG9wXFxcXHByb3llY3RvcyBkZXNwbGVnYWRvcyBpbXBvcnRhbnRlXFxcXGdheSBjaGF0XFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclxcXFx2aXN1YWwtZWRpdG9yLWNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGVub3ZvL0Rlc2t0b3AvcHJveWVjdG9zJTIwZGVzcGxlZ2Fkb3MlMjBpbXBvcnRhbnRlL2dheSUyMGNoYXQvcGx1Z2lucy92aXN1YWwtZWRpdG9yL3Zpc3VhbC1lZGl0b3ItY29uZmlnLmpzXCI7ZXhwb3J0IGNvbnN0IFBPUFVQX1NUWUxFUyA9IGBcbiNpbmxpbmUtZWRpdG9yLXBvcHVwIHtcbiAgd2lkdGg6IDM2MHB4O1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHotaW5kZXg6IDEwMDAwO1xuICBiYWNrZ3JvdW5kOiAjMTYxNzE4O1xuICBjb2xvcjogd2hpdGU7XG4gIGJvcmRlcjogMXB4IHNvbGlkICM0YTU1Njg7XG4gIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gIHBhZGRpbmc6IDhweDtcbiAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDAsMCwwLDAuMik7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogMTBweDtcbiAgZGlzcGxheTogbm9uZTtcbn1cblxuQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG4gICNpbmxpbmUtZWRpdG9yLXBvcHVwIHtcbiAgICB3aWR0aDogY2FsYygxMDAlIC0gMjBweCk7XG4gIH1cbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAuaXMtYWN0aXZlIHtcbiAgZGlzcGxheTogZmxleDtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwLmlzLWRpc2FibGVkLXZpZXcge1xuICBwYWRkaW5nOiAxMHB4IDE1cHg7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIHRleHRhcmVhIHtcbiAgaGVpZ2h0OiAxMDBweDtcbiAgcGFkZGluZzogNHB4IDhweDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gIGZvbnQtc2l6ZTogMC44NzVyZW07XG4gIGxpbmUtaGVpZ2h0OiAxLjQyO1xuICByZXNpemU6IG5vbmU7XG4gIG91dGxpbmU6IG5vbmU7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5idXR0b24tY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgZ2FwOiAxMHB4O1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAucG9wdXAtYnV0dG9uIHtcbiAgYm9yZGVyOiBub25lO1xuICBwYWRkaW5nOiA2cHggMTZweDtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgaGVpZ2h0OiAzNHB4O1xuICBvdXRsaW5lOiBub25lO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAuc2F2ZS1idXR0b24ge1xuICBiYWNrZ3JvdW5kOiAjNjczZGU2O1xuICBjb2xvcjogd2hpdGU7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5jYW5jZWwtYnV0dG9uIHtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGJvcmRlcjogMXB4IHNvbGlkICMzYjNkNGE7XG4gIGNvbG9yOiB3aGl0ZTtcblxuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiM0NzQ5NTg7XG4gIH1cbn1cbmA7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3B1cEhUTUxUZW1wbGF0ZShzYXZlTGFiZWwsIGNhbmNlbExhYmVsKSB7XG4gIHJldHVybiBgXG4gICAgPHRleHRhcmVhPjwvdGV4dGFyZWE+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1jb250YWluZXJcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJwb3B1cC1idXR0b24gY2FuY2VsLWJ1dHRvblwiPiR7Y2FuY2VsTGFiZWx9PC9idXR0b24+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwicG9wdXAtYnV0dG9uIHNhdmUtYnV0dG9uXCI+JHtzYXZlTGFiZWx9PC9idXR0b24+XG4gICAgPC9kaXY+XG4gIGA7XG59O1xuXG5leHBvcnQgY29uc3QgRURJVF9NT0RFX1NUWUxFUyA9IGBcbiAgI3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0gW2RhdGEtZWRpdC1pZF0ge1xuICAgIGN1cnNvcjogcG9pbnRlcjsgXG4gICAgb3V0bGluZTogMnB4IGRhc2hlZCAjMzU3REY5OyBcbiAgICBvdXRsaW5lLW9mZnNldDogMnB4O1xuICAgIG1pbi1oZWlnaHQ6IDFlbTtcbiAgfVxuICAjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSBpbWdbZGF0YS1lZGl0LWlkXSB7XG4gICAgb3V0bGluZS1vZmZzZXQ6IC0ycHg7XG4gIH1cbiAgI3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0ge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuICAjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSBbZGF0YS1lZGl0LWlkXTpob3ZlciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzM1N0RGOTMzO1xuICAgIG91dGxpbmUtY29sb3I6ICMzNTdERjk7IFxuICB9XG5cbiAgQGtleWZyYW1lcyBmYWRlSW5Ub29sdGlwIHtcbiAgICBmcm9tIHtcbiAgICAgIG9wYWNpdHk6IDA7XG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNXB4KTtcbiAgICB9XG4gICAgdG8ge1xuICAgICAgb3BhY2l0eTogMTtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcbiAgICB9XG4gIH1cblxuICAjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwIHtcbiAgICBkaXNwbGF5OiBub25lOyBcbiAgICBvcGFjaXR5OiAwOyBcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFEMUUyMDtcbiAgICBjb2xvcjogd2hpdGU7XG4gICAgcGFkZGluZzogNHB4IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgei1pbmRleDogMTAwMDE7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICMzQjNENEE7XG4gICAgbWF4LXdpZHRoOiAxODRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwLnRvb2x0aXAtYWN0aXZlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBhbmltYXRpb246IGZhZGVJblRvb2x0aXAgMC4ycyBlYXNlLW91dCBmb3J3YXJkcztcbiAgfVxuYDsiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlbm92b1xcXFxEZXNrdG9wXFxcXHByb3llY3RvcyBkZXNwbGVnYWRvcyBpbXBvcnRhbnRlXFxcXGdheSBjaGF0XFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlbm92b1xcXFxEZXNrdG9wXFxcXHByb3llY3RvcyBkZXNwbGVnYWRvcyBpbXBvcnRhbnRlXFxcXGdheSBjaGF0XFxcXHBsdWdpbnNcXFxcdml0ZS1wbHVnaW4taWZyYW1lLXJvdXRlLXJlc3RvcmF0aW9uLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9MZW5vdm8vRGVza3RvcC9wcm95ZWN0b3MlMjBkZXNwbGVnYWRvcyUyMGltcG9ydGFudGUvZ2F5JTIwY2hhdC9wbHVnaW5zL3ZpdGUtcGx1Z2luLWlmcmFtZS1yb3V0ZS1yZXN0b3JhdGlvbi5qc1wiO2V4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlmcmFtZVJvdXRlUmVzdG9yYXRpb25QbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGU6aWZyYW1lLXJvdXRlLXJlc3RvcmF0aW9uJyxcbiAgICBhcHBseTogJ3NlcnZlJyxcbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoKSB7XG4gICAgICBjb25zdCBzY3JpcHQgPSBgXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgcGFnZSBpcyBpbiBhbiBpZnJhbWVcbiAgICAgICAgaWYgKHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wKSB7XG4gICAgICAgICAgY29uc3QgU1RPUkFHRV9LRVkgPSAnaG9yaXpvbnMtaWZyYW1lLXNhdmVkLXJvdXRlJztcblxuICAgICAgICAgIGNvbnN0IGdldEN1cnJlbnRSb3V0ZSA9ICgpID0+IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoICsgbG9jYXRpb24uaGFzaDtcblxuICAgICAgICAgIGNvbnN0IHNhdmUgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Um91dGUgPSBnZXRDdXJyZW50Um91dGUoKTtcbiAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTVE9SQUdFX0tFWSwgY3VycmVudFJvdXRlKTtcbiAgICAgICAgICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7bWVzc2FnZTogJ3JvdXRlLWNoYW5nZWQnLCByb3V0ZTogY3VycmVudFJvdXRlfSwgJyonKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgcmVwbGFjZUhpc3RvcnlTdGF0ZSA9ICh1cmwpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsICcnLCB1cmwpO1xuICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgUG9wU3RhdGVFdmVudCgncG9wc3RhdGUnLCB7IHN0YXRlOiBoaXN0b3J5LnN0YXRlIH0pKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IHJlc3RvcmUgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzYXZlZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oU1RPUkFHRV9LRVkpO1xuICAgICAgICAgICAgICBpZiAoIXNhdmVkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgaWYgKCFzYXZlZC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFNUT1JBR0VfS0VZKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gZ2V0Q3VycmVudFJvdXRlKCk7XG4gICAgICAgICAgICAgIGlmIChjdXJyZW50ICE9PSBzYXZlZCkge1xuICAgICAgICAgICAgICAgIGlmICghcmVwbGFjZUhpc3RvcnlTdGF0ZShzYXZlZCkpIHtcbiAgICAgICAgICAgICAgICAgIHJlcGxhY2VIaXN0b3J5U3RhdGUoJy8nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gKGRvY3VtZW50LmJvZHk/LmlubmVyVGV4dCB8fCAnJykudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXN0b3JlZCByb3V0ZSByZXN1bHRzIGluIHRvbyBsaXR0bGUgY29udGVudCwgYXNzdW1lIGl0IGlzIGludmFsaWQgYW5kIG5hdmlnYXRlIGhvbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoIDwgNTApIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlSGlzdG9yeVN0YXRlKCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgICB9LCAxMDAwKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxQdXNoU3RhdGUgPSBoaXN0b3J5LnB1c2hTdGF0ZTtcbiAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsUHVzaFN0YXRlLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc2F2ZSgpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBvcmlnaW5hbFJlcGxhY2VTdGF0ZSA9IGhpc3RvcnkucmVwbGFjZVN0YXRlO1xuICAgICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgICAgICAgb3JpZ2luYWxSZXBsYWNlU3RhdGUuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHNhdmUpO1xuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgc2F2ZSk7XG5cbiAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgIH1cbiAgICAgIGA7XG5cbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0YWc6ICdzY3JpcHQnLFxuICAgICAgICAgIGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG4gICAgICAgICAgY2hpbGRyZW46IHNjcmlwdCxcbiAgICAgICAgICBpbmplY3RUbzogJ2hlYWQnXG4gICAgICAgIH1cbiAgICAgIF07XG4gICAgfVxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxwcm95ZWN0b3MgZGVzcGxlZ2Fkb3MgaW1wb3J0YW50ZVxcXFxnYXkgY2hhdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGVub3ZvXFxcXERlc2t0b3BcXFxccHJveWVjdG9zIGRlc3BsZWdhZG9zIGltcG9ydGFudGVcXFxcZ2F5IGNoYXRcXFxcdml0ZS1wbHVnaW4tZ2VuZXJhdGUtdmVyc2lvbi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGVub3ZvL0Rlc2t0b3AvcHJveWVjdG9zJTIwZGVzcGxlZ2Fkb3MlMjBpbXBvcnRhbnRlL2dheSUyMGNoYXQvdml0ZS1wbHVnaW4tZ2VuZXJhdGUtdmVyc2lvbi5qc1wiOy8qKlxyXG4gKiBQbHVnaW4gZGUgVml0ZSBwYXJhIGdlbmVyYXIgdmVyc2lvbi5qc29uIGFudGVzIGRlbCBidWlsZFxyXG4gKi9cclxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IHsgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdlbmVyYXRlVmVyc2lvblBsdWdpbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2dlbmVyYXRlLXZlcnNpb24nLFxyXG4gICAgYnVpbGRTdGFydCgpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGxldCBnaXRIYXNoID0gJ3Vua25vd24nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBnaXRIYXNoID0gZXhlY1N5bmMoJ2dpdCByZXYtcGFyc2UgLS1zaG9ydCBIRUFEJywgeyBlbmNvZGluZzogJ3V0Zi04JyB9KS50cmltKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIC8vIFNpIGdpdCBubyBlc3RcdTAwRTEgZGlzcG9uaWJsZSwgdXNhciBzb2xvIHRpbWVzdGFtcFxyXG4gICAgICAgICAgY29uc29sZS53YXJuKCdcdTI2QTBcdUZFMEYgR2l0IG5vIGRpc3BvbmlibGUsIHVzYW5kbyBzb2xvIHRpbWVzdGFtcCBwYXJhIHZlcnNpXHUwMEYzbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IHtcclxuICAgICAgICAgIHZlcnNpb246IGAke3RpbWVzdGFtcH0tJHtnaXRIYXNofWAsXHJcbiAgICAgICAgICB0aW1lc3RhbXAsXHJcbiAgICAgICAgICBnaXRIYXNoLFxyXG4gICAgICAgICAgYnVpbGREYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBFc2NyaWJpciB2ZXJzaW9uLmpzb24gZW4gbGEgY2FycGV0YSBwdWJsaWNcclxuICAgICAgICB3cml0ZUZpbGVTeW5jKFxyXG4gICAgICAgICAgJy4vcHVibGljL3ZlcnNpb24uanNvbicsXHJcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2ZXJzaW9uLCBudWxsLCAyKSxcclxuICAgICAgICAgICd1dGYtOCdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnXHUyNzA1IFtWRVJTSU9OXSBWZXJzaVx1MDBGM24gZ2VuZXJhZGE6JywgdmVyc2lvbi52ZXJzaW9uKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgW1ZFUlNJT05dIEVycm9yIGdlbmVyYW5kbyB2ZXJzaVx1MDBGM246JywgZXJyb3IpO1xyXG4gICAgICAgIC8vIE5vIGZhbGxhciBlbCBidWlsZCBzaSBoYXkgZXJyb3JcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1WSxPQUFPQSxXQUFVO0FBQ3haLE9BQU8sV0FBVztBQUNsQixTQUFTLGNBQWMsb0JBQW9COzs7QUNGMGMsT0FBTyxVQUFVO0FBQ3RnQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGFBQWE7QUFDdEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxjQUFjO0FBQ3JCLFlBQVksT0FBTztBQUNuQixPQUFPLFFBQVE7QUFOMFMsSUFBTSwyQ0FBMkM7QUFRMVcsSUFBTSxhQUFhLGNBQWMsd0NBQWU7QUFDaEQsSUFBTUMsYUFBWSxLQUFLLFFBQVEsVUFBVTtBQUN6QyxJQUFNLG9CQUFvQixLQUFLLFFBQVFBLFlBQVcsT0FBTztBQUN6RCxJQUFNLHFCQUFxQixDQUFDLEtBQUssVUFBVSxVQUFVLEtBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxTQUFTLFNBQVMsS0FBSztBQUU3SCxTQUFTLFlBQVksUUFBUTtBQUMzQixRQUFNLFFBQVEsT0FBTyxNQUFNLEdBQUc7QUFFOUIsTUFBSSxNQUFNLFNBQVMsR0FBRztBQUNwQixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sU0FBUyxTQUFTLE1BQU0sR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN4QyxRQUFNLE9BQU8sU0FBUyxNQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDdEMsUUFBTSxXQUFXLE1BQU0sTUFBTSxHQUFHLEVBQUUsRUFBRSxLQUFLLEdBQUc7QUFFNUMsTUFBSSxDQUFDLFlBQVksTUFBTSxJQUFJLEtBQUssTUFBTSxNQUFNLEdBQUc7QUFDN0MsV0FBTztBQUFBLEVBQ1Q7QUFFQSxTQUFPLEVBQUUsVUFBVSxNQUFNLE9BQU87QUFDbEM7QUFFQSxTQUFTLHFCQUFxQixvQkFBb0Isa0JBQWtCO0FBQ2hFLE1BQUksQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUI7QUFBTSxXQUFPO0FBQzVELFFBQU0sV0FBVyxtQkFBbUI7QUFHcEMsTUFBSSxTQUFTLFNBQVMsbUJBQW1CLGlCQUFpQixTQUFTLFNBQVMsSUFBSSxHQUFHO0FBQy9FLFdBQU87QUFBQSxFQUNYO0FBR0EsTUFBSSxTQUFTLFNBQVMseUJBQXlCLFNBQVMsWUFBWSxTQUFTLFNBQVMsU0FBUyxtQkFBbUIsaUJBQWlCLFNBQVMsU0FBUyxTQUFTLElBQUksR0FBRztBQUNqSyxXQUFPO0FBQUEsRUFDWDtBQUVBLFNBQU87QUFDWDtBQUVBLFNBQVMsaUJBQWlCLGFBQWE7QUFDbkMsTUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLFFBQVEsWUFBWSxLQUFLLFNBQVMsT0FBTztBQUN0RSxXQUFPLEVBQUUsU0FBUyxNQUFNLFFBQVEsS0FBSztBQUFBLEVBQ3pDO0FBRUEsUUFBTSxpQkFBaUIsWUFBWSxXQUFXO0FBQUEsSUFBSyxVQUM3Qyx1QkFBcUIsSUFBSSxLQUMzQixLQUFLLFlBQ0gsZUFBYSxLQUFLLFFBQVEsS0FDNUIsS0FBSyxTQUFTLFNBQVM7QUFBQSxFQUMzQjtBQUVBLE1BQUksZ0JBQWdCO0FBQ2hCLFdBQU8sRUFBRSxTQUFTLE9BQU8sUUFBUSxlQUFlO0FBQUEsRUFDcEQ7QUFFQSxRQUFNLFVBQVUsWUFBWSxXQUFXO0FBQUEsSUFBSyxVQUN0QyxpQkFBZSxJQUFJLEtBQ3JCLEtBQUssUUFDTCxLQUFLLEtBQUssU0FBUztBQUFBLEVBQ3ZCO0FBRUEsTUFBSSxDQUFDLFNBQVM7QUFDVixXQUFPLEVBQUUsU0FBUyxPQUFPLFFBQVEsY0FBYztBQUFBLEVBQ25EO0FBRUEsTUFBSSxDQUFHLGtCQUFnQixRQUFRLEtBQUssR0FBRztBQUNuQyxXQUFPLEVBQUUsU0FBUyxPQUFPLFFBQVEsY0FBYztBQUFBLEVBQ25EO0FBRUEsTUFBSSxDQUFDLFFBQVEsTUFBTSxTQUFTLFFBQVEsTUFBTSxNQUFNLEtBQUssTUFBTSxJQUFJO0FBQzNELFdBQU8sRUFBRSxTQUFTLE9BQU8sUUFBUSxZQUFZO0FBQUEsRUFDakQ7QUFFQSxTQUFPLEVBQUUsU0FBUyxNQUFNLFFBQVEsS0FBSztBQUN6QztBQUVlLFNBQVIsbUJBQW9DO0FBQ3pDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxJQUVULFVBQVUsTUFBTSxJQUFJO0FBQ2xCLFVBQUksQ0FBQyxlQUFlLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxXQUFXLGlCQUFpQixLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDaEcsZUFBTztBQUFBLE1BQ1Q7QUFFQSxZQUFNLG1CQUFtQixLQUFLLFNBQVMsbUJBQW1CLEVBQUU7QUFDNUQsWUFBTSxzQkFBc0IsaUJBQWlCLE1BQU0sS0FBSyxHQUFHLEVBQUUsS0FBSyxHQUFHO0FBRXJFLFVBQUk7QUFDRixjQUFNLFdBQVcsTUFBTSxNQUFNO0FBQUEsVUFDM0IsWUFBWTtBQUFBLFVBQ1osU0FBUyxDQUFDLE9BQU8sWUFBWTtBQUFBLFVBQzdCLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBRUQsWUFBSSxrQkFBa0I7QUFFdEIsc0JBQWMsUUFBUSxVQUFVO0FBQUEsVUFDOUIsTUFBTUMsT0FBTTtBQUNWLGdCQUFJQSxNQUFLLG9CQUFvQixHQUFHO0FBQzlCLG9CQUFNLGNBQWNBLE1BQUs7QUFDekIsb0JBQU0sY0FBY0EsTUFBSyxXQUFXO0FBRXBDLGtCQUFJLENBQUMsWUFBWSxLQUFLO0FBQ3BCO0FBQUEsY0FDRjtBQUVBLG9CQUFNLGVBQWUsWUFBWSxXQUFXO0FBQUEsZ0JBQzFDLENBQUMsU0FBVyxpQkFBZSxJQUFJLEtBQUssS0FBSyxLQUFLLFNBQVM7QUFBQSxjQUN6RDtBQUVBLGtCQUFJLGNBQWM7QUFDaEI7QUFBQSxjQUNGO0FBR0Esb0JBQU0sMkJBQTJCLHFCQUFxQixhQUFhLGtCQUFrQjtBQUNyRixrQkFBSSxDQUFDLDBCQUEwQjtBQUM3QjtBQUFBLGNBQ0Y7QUFFQSxvQkFBTSxrQkFBa0IsaUJBQWlCLFdBQVc7QUFDcEQsa0JBQUksQ0FBQyxnQkFBZ0IsU0FBUztBQUM1QixzQkFBTSxvQkFBc0I7QUFBQSxrQkFDeEIsZ0JBQWMsb0JBQW9CO0FBQUEsa0JBQ2xDLGdCQUFjLE1BQU07QUFBQSxnQkFDeEI7QUFDQSw0QkFBWSxXQUFXLEtBQUssaUJBQWlCO0FBQzdDO0FBQ0E7QUFBQSxjQUNGO0FBRUEsa0JBQUksZ0NBQWdDO0FBR3BDLGtCQUFNLGVBQWEsV0FBVyxLQUFLLFlBQVksVUFBVTtBQUV2RCxzQkFBTSxpQkFBaUIsWUFBWSxXQUFXO0FBQUEsa0JBQUssVUFBVSx1QkFBcUIsSUFBSSxLQUNuRixLQUFLLFlBQ0gsZUFBYSxLQUFLLFFBQVEsS0FDNUIsS0FBSyxTQUFTLFNBQVM7QUFBQSxnQkFDMUI7QUFFQSxzQkFBTSxrQkFBa0IsWUFBWSxTQUFTO0FBQUEsa0JBQUssV0FDOUMsMkJBQXlCLEtBQUs7QUFBQSxnQkFDbEM7QUFFQSxvQkFBSSxtQkFBbUIsZ0JBQWdCO0FBQ3JDLGtEQUFnQztBQUFBLGdCQUNsQztBQUFBLGNBQ0Y7QUFFQSxrQkFBSSxDQUFDLGlDQUFtQyxlQUFhLFdBQVcsS0FBSyxZQUFZLFVBQVU7QUFDekYsc0JBQU0sc0JBQXNCLFlBQVksU0FBUyxLQUFLLFdBQVM7QUFDN0Qsc0JBQU0sZUFBYSxLQUFLLEdBQUc7QUFDekIsMkJBQU8scUJBQXFCLE1BQU0sZ0JBQWdCLGtCQUFrQjtBQUFBLGtCQUN0RTtBQUVBLHlCQUFPO0FBQUEsZ0JBQ1QsQ0FBQztBQUVELG9CQUFJLHFCQUFxQjtBQUN2QixrREFBZ0M7QUFBQSxnQkFDbEM7QUFBQSxjQUNGO0FBRUEsa0JBQUksK0JBQStCO0FBQ2pDLHNCQUFNLG9CQUFzQjtBQUFBLGtCQUN4QixnQkFBYyxvQkFBb0I7QUFBQSxrQkFDbEMsZ0JBQWMsTUFBTTtBQUFBLGdCQUN4QjtBQUVBLDRCQUFZLFdBQVcsS0FBSyxpQkFBaUI7QUFDN0M7QUFDQTtBQUFBLGNBQ0Y7QUFHQSxrQkFBTSxlQUFhLFdBQVcsS0FBSyxZQUFZLFlBQVksWUFBWSxTQUFTLFNBQVMsR0FBRztBQUN4RixvQkFBSSx5QkFBeUI7QUFDN0IsMkJBQVcsU0FBUyxZQUFZLFVBQVU7QUFDdEMsc0JBQU0sZUFBYSxLQUFLLEdBQUc7QUFDdkIsd0JBQUksQ0FBQyxxQkFBcUIsTUFBTSxnQkFBZ0Isa0JBQWtCLEdBQUc7QUFDakUsK0NBQXlCO0FBQ3pCO0FBQUEsb0JBQ0o7QUFBQSxrQkFDSjtBQUFBLGdCQUNKO0FBQ0Esb0JBQUksd0JBQXdCO0FBQ3hCLHdCQUFNLG9CQUFzQjtBQUFBLG9CQUN4QixnQkFBYyxvQkFBb0I7QUFBQSxvQkFDbEMsZ0JBQWMsTUFBTTtBQUFBLGtCQUN4QjtBQUNBLDhCQUFZLFdBQVcsS0FBSyxpQkFBaUI7QUFDN0M7QUFDQTtBQUFBLGdCQUNKO0FBQUEsY0FDSjtBQUdBLGtCQUFJLCtCQUErQkEsTUFBSyxXQUFXO0FBQ25ELHFCQUFPLDhCQUE4QjtBQUNqQyxzQkFBTSx5QkFBeUIsNkJBQTZCLGFBQWEsSUFDbkUsK0JBQ0EsNkJBQTZCLFdBQVcsT0FBSyxFQUFFLGFBQWEsQ0FBQztBQUVuRSxvQkFBSSxDQUFDLHdCQUF3QjtBQUN6QjtBQUFBLGdCQUNKO0FBRUEsb0JBQUkscUJBQXFCLHVCQUF1QixLQUFLLGdCQUFnQixrQkFBa0IsR0FBRztBQUN0RjtBQUFBLGdCQUNKO0FBQ0EsK0NBQStCLHVCQUF1QjtBQUFBLGNBQzFEO0FBRUEsb0JBQU0sT0FBTyxZQUFZLElBQUksTUFBTTtBQUNuQyxvQkFBTSxTQUFTLFlBQVksSUFBSSxNQUFNLFNBQVM7QUFDOUMsb0JBQU0sU0FBUyxHQUFHLG1CQUFtQixJQUFJLElBQUksSUFBSSxNQUFNO0FBRXZELG9CQUFNLGNBQWdCO0FBQUEsZ0JBQ2xCLGdCQUFjLGNBQWM7QUFBQSxnQkFDNUIsZ0JBQWMsTUFBTTtBQUFBLGNBQ3hCO0FBRUEsMEJBQVksV0FBVyxLQUFLLFdBQVc7QUFDdkM7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0YsQ0FBQztBQUVELFlBQUksa0JBQWtCLEdBQUc7QUFDdkIsZ0JBQU0sbUJBQW1CLFNBQVMsV0FBVztBQUM3QyxnQkFBTSxTQUFTLGlCQUFpQixVQUFVO0FBQUEsWUFDeEMsWUFBWTtBQUFBLFlBQ1osZ0JBQWdCO0FBQUEsVUFDbEIsR0FBRyxJQUFJO0FBRVAsaUJBQU8sRUFBRSxNQUFNLE9BQU8sTUFBTSxLQUFLLE9BQU8sSUFBSTtBQUFBLFFBQzlDO0FBRUEsZUFBTztBQUFBLE1BQ1QsU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSw0Q0FBNEMsRUFBRSxLQUFLLEtBQUs7QUFDdEUsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUlBLGdCQUFnQixRQUFRO0FBQ3RCLGFBQU8sWUFBWSxJQUFJLG1CQUFtQixPQUFPLEtBQUssS0FBSyxTQUFTO0FBQ2xFLFlBQUksSUFBSSxXQUFXO0FBQVEsaUJBQU8sS0FBSztBQUV2QyxZQUFJLE9BQU87QUFDWCxZQUFJLEdBQUcsUUFBUSxXQUFTO0FBQUUsa0JBQVEsTUFBTSxTQUFTO0FBQUEsUUFBRyxDQUFDO0FBRXJELFlBQUksR0FBRyxPQUFPLFlBQVk7QUEzUWxDO0FBNFFVLGNBQUksbUJBQW1CO0FBQ3ZCLGNBQUk7QUFDRixrQkFBTSxFQUFFLFFBQVEsWUFBWSxJQUFJLEtBQUssTUFBTSxJQUFJO0FBRS9DLGdCQUFJLENBQUMsVUFBVSxPQUFPLGdCQUFnQixhQUFhO0FBQ2pELGtCQUFJLFVBQVUsS0FBSyxFQUFFLGdCQUFnQixtQkFBbUIsQ0FBQztBQUN6RCxxQkFBTyxJQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsT0FBTyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQUEsWUFDM0U7QUFFQSxrQkFBTSxXQUFXLFlBQVksTUFBTTtBQUNuQyxnQkFBSSxDQUFDLFVBQVU7QUFDYixrQkFBSSxVQUFVLEtBQUssRUFBRSxnQkFBZ0IsbUJBQW1CLENBQUM7QUFDekQscUJBQU8sSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sK0NBQStDLENBQUMsQ0FBQztBQUFBLFlBQzFGO0FBRUEsa0JBQU0sRUFBRSxVQUFVLE1BQU0sT0FBTyxJQUFJO0FBRW5DLCtCQUFtQixLQUFLLFFBQVEsbUJBQW1CLFFBQVE7QUFDM0QsZ0JBQUksU0FBUyxTQUFTLElBQUksS0FBSyxDQUFDLGlCQUFpQixXQUFXLGlCQUFpQixLQUFLLGlCQUFpQixTQUFTLGNBQWMsR0FBRztBQUMzSCxrQkFBSSxVQUFVLEtBQUssRUFBRSxnQkFBZ0IsbUJBQW1CLENBQUM7QUFDekQscUJBQU8sSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sZUFBZSxDQUFDLENBQUM7QUFBQSxZQUMxRDtBQUVBLGtCQUFNLGtCQUFrQixHQUFHLGFBQWEsa0JBQWtCLE9BQU87QUFFakUsa0JBQU0sV0FBVyxNQUFNLGlCQUFpQjtBQUFBLGNBQ3RDLFlBQVk7QUFBQSxjQUNaLFNBQVMsQ0FBQyxPQUFPLFlBQVk7QUFBQSxjQUM3QixlQUFlO0FBQUEsWUFDakIsQ0FBQztBQUVELGdCQUFJLGlCQUFpQjtBQUNyQixrQkFBTSxVQUFVO0FBQUEsY0FDZCxrQkFBa0JBLE9BQU07QUFDdEIsc0JBQU0sT0FBT0EsTUFBSztBQUNsQixvQkFBSSxLQUFLLE9BQU8sS0FBSyxJQUFJLE1BQU0sU0FBUyxRQUFRLEtBQUssSUFBSSxNQUFNLFNBQVMsTUFBTSxRQUFRO0FBQ3BGLG1DQUFpQkE7QUFDakIsa0JBQUFBLE1BQUssS0FBSztBQUFBLGdCQUNaO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFDQSwwQkFBYyxRQUFRLFVBQVUsT0FBTztBQUV2QyxnQkFBSSxDQUFDLGdCQUFnQjtBQUNuQixrQkFBSSxVQUFVLEtBQUssRUFBRSxnQkFBZ0IsbUJBQW1CLENBQUM7QUFDekQscUJBQU8sSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sd0NBQXdDLE9BQU8sQ0FBQyxDQUFDO0FBQUEsWUFDMUY7QUFFQSxrQkFBTSxtQkFBbUIsU0FBUyxXQUFXO0FBQzdDLGtCQUFNLHVCQUF1QixlQUFlO0FBQzVDLGtCQUFNLHFCQUFvQixvQkFBZSxlQUFmLG1CQUEyQjtBQUVyRCxrQkFBTSxpQkFBaUIscUJBQXFCLFFBQVEscUJBQXFCLEtBQUssU0FBUztBQUV2RixnQkFBSSxhQUFhO0FBQ2pCLGdCQUFJLFlBQVk7QUFDaEIsZ0JBQUksV0FBVztBQUVmLGdCQUFJLGdCQUFnQjtBQUVsQixvQkFBTSxlQUFlLGlCQUFpQixzQkFBc0IsQ0FBQyxDQUFDO0FBQzlELDJCQUFhLGFBQWE7QUFFMUIsb0JBQU0sVUFBVSxxQkFBcUIsV0FBVztBQUFBLGdCQUFLLFVBQ2pELGlCQUFlLElBQUksS0FBSyxLQUFLLFFBQVEsS0FBSyxLQUFLLFNBQVM7QUFBQSxjQUM1RDtBQUVBLGtCQUFJLFdBQWEsa0JBQWdCLFFBQVEsS0FBSyxHQUFHO0FBQy9DLHdCQUFRLFFBQVUsZ0JBQWMsV0FBVztBQUMzQywyQkFBVztBQUVYLHNCQUFNLGNBQWMsaUJBQWlCLHNCQUFzQixDQUFDLENBQUM7QUFDN0QsNEJBQVksWUFBWTtBQUFBLGNBQzFCO0FBQUEsWUFDRixPQUFPO0FBQ0wsa0JBQUkscUJBQXVCLGVBQWEsaUJBQWlCLEdBQUc7QUFDMUQsc0JBQU0sZUFBZSxpQkFBaUIsbUJBQW1CLENBQUMsQ0FBQztBQUMzRCw2QkFBYSxhQUFhO0FBRTFCLGtDQUFrQixXQUFXLENBQUM7QUFDOUIsb0JBQUksZUFBZSxZQUFZLEtBQUssTUFBTSxJQUFJO0FBQzVDLHdCQUFNLGNBQWdCLFVBQVEsV0FBVztBQUN6QyxvQ0FBa0IsU0FBUyxLQUFLLFdBQVc7QUFBQSxnQkFDN0M7QUFDQSwyQkFBVztBQUVYLHNCQUFNLGNBQWMsaUJBQWlCLG1CQUFtQixDQUFDLENBQUM7QUFDMUQsNEJBQVksWUFBWTtBQUFBLGNBQzFCO0FBQUEsWUFDRjtBQUVBLGdCQUFJLENBQUMsVUFBVTtBQUNiLGtCQUFJLFVBQVUsS0FBSyxFQUFFLGdCQUFnQixtQkFBbUIsQ0FBQztBQUN6RCxxQkFBTyxJQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsT0FBTyxrQ0FBa0MsQ0FBQyxDQUFDO0FBQUEsWUFDN0U7QUFFQSxrQkFBTSxTQUFTLGlCQUFpQixVQUFVLENBQUMsQ0FBQztBQUM1QyxrQkFBTSxhQUFhLE9BQU87QUFFMUIsZ0JBQUksVUFBVSxLQUFLLEVBQUUsZ0JBQWdCLG1CQUFtQixDQUFDO0FBQ3pELGdCQUFJLElBQUksS0FBSyxVQUFVO0FBQUEsY0FDbkIsU0FBUztBQUFBLGNBQ1QsZ0JBQWdCO0FBQUEsY0FDaEI7QUFBQSxjQUNBO0FBQUEsWUFDSixDQUFDLENBQUM7QUFBQSxVQUVKLFNBQVMsT0FBTztBQUNkLGdCQUFJLFVBQVUsS0FBSyxFQUFFLGdCQUFnQixtQkFBbUIsQ0FBQztBQUN6RCxnQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8saURBQWlELENBQUMsQ0FBQztBQUFBLFVBQ3JGO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjs7O0FDL1hpZSxTQUFTLG9CQUFvQjtBQUM5ZixTQUFTLGVBQWU7QUFDeEIsU0FBUyxpQkFBQUMsc0JBQXFCOzs7QUNGd2MsSUFBTSxlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF3RnBmLElBQU0sbUJBQW1CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUR4RitRLElBQU1DLDRDQUEyQztBQUtoVyxJQUFNQyxjQUFhQyxlQUFjRix5Q0FBZTtBQUNoRCxJQUFNRyxhQUFZLFFBQVFGLGFBQVksSUFBSTtBQUUzQixTQUFSLHNCQUF1QztBQUM1QyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxxQkFBcUI7QUFDbkIsWUFBTSxhQUFhLFFBQVFFLFlBQVcscUJBQXFCO0FBQzNELFVBQUksZ0JBQWdCLGFBQWEsWUFBWSxPQUFPO0FBR3BELHNCQUFnQixjQUFjO0FBQUEsUUFDNUI7QUFBQSxRQUNBLHdCQUF3QixLQUFLLFVBQVUsWUFBWSxDQUFDO0FBQUEsTUFDdEQ7QUFFQSxhQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsT0FBTyxFQUFFLE1BQU0sU0FBUztBQUFBLFVBQ3hCLFVBQVU7QUFBQSxVQUNWLFVBQVU7QUFBQSxRQUNaO0FBQUEsUUFDQTtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsVUFBVTtBQUFBLFVBQ1YsVUFBVTtBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjs7O0FFckNrZSxTQUFSLCtCQUFnRDtBQUN4Z0IsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AscUJBQXFCO0FBQ25CLFlBQU0sU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF5RWYsYUFBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLEtBQUs7QUFBQSxVQUNMLE9BQU8sRUFBRSxNQUFNLFNBQVM7QUFBQSxVQUN4QixVQUFVO0FBQUEsVUFDVixVQUFVO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QUNyRkEsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxxQkFBcUI7QUFFZixTQUFSLHdCQUF5QztBQUM5QyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixhQUFhO0FBQ1gsVUFBSTtBQUNGLGNBQU0sWUFBWSxLQUFLLElBQUk7QUFDM0IsWUFBSSxVQUFVO0FBRWQsWUFBSTtBQUNGLG9CQUFVLFNBQVMsOEJBQThCLEVBQUUsVUFBVSxRQUFRLENBQUMsRUFBRSxLQUFLO0FBQUEsUUFDL0UsU0FBUyxPQUFPO0FBRWQsa0JBQVEsS0FBSyx1RUFBMEQ7QUFBQSxRQUN6RTtBQUVBLGNBQU0sVUFBVTtBQUFBLFVBQ2QsU0FBUyxHQUFHLFNBQVMsSUFBSSxPQUFPO0FBQUEsVUFDaEM7QUFBQSxVQUNBO0FBQUEsVUFDQSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsUUFDcEM7QUFHQTtBQUFBLFVBQ0U7QUFBQSxVQUNBLEtBQUssVUFBVSxTQUFTLE1BQU0sQ0FBQztBQUFBLFVBQy9CO0FBQUEsUUFDRjtBQUVBLGdCQUFRLElBQUkseUNBQWlDLFFBQVEsT0FBTztBQUFBLE1BQzlELFNBQVMsT0FBTztBQUNkLGdCQUFRLE1BQU0sZ0RBQXdDLEtBQUs7QUFBQSxNQUU3RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7OztBTDFDQSxJQUFNLG1DQUFtQztBQVF6QyxJQUFNLFFBQVEsUUFBUSxJQUFJLGFBQWE7QUFDdkMsSUFBTSxZQUFZQyxNQUFLLFFBQVEsa0NBQVcsc0JBQXNCO0FBQ2hFLElBQU0sZUFBZUEsTUFBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUV2RSxJQUFNLGlDQUFpQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQStDdkMsSUFBTSxvQ0FBb0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBbUIxQyxJQUFNLG9DQUFvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTBCMUMsSUFBTSwrQkFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFxR3JDLElBQU0sd0JBQXdCO0FBQUEsRUFDN0IsTUFBTTtBQUFBLEVBQ04sbUJBQW1CLE1BQU07QUFDeEIsVUFBTSxPQUFPO0FBQUEsTUFDWjtBQUFBLFFBQ0MsS0FBSztBQUFBLFFBQ0wsT0FBTyxFQUFFLE1BQU0sU0FBUztBQUFBLFFBQ3hCLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0MsS0FBSztBQUFBLFFBQ0wsT0FBTyxFQUFFLE1BQU0sU0FBUztBQUFBLFFBQ3hCLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0MsS0FBSztBQUFBLFFBQ0wsT0FBTyxFQUFDLE1BQU0sU0FBUTtBQUFBLFFBQ3RCLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0MsS0FBSztBQUFBLFFBQ0wsT0FBTyxFQUFFLE1BQU0sU0FBUztBQUFBLFFBQ3hCLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxNQUNYO0FBQUEsSUFDRDtBQUVBLFFBQUksQ0FBQyxTQUFTLFFBQVEsSUFBSSw4QkFBOEIsUUFBUSxJQUFJLHVCQUF1QjtBQUMxRixXQUFLO0FBQUEsUUFDSjtBQUFBLFVBQ0MsS0FBSztBQUFBLFVBQ0wsT0FBTztBQUFBLFlBQ04sS0FBSyxRQUFRLElBQUk7QUFBQSxZQUNqQix5QkFBeUIsUUFBUSxJQUFJO0FBQUEsVUFDdEM7QUFBQSxVQUNBLFVBQVU7QUFBQSxRQUNYO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFFQSxXQUFPO0FBQUEsTUFDTjtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUNEO0FBRUEsUUFBUSxPQUFPLE1BQU07QUFBQztBQUV0QixJQUFNLFNBQVMsYUFBYTtBQUM1QixJQUFNLGNBQWMsT0FBTztBQUUzQixPQUFPLFFBQVEsQ0FBQyxLQUFLLFlBQVk7QUFwUWpDO0FBcVFDLE9BQUksd0NBQVMsVUFBVCxtQkFBZ0IsV0FBVyxTQUFTLDhCQUE4QjtBQUNyRTtBQUFBLEVBQ0Q7QUFFQSxjQUFZLEtBQUssT0FBTztBQUN6QjtBQW1CQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixjQUFjO0FBQUEsRUFDZCxTQUFTO0FBQUEsSUFDUixzQkFBc0I7QUFBQTtBQUFBLElBQ3RCLEdBQUksUUFBUSxDQUFDLGlCQUFpQixHQUFHLG9CQUFrQixHQUFHLDZCQUE2QixDQUFDLElBQUksQ0FBQztBQUFBLElBQ3pGLE1BQU07QUFBQSxJQUNOO0FBQUE7QUFBQSxFQUVEO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVQLHVCQUF1QixLQUFLLFVBQVUsS0FBSztBQUFBLElBQzNDLHdCQUF3QixLQUFLLFVBQVUsQ0FBQyxLQUFLO0FBQUEsSUFDN0Msd0JBQXdCLEtBQUssVUFBVSxRQUFRLGdCQUFnQixZQUFZO0FBQUEsRUFDNUU7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNSLGdDQUFnQztBQUFBLElBQ2pDO0FBQUEsSUFDQSxjQUFjO0FBQUEsSUFDZCxLQUFLO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDWDtBQUFBLEVBQ0Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLFlBQVksQ0FBQyxRQUFRLE9BQU8sUUFBUSxPQUFPLE9BQVM7QUFBQSxJQUNwRCxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsSUFDN0IsT0FBTztBQUFBLE1BQ04sS0FBS0MsTUFBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxPQUFPO0FBQUEsTUFDUCxhQUFhO0FBQUEsTUFDYixvQkFBb0JBLE1BQUssUUFBUSxjQUFjLGFBQWE7QUFBQSxNQUM1RCxxQkFBcUJBLE1BQUssUUFBUSxXQUFXLGtCQUFrQjtBQUFBLE1BQy9ELHlCQUF5QkEsTUFBSyxRQUFRLFdBQVcsc0JBQXNCO0FBQUEsSUFDeEU7QUFBQSxFQUNEO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNiLFNBQVM7QUFBQSxNQUNSO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUE7QUFBQSxJQUVBLFNBQVMsQ0FBQyxTQUFTLGFBQWEsb0JBQW9CLGtCQUFrQjtBQUFBLEVBQ3ZFO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNkLFVBQVU7QUFBQSxRQUNULGNBQWM7QUFBQTtBQUFBLFFBQ2QsZUFBZTtBQUFBLFFBQ2YsWUFBWSxDQUFDLGVBQWUsaUJBQWlCLGNBQWM7QUFBQSxRQUMzRCxRQUFRO0FBQUE7QUFBQSxRQUVSLE1BQU07QUFBQSxRQUNOLFVBQVU7QUFBQSxRQUNWLGVBQWU7QUFBQSxRQUNmLGdCQUFnQjtBQUFBLE1BQ2pCO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDUCxVQUFVO0FBQUEsTUFDWDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ1AsVUFBVTtBQUFBO0FBQUEsTUFDWDtBQUFBLElBQ0Q7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNkLFVBQVU7QUFBQSxRQUNUO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLE1BQ0EsUUFBUTtBQUFBO0FBQUEsUUFFUCxjQUFjO0FBQUE7QUFBQSxVQUViLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQTtBQUFBLFVBR3pELG1CQUFtQjtBQUFBLFlBQ2xCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRDtBQUFBO0FBQUEsVUFHQSxhQUFhO0FBQUEsWUFDWjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Q7QUFBQTtBQUFBLFVBR0Esb0JBQW9CLENBQUMsZUFBZTtBQUFBO0FBQUEsVUFHcEMsZ0JBQWdCO0FBQUEsWUFDZjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQSxJQUNBLHVCQUF1QjtBQUFBO0FBQUEsRUFDeEI7QUFBQSxFQUNBLFdBQVc7QUFDWixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgIl9fZGlybmFtZSIsICJwYXRoIiwgImZpbGVVUkxUb1BhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCIsICJfX2ZpbGVuYW1lIiwgImZpbGVVUkxUb1BhdGgiLCAiX19kaXJuYW1lIiwgInBhdGgiLCAicGF0aCJdCn0K
