# Architecture Research

**Domain:** Self-hosted Three.js 3D Viewer — zero-build ES module refactor
**Researched:** 2026-04-13
**Confidence:** HIGH (codebase fully analyzed, patterns verified against Three.js official docs and comparable open-source viewers)

## Standard Architecture

### System Overview

Current state: all viewer logic lives in a single `<script type="module">` block inside `viewer/index.html`. The iframe boundary and postMessage API are correct architectural decisions — they don't change. What changes is the internal structure of the viewer script.

```
┌──────────────────────────────── Host Page ───────────────────────────────┐
│  host-example/index.html  OR  <x-3d-viewer> Web Component               │
│  send(type, payload) ──────────────────────────────────────────────────► │
│  window.addEventListener('message', ...) ◄──────────────────────────── │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │  iframe src="viewer/index.html?model=..."
                              ▼
┌──────────────────────── viewer/index.html ───────────────────────────────┐
│  <script type="importmap">  (maps "three" → ../vendor/...)               │
│  <script type="module" src="./viewer.js">  (entry point)                │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  scene.js   │  │  camera.js  │  │  loader.js  │  │   hover.js    │  │
│  │  renderer   │  │  arc travel │  │  GLTFLoader │  │  emissive     │  │
│  │  lights     │  │  tween      │  │  DRACO/KTX2 │  │  raycaster    │  │
│  │  resize     │  │  orbit      │  │  frameObj   │  │  pick (poi)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘  │
│         └────────────────┴────────────────┴──────────────────┘          │
│                                    │                                     │
│                             ┌──────▼──────┐                             │
│                             │  viewer.js  │  (entry / orchestrator)      │
│                             │  URL params │                              │
│                             │  scene init │                              │
│                             │  render loop│                              │
│                             └──────┬──────┘                             │
│                                    │                                     │
│                             ┌──────▼──────┐                             │
│                             │   api.js    │  (postMessage dispatcher)    │
│                             │  inbound    │                              │
│                             │  outbound   │                              │
│                             │  legacy map │                              │
│                             └─────────────┘                             │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ selectors.js │  │   debug.js   │  │       config.js             │   │
│  │ resolveSelector│ │  lil-gui     │  │  arcCfg, animCfg, URL params│   │
│  │ detectWheels │  │  Copy Snippet│  │  camMinY, camMaxY, theme    │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────── vendor/ (unchanged) ──────────────────────────────────┐
│  three.module.min.js  /  addons/  /  lil-gui.esm.min.js                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | File | Responsibility | Communicates With |
|-----------|------|----------------|-------------------|
| Entry / Orchestrator | `viewer/viewer.js` | Imports all modules, reads URL params, initializes scene, starts render loop | All other modules |
| Config | `viewer/config.js` | Parses URL params; exports `arcCfg`, `animCfg`, `camMinY`, `camMaxY`, `theme`, `lang` | `viewer.js`, `camera.js`, `debug.js` |
| Scene | `viewer/scene.js` | Creates renderer, scene, camera, lights; handles `applySize` (ResizeObserver); exports the Three.js objects | `viewer.js`, `camera.js`, `hover.js` |
| Camera | `viewer/camera.js` | `tween()`, `easeInOutCubic`, `animateCameraTo()`, `animateCameraArc()`, `getModelPivot()`, `frameObject()` | `scene.js` (camera/controls), `config.js` (arcCfg/animCfg) |
| Loader | `viewer/loader.js` | `loadModel()`, `createDemoModel()`, `detectWheels()` — DRACO/KTX2 setup, progress events, post `loading`/`ready`/`aliases`/`error` | `scene.js` (scene root), `api.js` (post helper), `selectors.js` |
| Selectors | `viewer/selectors.js` | `resolveSelector()`, `aliases` Map — resolves string selectors to Object3D nodes | `loader.js` (populates aliases), `camera.js`, `hover.js`, `api.js` |
| Hover | `viewer/hover.js` | `_applyHover()`, `_clearHover()`, `_applyExternalHover()` — emissive glow, raycaster, poi dispatch, material cloning | `scene.js` (scene/camera/renderer), `selectors.js`, `api.js` (post) |
| API | `viewer/api.js` | `window.addEventListener('message')` dispatcher; `post()` helper; legacy alias mapping; `setOrbitConstraints`, `setDebug` | All functional modules (calls into them), `scene.js` (controls) |
| Debug GUI | `viewer/debug.js` | lil-gui panel, camera readout, arc parameter tuning, "Copy Button JS" snippet; only loaded when `?gui=1` | `scene.js`, `camera.js`, `config.js` |

## Recommended Project Structure

```
3d-viewer/
├── viewer/
│   ├── index.html          # Shell: importmap + <script type="module" src="./viewer.js">
│   ├── viewer.js           # Entry: init sequence, render loop, wires modules together
│   ├── config.js           # URL param parsing → exported config objects
│   ├── scene.js            # Three.js renderer/scene/camera/lights/resize
│   ├── camera.js           # Tween engine, arc/linear camera travel, frameObject
│   ├── loader.js           # GLTFLoader setup, loadModel, createDemoModel, detectWheels
│   ├── selectors.js        # resolveSelector, aliases Map
│   ├── hover.js            # Emissive hover highlight, raycaster, poi events
│   ├── api.js              # postMessage dispatcher (inbound + outbound), legacy map
│   └── debug.js            # lil-gui panel (conditional, dynamic import)
├── embed/
│   └── webcomponent.js     # <x-3d-viewer> custom element (unchanged)
├── host-example/
│   ├── index.html          # Reference integration (unchanged)
│   └── webcomponent.html   # Web Component demo (unchanged)
├── assets/
│   └── ae86.glb
├── vendor/                 # All libs self-hosted (unchanged)
│   ├── three.module.min.js
│   ├── lil-gui.esm.min.js
│   └── addons/
├── docs/
│   └── api.md
├── package.json            # For npm publishing (type: "module", exports field)
└── README.md
```

### Structure Rationale

- **`viewer/index.html` stays as the iframe entry point** — it is the public-facing URL that hosts embed. It now contains only the importmap and a single `<script type="module" src="./viewer.js">` tag. HTML shell is minimal; all logic is in `.js` files.
- **`viewer/viewer.js` as orchestrator** — this is the one file that imports everything else and wires it together. It owns the render loop `requestAnimationFrame`. No other module imports from sibling modules (with the exception of `api.js` which needs references passed in).
- **`config.js` extracted first** — URL param parsing has no Three.js dependency and is easy to unit-test. Extracting it gives every other module a clean import instead of reading `url.searchParams` inline.
- **`scene.js` owns Three.js objects** — `renderer`, `scene`, `camera`, `controls` are created here and passed (not re-imported) to other modules. This avoids circular imports. Scene is the dependency root.
- **`camera.js` takes no DOM reference** — it receives `{ camera, controls, scene }` and `arcCfg`/`animCfg` via parameters. This makes it independently testable.
- **`loader.js` owns DRACO/KTX2 paths** — decoder paths are relative to `viewer/index.html`; keeping them in one place avoids drift.
- **`selectors.js` is a pure data module** — exports a `Map` and a `resolveSelector()` function. No Three.js imports needed at module level (only receives `root` at runtime).
- **`hover.js` owns all material mutation** — material cloning and emissive state live here only. Nothing else mutates materials.
- **`api.js` is the postMessage boundary** — everything that crosses the iframe boundary is in one file. Legacy aliases are mapped here, not scattered through business logic.
- **`debug.js` uses dynamic import** — `if (showGui) { const { initDebug } = await import('./debug.js'); initDebug(...) }` — lil-gui code is zero-cost in production.

## Architectural Patterns

### Pattern 1: Dependency Injection via Init Functions

**What:** Each module exports an `init(deps)` function that receives its dependencies as parameters rather than importing them from sibling modules. The orchestrator (`viewer.js`) constructs the dependency graph by calling init functions in order.

**When to use:** Any module that needs references to Three.js objects (`scene`, `camera`, `controls`, `renderer`) or configuration objects. This pattern avoids circular ES module imports.

**Trade-offs:** Slightly more wiring code in `viewer.js`; in return, zero circular dependency risk, full testability.

**Example:**
```js
// camera.js
let _camera, _controls, _arcCfg, _animCfg;

