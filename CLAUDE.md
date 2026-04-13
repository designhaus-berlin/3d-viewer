<!-- GSD:project-start source:PROJECT.md -->
## Project

**3D Viewer**

Ein selbst-gehosteter Three.js 3D-Viewer, der per `<iframe>` in beliebige Webseiten eingebettet wird und vollständig über eine `postMessage`-API gesteuert wird. Entwickelt für den eigenen Einsatz, für Kundenprojekte und als Open-Source-Tool auf GitHub. Der Host braucht kein Three.js-Wissen — er sendet einfach JSON-Nachrichten.

**Core Value:** Der Viewer muss zuverlässig embedden und auf alle API-Commands reagieren — ohne Build-Step, ohne externe Abhängigkeiten, überall lauffähig.

### Constraints

- **Zero-Build**: Keine Transpiler, kein Bundler — direktes ESM, läuft per file:// oder einfachem HTTP-Server
- **Self-hosted**: Alle Libs lokal unter `vendor/` — kein CDN, offline-fähig
- **Kein Framework**: Vanilla JS, kein React/Vue/Svelte
- **Browser-only**: Kein Node.js im Viewer selbst (`serve.js` nur optionaler Dev-Server)
- **Backwards Compatibility**: Legacy postMessage-API-Aliases müssen während einer Migrationsfrist erhalten bleiben
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES2020+, native ESM modules) - All viewer logic, host integration, web component
- HTML5 - Viewer app shell (`viewer/index.html`), host example (`host-example/index.html`)
- CSS3 - Inline styles in all HTML files; no external CSS preprocessor
## Runtime
- Browser (modern; requires import map support — Chrome 89+, Firefox 108+, Safari 16.4+)
- No build step or bundler: code runs directly as authored
- Node.js - `serve.js` static file server, port 3001
- No npm/package.json — Node server uses only built-in `http`, `fs`, `path` modules
- XAMPP (Apache) at `http://localhost/3d-viewer/` — no Node required
- None — all dependencies are vendored locally under `vendor/`
- Lockfile: not applicable
## Frameworks
- Three.js (self-hosted, minified) — 3D rendering engine
- lil-gui (self-hosted, minified) — debug control panel
- DB UX Design System v4.5.0 — Deutsche Bahn component library loaded via CDN
- Vanilla Custom Elements v1 (`customElements.define`) — no framework
- None detected
- No bundler, no transpiler, no build pipeline
## Key Dependencies
- `vendor/three.module.min.js` — entire 3D runtime; version not directly readable from minified file
- `vendor/addons/controls/OrbitControls.js` — camera interaction
- `vendor/addons/loaders/GLTFLoader.js` — GLTF/GLB model loading
- `vendor/addons/loaders/DRACOLoader.js` — Draco mesh compression support
- `vendor/addons/loaders/KTX2Loader.js` — KTX2 texture compression support
- `vendor/addons/utils/BufferGeometryUtils.js` — geometry utilities
- `vendor/addons/utils/WorkerPool.js` — worker pool for loaders
- `vendor/addons/libs/draco/` — Draco WASM decoder (path set in `DRACOLoader.setDecoderPath`)
- `vendor/addons/libs/basis/` — Basis/KTX2 WASM transcoder (path set in `KTX2Loader.setTranscoderPath`)
- `vendor/addons/libs/ktx-parse.module.js` — KTX2 parsing
- `vendor/addons/libs/zstddec.module.js` — Zstandard decompression
## Configuration
- No `.env` files; no server-side environment variables
- All configuration is passed via URL query parameters to `viewer/index.html`:
- No build config files (no webpack.config, vite.config, tsconfig, rollup.config, etc.)
## Platform Requirements
- Any static HTTP server (XAMPP Apache, or `node serve.js`)
- Modern browser with ES module import map support
- No npm install required
- Static file hosting only (no server-side logic)
- Files to serve: `viewer/`, `vendor/`, `assets/`, optionally `embed/`, `host-example/`
- CORS-compatible hosting required if viewer and host are on different origins
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
## Naming Patterns
- Lowercase with hyphens for HTML pages: `index.html`, `webcomponent.js`
- No consistent suffix pattern for JS modules — only one first-party JS file exists (`embed/webcomponent.js`)
- camelCase for all functions: `frameObject`, `animateCameraArc`, `resolveSelector`, `applyConstraints`, `detectWheels`
- Private/internal helpers prefixed with underscore: `_applyHover`, `_clearHover`, `_applyExternalHover`, `_clearExternalHover`, `_hoveredMesh`, `_origEmissive`, `_extOrigEmissives`, `_extHoveredMeshes`, `_hoverScheduled`, `_matCloned`, `_bboxHelper`
- camelCase for local variables: `startPos`, `endTar`, `arcLift`, `dirVec`
- ALL_CAPS for true constants shared across scopes: `ALLOW_ORIGIN`, `ORIGIN`, `PORT`, `ROOT`, `MIME`
- Short shorthands for frequently used DOM refs: `const $ = (sel, el=document) => el.querySelector(sel)`
- Suffix `Cfg` for configuration objects: `arcCfg`, `animCfg`
- Suffix `El` for DOM element references: `progressEl`
- BEM-like with hyphen separators: `app-header`, `app-body`, `sidebar-header`, `sidebar-content`, `viewer-wrap`, `header-actions`
- State/modifier via `data-*` attributes: `data-variant="ghost"`, `data-size="small"`, `data-color-scheme="light"`
- Kebab-case: `data-selector`, `data-cam-pos`, `data-cam-tar`, `data-orbit-h`, `data-orbit-v`, `data-zoom-min`, `data-zoom-max`, `data-padding`
## Code Style
- No formatter configured (no `.prettierrc`, `.editorconfig`, or similar)
- Indentation is inconsistent: some blocks use 2-space indent, some use 4-space; some top-level functions inside `<script type="module">` are not indented relative to the module scope
- Semicolons: used consistently
- Single quotes preferred for string literals in JS
- No ESLint or other linter configured
- No enforced limit; long lines occur frequently in the viewer (e.g., chained DOM/Three.js operations on one line)
## ES Module Usage
- Import maps resolve bare specifiers to local vendor paths (no CDN at runtime)
- All viewer logic is in a single inline `<script type="module">` block
- `embed/webcomponent.js` is a plain script (no `type="module"`), uses a class-based custom element
- CommonJS (`require`, `module.exports` style), Node.js only, no ES modules
## Import Organization
- `"three"` → `../vendor/three.module.min.js`
- `"three/addons/"` → `../vendor/addons/`
## Error Handling
- `try/catch` used around URL parsing and startup camera params; errors are silently swallowed with `/* ignore */` comment:
- `loadModel` uses try/catch and posts an error message to the host via `postMessage`:
- `serve.js` returns a 404 text response on `fs.readFile` error; no structured error logging
- Optional chaining (`?.`) used pervasively to guard against null/undefined: `payload?.selector`, `root?.traverse(...)`, `m.userData?.id`
## Logging
- Debug log on every incoming postMessage: `console.log('[host→viewer]', type, payload)`
- Alias mapping logged on detection: `console.log('[Aliases]', d.payload?.mapped)`
- Clipboard fallback logs to console with descriptive prefix: `console.log('Clipboard fehlgeschlagen, siehe Konsole:', text)`
## Comments
- Section separators with `// ====== Section Name ======` for major blocks
- Sub-section separators with `// ── Label ───` (box-drawing dashes)
- JSDoc used for complex utility functions with `@param` and `@returns`:
- URL param documentation inline above config objects, e.g.:
- German and English mixed in comments; German dominates in UI-facing code, English in Three.js/math logic
## Function Design
## postMessage API Conventions
- `source: 'viewer'` sentinel field used to filter incoming messages on host side
- `type` is a camelCase string: `'animateCamera'`, `'focus'`, `'setVisibility'`, `'ready'`, `'poi'`, `'loading'`, `'error'`
- `payload` is always a plain object
## Module Design
## CSS Conventions
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Zero build step — all JavaScript lives in a single `<script type="module">` block inside `viewer/index.html`
- Entirely self-hosted: no CDN, all vendor libs under `vendor/`
- Two embedding patterns: raw `<iframe>` (primary) or `<x-3d-viewer>` Web Component wrapper (`embed/webcomponent.js`)
- Message envelope uses `{ source: 'viewer', type, payload }` (outbound) and `{ type, payload }` (inbound)
- Legacy API aliases are preserved for backwards compatibility
## Layers
- Purpose: Three.js rendering, model loading, camera control, interaction handling
- Location: `viewer/index.html` (single `<script type="module">` block, ~815 lines)
- Contains: Scene setup, render loop, tween engine, postMessage handler, debug GUI
- Depends on: `vendor/three.module.min.js`, `vendor/addons/`, `vendor/lil-gui.esm.min.js`
- Used by: Any host page via `<iframe>`
- Purpose: Application UI, business logic, user interaction, API calls into viewer
- Location: `host-example/index.html` (reference implementation)
- Contains: `send(type, payload)` helper, `window.addEventListener('message', ...)` listener, accordion/button wiring
- Depends on: Viewer iframe loaded at a relative URL
- Used by: End users
- Purpose: Convenience wrapper; encapsulates iframe creation and postMessage wiring behind a DOM element interface
- Location: `embed/webcomponent.js`
- Contains: `X3DViewer extends HTMLElement`, Shadow DOM, attribute reflection, typed JS methods
- Depends on: `viewer/index.html` (loaded as `src` attribute)
- Used by: `host-example/webcomponent.html`
- Purpose: Three.js rendering engine and loaders, debug GUI
- Location: `vendor/`
- Contains: `three.module.min.js`, `vendor/addons/controls/OrbitControls.js`, `vendor/addons/loaders/GLTFLoader.js`, `vendor/addons/loaders/DRACOLoader.js`, `vendor/addons/loaders/KTX2Loader.js`, `vendor/lil-gui.esm.min.js`
- Depends on: Nothing external (fully self-hosted)
## Data Flow
```
```
- All 3D state lives inside `viewer/index.html` (module scope variables: `root`, `camera`, `controls`, `scene`, `animCfg`, `arcCfg`, `tweenToken`)
- Host maintains its own UI state (e.g. `orbitOn` boolean, accordion open/close)
- No shared state object; communication is message-only
## Key Abstractions
- Purpose: Resolves a string selector to a Three.js Object3D node inside `root`
- Location: `viewer/index.html` (inline function, ~line 370)
- Resolution order: `aliases` Map (wheel1–4) → `object.name` → `userData.id` → `userData.tag`
- Special value `'all'` is handled inline in `setVisible` / `focus` (not via `resolveSelector`)
- Purpose: Lightweight animation without external dependency; cancellation-token pattern stops old animations when new ones start
- Location: `viewer/index.html` (`tween(durationMs, onUpdate, onDone)`, ~line 501)
- Easing: `easeInOutCubic`
- Accessibility: if `animCfg.enabled === false`, calls `onUpdate(1)` immediately (jump-to-end)
- Purpose: Camera travels along a spherical arc around the model pivot instead of a straight line (avoids clipping through geometry)
- Location: `viewer/index.html` (~line 566)
- Pivot source: `root.userData.viewerPivot` (Blender Custom Property) → fallback to bounding-box center (`getModelPivot()`)
- Configurable via `arcCfg` object (`liftFactor`, `liftMax`, `safeRadius`) — adjustable per URL param or Debug GUI live
- Purpose: Straight-line interpolation for `animateCamera` commands when an exact position is required
- Location: `viewer/index.html` (~line 523)
- Note: Despite the name difference, `animateCamera` in the postMessage API now calls `animateCameraArc`, not `animateCameraTo`
- Canvas hover: `pointermove` → raycaster → emissive glow (orange/grey, `0x666666`) on single mesh
- External hover: `setHover` postMessage from host → emissive glow (blue, `0x334488`) on all meshes of a selector
- Material cloning: materials are cloned on first hover to avoid contaminating shared materials
- Purpose: Heuristically assigns `wheel1`–`wheel4` aliases to mesh nodes matching name patterns
- Location: `viewer/index.html` (~line 325)
- Pattern: regex `/(wheel|tire|tyre|rim|felge|rad|reifen)/i` on node name/id/tag
- Assigns each alias to the nearest candidate from four bounding-box corners (x/z plane)
- Purpose: Custom element `<x-3d-viewer>` that wraps the iframe with Shadow DOM and typed methods
- Location: `embed/webcomponent.js`
- Observed attributes: `src`, `model`, `theme`, `lang`, `aspect`
- Methods: `animateCamera()`, `focus()`, `setVisibility()`, `setOrbitEnabled()` (plus legacy `focusNode()`, `setVisible()`, `enableOrbit()`, `setCamera()`)
- Re-dispatches viewer messages as DOM `CustomEvent` that bubble out of the shadow root
## Entry Points
- Location: `viewer/index.html`
- Triggers: Browser loads the HTML; `<script type="module">` executes immediately
- Responsibilities: Initialize Three.js scene, load model (or demo), start render loop, register postMessage listener, send `ready` event
- Location: `host-example/index.html`
- Triggers: Browser page load
- Responsibilities: Embed viewer iframe, wire accordion items to `focus`/`setHover`/`setOrbitConstraints` commands, handle viewer events (`ready`, `poi`, `loading`, `error`)
- Location: `embed/webcomponent.html` (usage) / `embed/webcomponent.js` (definition)
- Triggers: `customElements.define('x-3d-viewer', X3DViewer)` called when script loads; element upgraded when inserted into DOM
- Responsibilities: Create and manage iframe lifecycle, reflect HTML attributes to URL params, proxy method calls to postMessage
## postMessage API Design
| Command (type) | Key payload fields | Effect |
|---|---|---|
| `animateCamera` | `position {x,y,z}`, `target?`, `durationMs?` | Arc camera travel to exact coords |
| `focus` | `selector`, `padding?`, `position?`, `target?`, `durationMs?` | Arc swing to object by selector |
| `setVisibility` | `selector`, `visible?` | Show/hide meshes by selector |
| `setOrbitEnabled` | `enabled` | Enable/disable orbit controls |
| `setAnimationEnabled` | `enabled` | Toggle camera animation (accessibility) |
| `setHover` | `selector` (or `null`) | External highlight of object meshes |
| `setOrbitConstraints` | `azimuthMin/Max`, `polarMin/Max`, `distanceMin/Max`, `reset?` | Lock orbit range for element views |
| `setDebug` | `bounds` | Toggle bounding-box helpers |
| Event (type) | payload | When |
|---|---|---|
| `ready` | `{ apiVersion: '1.0.0' }` | Immediately on viewer script start |
| `loading` | `{ progress: 0.0–1.0 }` | During model loading |
| `poi` | `{ id, name }` | User clicks a mesh |
| `aliases` | `{ mapped, candidates }` | After wheel auto-detection completes |
| `camera` | `{ position, target }` | After `setCamera` (legacy) |
| `error` | `{ code, message }` | Model load failure |
| Old name | Maps to |
|---|---|
| `setCamera` | `animateCameraTo` (immediate or animated) |
| `focusNode` | `focusNode()` (no arc, no padding animation) |
| `setVisible` | `setVisible()` |
| `enableOrbit` | `enableOrbit()` |
| `focusWheel` | `focus('wheel{index}', ...)` |
| `setWheelVisible` | `setVisible('wheel{index}', ...)` |
## Error Handling
- Model load failure: `catch(err)` in `loadModel` → `post({ type:'error', payload:{ code:'MODEL_LOAD', message } })` → progress indicator shows "Fehler beim Laden"
- Invalid selector: `resolveSelector` returns `null`; callers (`focus`, `setVisible`) silently return early
- URL param parsing: wrapped in `try/catch` with `/* ignore */`; bad values fall back to defaults
- Debug GUI clipboard: `.catch()` on `navigator.clipboard.writeText` logs to console as fallback
- Missing model: falls back to `createDemoModel()` (procedural bridge scene)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
