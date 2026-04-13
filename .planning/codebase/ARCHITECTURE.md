# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Iframe Isolation + postMessage Messaging

The viewer is a fully self-contained single-file application (`viewer/index.html`) embedded
in a host page via `<iframe>`. All control crosses the iframe boundary through a typed
`postMessage` protocol. The host never touches Three.js internals; it only sends and
receives JSON messages.

**Key Characteristics:**
- Zero build step — all JavaScript lives in a single `<script type="module">` block inside `viewer/index.html`
- Entirely self-hosted: no CDN, all vendor libs under `vendor/`
- Two embedding patterns: raw `<iframe>` (primary) or `<x-3d-viewer>` Web Component wrapper (`embed/webcomponent.js`)
- Message envelope uses `{ source: 'viewer', type, payload }` (outbound) and `{ type, payload }` (inbound)
- Legacy API aliases are preserved for backwards compatibility

## Layers

**Viewer Application:**
- Purpose: Three.js rendering, model loading, camera control, interaction handling
- Location: `viewer/index.html` (single `<script type="module">` block, ~815 lines)
- Contains: Scene setup, render loop, tween engine, postMessage handler, debug GUI
- Depends on: `vendor/three.module.min.js`, `vendor/addons/`, `vendor/lil-gui.esm.min.js`
- Used by: Any host page via `<iframe>`

**Host Page / Embedding Layer:**
- Purpose: Application UI, business logic, user interaction, API calls into viewer
- Location: `host-example/index.html` (reference implementation)
- Contains: `send(type, payload)` helper, `window.addEventListener('message', ...)` listener, accordion/button wiring
- Depends on: Viewer iframe loaded at a relative URL
- Used by: End users

**Web Component Wrapper:**
- Purpose: Convenience wrapper; encapsulates iframe creation and postMessage wiring behind a DOM element interface
- Location: `embed/webcomponent.js`
- Contains: `X3DViewer extends HTMLElement`, Shadow DOM, attribute reflection, typed JS methods
- Depends on: `viewer/index.html` (loaded as `src` attribute)
- Used by: `host-example/webcomponent.html`

**Vendor / Runtime:**
- Purpose: Three.js rendering engine and loaders, debug GUI
- Location: `vendor/`
- Contains: `three.module.min.js`, `vendor/addons/controls/OrbitControls.js`, `vendor/addons/loaders/GLTFLoader.js`, `vendor/addons/loaders/DRACOLoader.js`, `vendor/addons/loaders/KTX2Loader.js`, `vendor/lil-gui.esm.min.js`
- Depends on: Nothing external (fully self-hosted)

## Data Flow

**Model Load Flow:**

1. Host embeds `viewer/index.html?model=path/to/model.glb` via `<iframe>`
2. Viewer reads `?model` URL param on startup
3. `loadModel(url)` calls `GLTFLoader.loadAsync()` (with DRACO + KTX2 support)
4. `loader.manager.onProgress` fires → viewer sends `{ type:'loading', payload:{progress} }` to host
5. On success: `root = gltf.scene` added to Three.js scene; `detectWheels(root)` runs; camera frames the model
6. `detectWheels` sends `{ type:'aliases', payload:{ mapped, candidates } }` to host
7. Viewer sends `{ type:'ready', payload:{ apiVersion:'1.0.0' } }` (sent immediately on startup, before model loads)
8. If no `?model`: `createDemoModel()` builds a procedural bridge scene

**Command Flow (Host → Viewer):**

1. Host calls `iframe.contentWindow.postMessage({ type, payload }, origin)`
2. Viewer's `window.addEventListener('message', ...)` switch-dispatches on `type`
3. Viewer mutates scene state (camera position, mesh visibility, orbit constraints)
4. Camera mutations trigger `controls.update()` inside the animation loop

**Event Flow (Viewer → Host):**

1. User clicks a mesh → `onPick()` → raycaster → `post({ type:'poi', payload:{ id, name } })`
2. Host receives `message` event, reads `d.source === 'viewer'`, dispatches on `d.type`
3. Example: host reacts to `poi` by sending `focus` command back to viewer

**Render Loop:**

```
requestAnimationFrame(loop)
  → controls.update()          // orbit damping
  → camMinY/camMaxY clamp      // world-space Y constraint
  → renderer.render(scene, camera)
```

**State Management:**
- All 3D state lives inside `viewer/index.html` (module scope variables: `root`, `camera`, `controls`, `scene`, `animCfg`, `arcCfg`, `tweenToken`)
- Host maintains its own UI state (e.g. `orbitOn` boolean, accordion open/close)
- No shared state object; communication is message-only

## Key Abstractions

**Selector Resolution (`resolveSelector`):**
- Purpose: Resolves a string selector to a Three.js Object3D node inside `root`
- Location: `viewer/index.html` (inline function, ~line 370)
- Resolution order: `aliases` Map (wheel1–4) → `object.name` → `userData.id` → `userData.tag`
- Special value `'all'` is handled inline in `setVisible` / `focus` (not via `resolveSelector`)

**Tween Engine:**
- Purpose: Lightweight animation without external dependency; cancellation-token pattern stops old animations when new ones start
- Location: `viewer/index.html` (`tween(durationMs, onUpdate, onDone)`, ~line 501)
- Easing: `easeInOutCubic`
- Accessibility: if `animCfg.enabled === false`, calls `onUpdate(1)` immediately (jump-to-end)

**Arc Camera (`animateCameraArc`):**
- Purpose: Camera travels along a spherical arc around the model pivot instead of a straight line (avoids clipping through geometry)
- Location: `viewer/index.html` (~line 566)
- Pivot source: `root.userData.viewerPivot` (Blender Custom Property) → fallback to bounding-box center (`getModelPivot()`)
- Configurable via `arcCfg` object (`liftFactor`, `liftMax`, `safeRadius`) — adjustable per URL param or Debug GUI live