export function initCamera({ camera, controls, arcCfg, animCfg }) {
  _camera = camera; _controls = controls;
  _arcCfg = arcCfg; _animCfg = animCfg;
}

export function animateCameraArc(targetPos, targetLook, durationMs) { /* ... */ }

// viewer.js (orchestrator)
import { initCamera, animateCameraArc } from './camera.js';
const { camera, controls } = initScene();
initCamera({ camera, controls, arcCfg, animCfg });
```

### Pattern 2: Single postMessage Boundary (api.js)

**What:** All `window.addEventListener('message', ...)` and all `window.parent.postMessage(...)` calls live exclusively in `api.js`. Business-logic modules (camera, loader, hover) never call postMessage directly — they receive a `post()` callback or emit via a returned value.

**When to use:** Always. This is the key architectural invariant that keeps the postMessage protocol auditable in one place. The legacy alias map also lives here.

**Trade-offs:** `api.js` has many imports (it calls into every functional module). This is acceptable because it is the integration boundary, not a domain module.

**Example:**
```js
// api.js
export function initApi({ post, camera, loader, hover, controls, selectors }) {
  window.addEventListener('message', ({ data, origin }) => {
    const { type, payload } = data;
    switch (type) {
      case 'animateCamera': camera.animateCameraArc(...); break;
      case 'setCamera':     camera.animateCameraTo(...); break;  // legacy
      // ...
    }
  });
}
```

### Pattern 3: Dynamic Import for Debug GUI

**What:** The lil-gui panel (`debug.js`) is imported with `await import('./debug.js')` only when `?gui=1` is present in the URL. No static import means zero parse/execution cost in production.

**When to use:** Any feature that is conditionally activated and has meaningful code size (lil-gui is ~50 KB).

**Trade-offs:** Async init; the debug panel appears slightly after the rest of the viewer. Acceptable since it is developer tooling.

**Example:**
```js
// viewer.js
const showGui = url.searchParams.get('gui') === '1';
if (showGui) {
  const { initDebug } = await import('./debug.js');
  initDebug({ scene, camera, controls, arcCfg, animCfg });
}
```

### Pattern 4: Import Map for Zero-Build Vendoring

**What:** `viewer/index.html` declares an `<script type="importmap">` mapping `"three"` and `"three/addons/"` to `../vendor/`. All viewer modules use bare specifiers (`import * as THREE from 'three'`). No relative `../../vendor/` paths appear in business logic files.

**When to use:** Always in zero-build contexts. This is the Three.js-blessed approach for no-bundler projects (confirmed by Three.js official installation docs).

**Constraint:** Import maps must be declared in `viewer/index.html` — the file that the browser loads first. Modules loaded as `src="./viewer.js"` inherit the map. This means `viewer.js` and all its imports can use bare specifiers without change.

**Important:** Each HTML page that loads Three.js modules needs its own importmap. The `host-example/` pages already do this. The Web Component (`embed/webcomponent.js`) does not import Three.js directly — it only manages the iframe — so it needs no importmap.

## Data Flow

### Initialization Flow

```
Browser loads viewer/index.html
  → importmap parsed
  → <script type="module" src="./viewer.js"> executed
      → config.js: URL params parsed → arcCfg, animCfg, camMinY/Max, theme
      → scene.js: renderer, scene, camera, controls, lights created
      → loader.js initLoader({ scene, post })
      → hover.js initHover({ scene, camera, renderer })
      → api.js initApi({ camera, loader, hover, controls, selectors, post })
      → (optional) debug.js loaded via dynamic import if ?gui=1
      → loadModel(modelUrl) OR createDemoModel()
          → post({ type: 'loading', payload: { progress } })  [during load]
          → detectWheels(root) → aliases Map populated
          → post({ type: 'aliases', payload: { mapped, candidates } })
          → frameObject(root, camera, controls)
      → post({ type: 'ready', payload: { apiVersion: '1.0.0' } })
      → requestAnimationFrame(loop) started
