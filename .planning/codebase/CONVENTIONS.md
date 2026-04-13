# Coding Conventions

**Analysis Date:** 2026-04-13

## Overview

The codebase is a vanilla JavaScript / HTML project with no build toolchain. All application logic lives inline in HTML `<script type="module">` blocks. There is no transpilation, bundling, linting, or formatting tooling present.

## Naming Patterns

**Files:**
- Lowercase with hyphens for HTML pages: `index.html`, `webcomponent.js`
- No consistent suffix pattern for JS modules — only one first-party JS file exists (`embed/webcomponent.js`)

**Functions:**
- camelCase for all functions: `frameObject`, `animateCameraArc`, `resolveSelector`, `applyConstraints`, `detectWheels`
- Private/internal helpers prefixed with underscore: `_applyHover`, `_clearHover`, `_applyExternalHover`, `_clearExternalHover`, `_hoveredMesh`, `_origEmissive`, `_extOrigEmissives`, `_extHoveredMeshes`, `_hoverScheduled`, `_matCloned`, `_bboxHelper`

**Variables:**
- camelCase for local variables: `startPos`, `endTar`, `arcLift`, `dirVec`
- ALL_CAPS for true constants shared across scopes: `ALLOW_ORIGIN`, `ORIGIN`, `PORT`, `ROOT`, `MIME`
- Short shorthands for frequently used DOM refs: `const $ = (sel, el=document) => el.querySelector(sel)`

**Configuration Objects:**
- Suffix `Cfg` for configuration objects: `arcCfg`, `animCfg`
- Suffix `El` for DOM element references: `progressEl`

**CSS Classes:**
- BEM-like with hyphen separators: `app-header`, `app-body`, `sidebar-header`, `sidebar-content`, `viewer-wrap`, `header-actions`
- State/modifier via `data-*` attributes: `data-variant="ghost"`, `data-size="small"`, `data-color-scheme="light"`

**HTML data attributes (API surface):**
- Kebab-case: `data-selector`, `data-cam-pos`, `data-cam-tar`, `data-orbit-h`, `data-orbit-v`, `data-zoom-min`, `data-zoom-max`, `data-padding`

## Code Style

**Formatting:**
- No formatter configured (no `.prettierrc`, `.editorconfig`, or similar)
- Indentation is inconsistent: some blocks use 2-space indent, some use 4-space; some top-level functions inside `<script type="module">` are not indented relative to the module scope
- Semicolons: used consistently
- Single quotes preferred for string literals in JS

**Linting:**
- No ESLint or other linter configured

**Line Length:**
- No enforced limit; long lines occur frequently in the viewer (e.g., chained DOM/Three.js operations on one line)

## ES Module Usage

**Pattern in `viewer/index.html`:**
```html
<script type="importmap">
{
  "imports": {
    "three": "../vendor/three.module.min.js",
    "three/addons/": "../vendor/addons/"
  }
}
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import GUI from '../vendor/lil-gui.esm.min.js';
  // ... all logic inline ...
</script>
```

- Import maps resolve bare specifiers to local vendor paths (no CDN at runtime)
- All viewer logic is in a single inline `<script type="module">` block
- `embed/webcomponent.js` is a plain script (no `type="module"`), uses a class-based custom element

**Pattern in `serve.js`:**
- CommonJS (`require`, `module.exports` style), Node.js only, no ES modules

## Import Organization

**Order in `viewer/index.html`:**
1. Three.js core: `import * as THREE from 'three'`
2. Three.js addons: `import { OrbitControls } from 'three/addons/...'`
3. Third-party vendor: `import GUI from '../vendor/lil-gui.esm.min.js'`

No first-party module imports (all logic is inline).

**Path Aliases:**
- `"three"` → `../vendor/three.module.min.js`
- `"three/addons/"` → `../vendor/addons/`

## Error Handling

**Patterns:**
- `try/catch` used around URL parsing and startup camera params; errors are silently swallowed with `/* ignore */` comment:
  ```js
  try {
    const sp = new URLSearchParams(location.search);
    // ...
  } catch(e){ /* ignore */ }
  ```
