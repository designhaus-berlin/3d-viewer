# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**CDN (host-example only):**
- jsDelivr CDN — delivers DB UX Design System CSS
  - `https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css`
  - `https://cdn.jsdelivr.net/npm/@db-ux/core-components@4.5.0/build/styles/rollup.css`
  - Only loaded by `host-example/index.html`; the core viewer has zero external network requests

**All other dependencies:** self-hosted under `vendor/` — no CDN, no npm at runtime

## Data Storage

**Databases:**
- None — no database integration of any kind

**File Storage:**
- Local filesystem / static hosting only
- 3D models served as static `.glb` files from `assets/`:
  - `assets/ae86.glb` — Toyota AE86 test model
  - `assets/260302_Dresden-Cotta_gesamt.glb` — Dresden urban planning model
- Model URL is passed as a URL parameter (`?model=<relative-path>`) at runtime

**Caching:**
- None configured explicitly; relies on browser HTTP cache and server defaults

## Authentication & Identity

**Auth Provider:**
- None — no authentication, no login, no sessions

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, no Datadog, no external error service

**Logs:**
- `console.log('[host→viewer]', type, payload)` — all incoming postMessage calls logged to browser console
- Errors posted back to host via postMessage `type: 'error'` events

## CI/CD & Deployment

**Hosting:**
- XAMPP (Apache) for local development at `http://localhost/3d-viewer/`
- Any static file host for production (no server-side processing required)

**CI Pipeline:**
- None detected

## postMessage API (Host ↔ Viewer)

This is the primary integration point. The viewer (`viewer/index.html`) runs inside an `<iframe>` and communicates with the host page exclusively via `window.postMessage`.

**Viewer origin constant:** `const ALLOW_ORIGIN = '*'` (set in `viewer/index.html` line 620 — comment notes this should be hardened for production)

### Host → Viewer Commands

All messages have the shape `{ type: string, payload: object }`.

| Message type | Payload | Description |
|---|---|---|
| `animateCamera` | `{ position: {x,y,z}, target?: {x,y,z}, durationMs?: number }` | Linear camera move to exact coordinates |
| `focus` | `{ selector: string, padding?: number, durationMs?: number, position?: {x,y,z}, target?: {x,y,z} }` | Arc-swing camera to fit object in view; `selector: 'all'` targets whole model |
| `setVisibility` | `{ selector: string\|string[], visible: boolean }` | Show/hide meshes by name, id, tag, or alias |
| `setOrbitEnabled` | `{ enabled: boolean }` | Enable/disable OrbitControls |
| `setAnimationEnabled` | `{ enabled: boolean }` | Enable/disable camera transition animations (accessibility) |
| `setHover` | `{ selector: string\|null }` | Apply/clear external hover highlight (blue emissive glow) |
| `setOrbitConstraints` | `{ azimuthMin?, azimuthMax?, polarMin?, polarMax?, distanceMin?, distanceMax?, reset?: true }` | Restrict orbit range in degrees; `reset:true` clears all constraints |
| `setDebug` | `{ bounds: boolean }` | Toggle bounding-box wireframe helpers |

**Legacy commands (backward compatible):**

| Message type | Notes |
|---|---|
| `setCamera` | Replaced by `animateCamera` |
| `setVisible` | Replaced by `setVisibility` |
| `enableOrbit` | Replaced by `setOrbitEnabled` |
| `focusNode` | Replaced by `focus` |
| `focusWheel` | Wheel alias shortcut |
| `setWheelVisible` | Wheel alias shortcut |
| `playClip` | Stub — no implementation (empty case) |

### Viewer → Host Events

All events have the shape `{ source: 'viewer', type: string, payload: object }`.

| Event type | Payload | Description |
|---|---|---|
| `ready` | `{ apiVersion: '1.0.0' }` | Fired once after script init |
| `loading` | `{ progress: number }` (0–1) | Fired during GLB load via LoadingManager |
| `poi` | `{ id: string, name: string }` | Fired on mesh click/pick; id = userData.id or userData.tag or mesh.name |
| `aliases` | `{ mapped: object, candidates: string[] }` | Fired after wheel auto-detection; maps alias names to actual node names |
| `camera` | `{ position, target }` | Fired after legacy `setCamera` completes |
| `error` | `{ code: string, message: string }` | Fired on model load failure |

### Selector Resolution

The viewer resolves selectors in this order (implemented in `resolveSelector()` in `viewer/index.html`):
1. Alias map (e.g., `wheel1`–`wheel4` auto-detected by `detectWheels()`)
2. `object.name === selector`
3. `object.userData.id === selector`
4. `object.userData.tag === selector`

### Web Component Wrapper

`embed/webcomponent.js` wraps the iframe postMessage API as typed JS methods on `<x-3d-viewer>`:

```javascript
const el = document.querySelector('x-3d-viewer');
el.animateCamera(position, target, durationMs);
el.focus(selector, padding, durationMs);
el.setVisibility(selector, visible);
el.setOrbitEnabled(enabled);
// Legacy methods also available:
el.setCamera(position, target, durationMs);
el.focusNode(selector, padding);
el.setVisible(selector, visible);
el.enableOrbit(enabled);
el.playClip(name);
```

The component fires CustomEvents mirroring viewer postMessage events: `ready`, `poi`, `loading`, `error`, `aliases`.

**Attributes:** `src`, `model`, `theme`, `lang`, `aspect` (all observed for changes)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Blender Integration (Asset Pipeline)

Not a runtime integration, but a documented workflow affecting `userData` fields the viewer reads:

- Blender Custom Property `viewerPivot` (array `[x, y, z]`) on root object → used by `getModelPivot()` in `viewer/index.html` as the arc camera swing pivot
- Export setting: GLTF export with "Custom Properties" enabled
- Affects: `root.userData.viewerPivot` in Three.js scene

## Environment Configuration

**Required env vars:**
- None — configuration is entirely URL-parameter-based

**Secrets location:**
- None — no secrets in this project

---

*Integration audit: 2026-04-13*