**Linear Camera (`animateCameraTo`):**
- Purpose: Straight-line interpolation for `animateCamera` commands when an exact position is required
- Location: `viewer/index.html` (~line 523)
- Note: Despite the name difference, `animateCamera` in the postMessage API now calls `animateCameraArc`, not `animateCameraTo`

**Hover Highlight (dual-track):**
- Canvas hover: `pointermove` → raycaster → emissive glow (orange/grey, `0x666666`) on single mesh
- External hover: `setHover` postMessage from host → emissive glow (blue, `0x334488`) on all meshes of a selector
- Material cloning: materials are cloned on first hover to avoid contaminating shared materials

**Wheel Auto-Detection (`detectWheels`):**
- Purpose: Heuristically assigns `wheel1`–`wheel4` aliases to mesh nodes matching name patterns
- Location: `viewer/index.html` (~line 325)
- Pattern: regex `/(wheel|tire|tyre|rim|felge|rad|reifen)/i` on node name/id/tag
- Assigns each alias to the nearest candidate from four bounding-box corners (x/z plane)

**Web Component (`X3DViewer`):**
- Purpose: Custom element `<x-3d-viewer>` that wraps the iframe with Shadow DOM and typed methods
- Location: `embed/webcomponent.js`
- Observed attributes: `src`, `model`, `theme`, `lang`, `aspect`
- Methods: `animateCamera()`, `focus()`, `setVisibility()`, `setOrbitEnabled()` (plus legacy `focusNode()`, `setVisible()`, `enableOrbit()`, `setCamera()`)
- Re-dispatches viewer messages as DOM `CustomEvent` that bubble out of the shadow root

## Entry Points

**Viewer (primary entry point):**
- Location: `viewer/index.html`
- Triggers: Browser loads the HTML; `<script type="module">` executes immediately
- Responsibilities: Initialize Three.js scene, load model (or demo), start render loop, register postMessage listener, send `ready` event

**Host Example:**
- Location: `host-example/index.html`
- Triggers: Browser page load
- Responsibilities: Embed viewer iframe, wire accordion items to `focus`/`setHover`/`setOrbitConstraints` commands, handle viewer events (`ready`, `poi`, `loading`, `error`)

**Web Component:**
- Location: `embed/webcomponent.html` (usage) / `embed/webcomponent.js` (definition)
- Triggers: `customElements.define('x-3d-viewer', X3DViewer)` called when script loads; element upgraded when inserted into DOM
- Responsibilities: Create and manage iframe lifecycle, reflect HTML attributes to URL params, proxy method calls to postMessage

## postMessage API Design

All messages follow the same envelope structure:

**Inbound (Host → Viewer):** `{ type: string, payload: object }`
**Outbound (Viewer → Host):** `{ source: 'viewer', type: string, payload: object }`

The `source: 'viewer'` field on outbound messages lets hosts filter messages in multi-iframe pages.

**Current API (v1):**

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

**Outbound Events (Viewer → Host):**

| Event (type) | payload | When |
|---|---|---|
| `ready` | `{ apiVersion: '1.0.0' }` | Immediately on viewer script start |
| `loading` | `{ progress: 0.0–1.0 }` | During model loading |
| `poi` | `{ id, name }` | User clicks a mesh |
| `aliases` | `{ mapped, candidates }` | After wheel auto-detection completes |
| `camera` | `{ position, target }` | After `setCamera` (legacy) |
| `error` | `{ code, message }` | Model load failure |

**Legacy aliases (preserved for backwards compatibility):**

| Old name | Maps to |
|---|---|
| `setCamera` | `animateCameraTo` (immediate or animated) |
| `focusNode` | `focusNode()` (no arc, no padding animation) |
| `setVisible` | `setVisible()` |
| `enableOrbit` | `enableOrbit()` |
| `focusWheel` | `focus('wheel{index}', ...)` |
| `setWheelVisible` | `setVisible('wheel{index}', ...)` |

## Error Handling

**Strategy:** Non-throwing; errors post a message to the host and degrade gracefully.

**Patterns:**
- Model load failure: `catch(err)` in `loadModel` → `post({ type:'error', payload:{ code:'MODEL_LOAD', message } })` → progress indicator shows "Fehler beim Laden"
- Invalid selector: `resolveSelector` returns `null`; callers (`focus`, `setVisible`) silently return early
- URL param parsing: wrapped in `try/catch` with `/* ignore */`; bad values fall back to defaults
- Debug GUI clipboard: `.catch()` on `navigator.clipboard.writeText` logs to console as fallback
- Missing model: falls back to `createDemoModel()` (procedural bridge scene)

## Cross-Cutting Concerns

**Accessibility:** `prefers-reduced-motion` media query read at startup; stored in `animCfg.enabled`; overridable via `?anim=0|1` URL param or `setAnimationEnabled` message; all tweens check `animCfg.enabled` and skip to end-state if false.

**Responsive Sizing:** `ResizeObserver`-equivalent via `window.addEventListener('resize', applySize)` (passive); `applySize()` reads `getBoundingClientRect()` and calls `renderer.setSize(w, h, true)` to keep canvas in sync.

**Security:** `ALLOW_ORIGIN = '*'` with a comment noting it should be hardened in production. The Web Component reads `u.origin` from the resolved src URL and uses it as the target origin for `postMessage`.

**Debug GUI:** Loaded only when `?gui=1` or `?debug=gui` is present. Provides live camera inspection, arc parameter tuning, and clipboard helpers. Does not affect production rendering.

---

*Architecture analysis: 2026-04-13*