- `loadModel` uses try/catch and posts an error message to the host via `postMessage`:
  ```js
  } catch(err) {
    progressEl.textContent = 'Fehler beim Laden';
    post({ type: 'error', payload: { code: 'MODEL_LOAD', message: String(err) } });
  }
  ```
- `serve.js` returns a 404 text response on `fs.readFile` error; no structured error logging
- Optional chaining (`?.`) used pervasively to guard against null/undefined: `payload?.selector`, `root?.traverse(...)`, `m.userData?.id`

**No global error boundary** — no `window.onerror` or `window.addEventListener('unhandledrejection', ...)` handler.

## Logging

**Framework:** `console.log` only (no structured logging library)

**Patterns:**
- Debug log on every incoming postMessage: `console.log('[host→viewer]', type, payload)`
- Alias mapping logged on detection: `console.log('[Aliases]', d.payload?.mapped)`
- Clipboard fallback logs to console with descriptive prefix: `console.log('Clipboard fehlgeschlagen, siehe Konsole:', text)`

## Comments

**Style:**
- Section separators with `// ====== Section Name ======` for major blocks
- Sub-section separators with `// ── Label ───` (box-drawing dashes)
- JSDoc used for complex utility functions with `@param` and `@returns`:
  ```js
  /**
   * Tween Utility – bricht laufende Animation automatisch ab
   * @param {number} durationMs
   * @param {(t:number)=>void} onUpdate - t in [0,1]
   * @param {()=>void} [onDone]
   */
  function tween(durationMs, onUpdate, onDone){ ... }
  ```
- URL param documentation inline above config objects, e.g.:
  ```js
  // ?arcLift=0.4  → Bogenhöhe pro Radiant Winkel
  const arcCfg = { ... };
  ```
- German and English mixed in comments; German dominates in UI-facing code, English in Three.js/math logic

## Function Design

**Size:** Functions vary widely — `focus()` and `animateCameraArc()` are 30–50 lines; utility functions like `easeInOutCubic` are 1 line.

**Parameters:** Default values used consistently:
```js
function focus(selector, padding=1.3, animateMs=800, positionOverride=null, targetOverride=null)
function tween(durationMs, onUpdate, onDone)   // onDone optional, called with onDone && onDone()
```

**Return Values:** Functions are side-effectful (mutate Three.js scene state); return values are generally not used. Early returns used to guard against missing state:
```js
function setVisible(selector, visible=true){
  if (!root) return;
  // ...
}
```

## postMessage API Conventions

**Host → Viewer messages:**
```js
iframe.contentWindow.postMessage({ type, payload }, ORIGIN);
```

**Viewer → Host messages:**
```js
parent.postMessage({ source: 'viewer', type, payload }, ALLOW_ORIGIN);
```

- `source: 'viewer'` sentinel field used to filter incoming messages on host side
- `type` is a camelCase string: `'animateCamera'`, `'focus'`, `'setVisibility'`, `'ready'`, `'poi'`, `'loading'`, `'error'`
- `payload` is always a plain object

**Legacy API:** Old message types (`setCamera`, `setVisible`, `enableOrbit`, `focusNode`) remain in the switch statement with comments marking them as legacy.

## Module Design

**Exports:** None — the project has no module system at the application level. `embed/webcomponent.js` registers a global custom element (`customElements.define('x-3d-viewer', X3DViewer)`) and exports nothing.

**Barrel Files:** Not applicable.

## CSS Conventions

**Variables:** DB UX Design System CSS custom properties used for theming: `var(--db-color-background, #f3f4f6)` with fallback values.

**Layout:** CSS Grid for page structure, flexbox for header/sidebar components.

**Overrides:** Component library overrides applied with `!important` where the external library ignores `data-color-scheme`:
```css
/* DB UX Komponenten-CSS ignoriert data-color-scheme bei card-Variante */
.db-accordion-item details > summary { background-color: #ffffff !important; }
```

---

*Convention analysis: 2026-04-13*