```

### Command Flow (Host → Viewer)

```
Host: iframe.contentWindow.postMessage({ type, payload }, origin)
  → api.js: message event fires, type dispatched in switch
      → camera.animateCameraArc(pos, look, duration)   [for 'animateCamera'/'focus']
      → loader.loadModel(url)                           [for hypothetical 'loadModel']
      → hover._applyExternalHover(selector)            [for 'setHover']
      → scene.controls.enabled = bool                  [for 'setOrbitEnabled']
      → animCfg.enabled = bool                         [for 'setAnimationEnabled']
  → render loop picks up state change next frame
```

### Event Flow (Viewer → Host)

```
User interaction or internal trigger
  → e.g. hover.js raycaster finds a mesh → onPick()
  → post({ type: 'poi', payload: { id, name } })
      → window.parent.postMessage({ source: 'viewer', type: 'poi', payload }, ALLOW_ORIGIN)
  → Host: window.addEventListener('message') → d.source === 'viewer' guard → d.type dispatch
```

### Render Loop

```
requestAnimationFrame(loop) in viewer.js
  → controls.update()                  // orbit damping (scene.js exports controls)
  → camera.y = clamp(camMinY, camMaxY) // config-driven constraint
  → renderer.render(scene, camera)
```

### State Ownership

| State | Owner Module | Access Pattern |
|-------|-------------|----------------|
| `root` (loaded model) | `loader.js` | Returned from `loadModel()`, held by `viewer.js`, passed to `hover`, `camera` |
| `camera`, `controls` | `scene.js` | Created, returned; passed to `camera.js`, `hover.js`, `api.js` |
| `arcCfg`, `animCfg` | `config.js` | Exported mutable objects; modules hold reference — mutations propagate automatically |
| `aliases` Map | `selectors.js` | Mutable Map; `loader.js` populates it; `api.js`/`camera.js`/`hover.js` read via `resolveSelector()` |
| `tweenToken` | `camera.js` | Internal to camera module — cancellation token for in-flight animations |
| `_hoveredMesh` | `hover.js` | Internal to hover module |

## Build Order (Phase Dependencies)

Modules must be implemented in dependency order during the refactor:

```
1. config.js          — no Three.js dependency, pure URL param parsing
2. scene.js           — depends on config.js (theme); creates Three.js objects
3. selectors.js       — pure data structure, no Three.js at module load
4. camera.js          — depends on scene.js objects + config.js
5. loader.js          — depends on scene.js, selectors.js, post() callback
6. hover.js           — depends on scene.js objects, selectors.js
7. api.js             — depends on all of the above (integration layer)
8. debug.js           — depends on all of the above (dev tooling)
9. viewer.js          — imports all, wires them together, starts render loop
10. viewer/index.html — replace <script type="module"> block with <script type="module" src="./viewer.js">
```

## GitHub Pages Structure

### Recommended: `/docs` Folder on `master`

For this project, the `/docs` folder approach on the `master` branch is the right choice.

**Rationale:**
- No build step, so there is nothing to "compile" to a separate `gh-pages` branch
- The viewer source files ARE the deployable files — no transformation needed
- Keeping demo on `master` means a single `git push` updates both source and demo
- GitHub Pages supports `/docs` folder publishing from main branch natively (confirmed by GitHub official docs)
- A `gh-pages` branch is primarily useful when a CI build produces an artifact to deploy — not applicable here

**Structure:**

```
3d-viewer/
├── docs/                   # GitHub Pages root (publish source = /docs on master)
│   ├── index.html          # Demo landing page (links to viewer, shows embed code)
│   ├── demo.html           # Live viewer demo with AE86 model embedded
│   └── api.md              # API reference (move from current docs/api.md)
├── viewer/                 # The actual viewer (deployed as-is via gh-pages)
├── vendor/                 # Self-hosted libs (committed, served as-is)
├── assets/                 # Demo models (ae86.glb only — large files gitignored)
└── embed/
    └── webcomponent.js
```

**GitHub Pages URL:** `https://designhaus-berlin.github.io/3d-viewer/`
**Viewer URL:** `https://designhaus-berlin.github.io/3d-viewer/viewer/index.html?model=../assets/ae86.glb`
**Demo page:** `https://designhaus-berlin.github.io/3d-viewer/docs/`

**Configuration:** Repository Settings → Pages → Source: "Deploy from a branch" → Branch: `master` → Folder: `/docs`.

Note: The demo page in `docs/` embeds the viewer via `<iframe src="../viewer/index.html?model=...">` using a relative path — this works because both are served from the same origin on GitHub Pages.

## npm Publishable Package

### Goal

Allow downstream users to install the web component and optionally import viewer utilities:
```bash
npm install @designhaus/3d-viewer
```
```js
import '@designhaus/3d-viewer/webcomponent';  // registers <x-3d-viewer>
```

### package.json Structure

```json
{
  "name": "@designhaus/3d-viewer",
  "version": "1.0.0",
  "type": "module",
  "files": ["viewer/", "embed/", "vendor/", "assets/ae86.glb"],
  "exports": {
    ".": "./viewer/viewer.js",
    "./webcomponent": "./embed/webcomponent.js",
    "./viewer.js": "./viewer/viewer.js"
  },
  "main": "./viewer/viewer.js",
  "keywords": ["three.js", "gltf", "3d-viewer", "iframe", "web-component"],
  "peerDependencies": {}
}
```

**Key decisions:**
- `"type": "module"` — all `.js` files are treated as ESM by Node.js tooling
- `"exports"` field establishes the public API surface and prevents consumers from reaching internal modules
- No `peerDependencies` on Three.js — vendor libs are self-hosted inside the package
- The web component (`embed/webcomponent.js`) is the primary npm artifact; the viewer itself is deployed separately via GitHub Pages / self-hosting
- No build step in `package.json`; `prepublishOnly` can run a lint or test check only
- `"files"` array explicitly whitelists what ships on npm — excludes `.planning/`, `host-example/`, `serve.js`, large GLB files

**Constraint:** Because Three.js is bundled in `vendor/`, npm package size will be significant (~1 MB+). This is a known trade-off of the self-hosted, zero-CDN constraint. Document this clearly in README.

## Anti-Patterns

### Anti-Pattern 1: Circular Module Imports

**What people do:** `camera.js` imports from `hover.js`, and `hover.js` imports from `camera.js` to share `camera` object.

**Why it's wrong:** ES module circular imports cause one module to see an incomplete export at load time, producing `undefined` errors that are hard to debug.

**Do this instead:** Both modules receive `camera` as a parameter injected by `viewer.js`. No sibling imports.

### Anti-Pattern 2: Splitting the Import Map Across Files

**What people do:** Add additional `<script type="importmap">` blocks in module files or try to extend the map dynamically.

**Why it's wrong:** There must be exactly one importmap per HTML document; it must appear before any module script. Multiple importmaps are a parse error in current browsers.

**Do this instead:** The single importmap lives in `viewer/index.html`. All modules use bare specifiers that the one map resolves.

### Anti-Pattern 3: Making `api.js` a God Object

**What people do:** Put all business logic (tween execution, raycaster math, GLTF loading) inside the postMessage switch statement.

**Why it's wrong:** Reproduces the monolith problem — just in `api.js` instead of `index.html`.

**Do this instead:** `api.js` dispatches to named functions from other modules. Each `case` in the switch is one function call, nothing more.

### Anti-Pattern 4: Moving Vendor Files Into `src/`

**What people do:** Copy `three.module.min.js` into a `src/vendor/` or `lib/` folder inside the new module tree.

**Why it's wrong:** The existing importmap in `viewer/index.html` already resolves `"three"` → `../vendor/`. Moving the vendor files breaks the relative path without any benefit.

**Do this instead:** Leave `vendor/` at its current location. The importmap handles the aliasing. Only the viewer `.js` modules move — from inline `<script>` to `viewer/*.js` files.

### Anti-Pattern 5: `gh-pages` Branch for a Zero-Build Project

**What people do:** Set up a CI workflow to push to a `gh-pages` branch.

**Why it's wrong:** The source files ARE the deployable files. A separate branch adds complexity and sync risk with no benefit.

**Do this instead:** Use `/docs` folder on `master`. Push once, both source and demo update.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `viewer.js` ↔ `scene.js` | Direct function calls, returned objects | scene.js exports init function returning `{ renderer, scene, camera, controls }` |
| `viewer.js` ↔ `api.js` | `initApi({ ... })` with all module references | api.js holds references but does not re-export them |
| `api.js` ↔ `camera.js` | Function calls (`animateCameraArc`, etc.) | camera functions are pure: take params, return nothing, mutate Three.js objects in-place |
| `loader.js` ↔ `selectors.js` | `aliases` Map mutation | loader populates `aliases` after load; selectors exports the Map and `resolveSelector()` |
| `hover.js` ↔ `selectors.js` | `resolveSelector()` call | hover passes selector string, gets Object3D back |
| `config.js` ↔ all | Shared mutable config objects | `arcCfg` and `animCfg` are plain objects; modules hold the same reference — mutations (from debug GUI) propagate without events |

### External Boundaries (Unchanged)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Host Page ↔ Viewer | `postMessage` (iframe boundary) | All inbound/outbound in `api.js` |
| Web Component ↔ Viewer | `postMessage` + attribute reflection | `embed/webcomponent.js` unchanged |
| Viewer ↔ Vendor | ES module imports via importmap | `vendor/` unchanged |
| Viewer ↔ WASM | `DRACOLoader.setDecoderPath()`, `KTX2Loader.setTranscoderPath()` | Paths relative to `viewer/index.html` origin — unchanged |

## Sources

- Three.js official installation guide (import maps): https://threejs.org/manual/en/installation.html
- GitHub Pages publishing source options: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- package.json exports field reference: https://hirok.io/posts/package-json-exports
- three-gltf-viewer (donmccurdy) module split reference: https://github.com/donmccurdy/three-gltf-viewer
- three-cad-viewer layered architecture reference: https://github.com/bernhard-42/three-cad-viewer
- Node.js ESM packages official docs: https://nodejs.org/api/packages.html

---
*Architecture research for: Self-hosted Three.js 3D Viewer — ES module refactor*
*Researched: 2026-04-13*
