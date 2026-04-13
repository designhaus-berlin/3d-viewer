# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- JavaScript (ES2020+, native ESM modules) - All viewer logic, host integration, web component

**Secondary:**
- HTML5 - Viewer app shell (`viewer/index.html`), host example (`host-example/index.html`)
- CSS3 - Inline styles in all HTML files; no external CSS preprocessor

## Runtime

**Environment:**
- Browser (modern; requires import map support — Chrome 89+, Firefox 108+, Safari 16.4+)
- No build step or bundler: code runs directly as authored

**Server (optional, dev only):**
- Node.js - `serve.js` static file server, port 3001
- No npm/package.json — Node server uses only built-in `http`, `fs`, `path` modules

**Primary serving:**
- XAMPP (Apache) at `http://localhost/3d-viewer/` — no Node required

**Package Manager:**
- None — all dependencies are vendored locally under `vendor/`
- Lockfile: not applicable

## Frameworks

**Core:**
- Three.js (self-hosted, minified) — 3D rendering engine
  - Location: `vendor/three.module.min.js`
  - Import via importmap: `"three": "../vendor/three.module.min.js"`

**UI / Debug:**
- lil-gui (self-hosted, minified) — debug control panel
  - Location: `vendor/lil-gui.esm.min.js`
  - Activated by URL param `?gui=1` or `?debug=gui`

**Host UI (host-example only):**
- DB UX Design System v4.5.0 — Deutsche Bahn component library loaded via CDN
  - `@db-ux/core-foundations@4.5.0` (CSS rollup)
  - `@db-ux/core-components@4.5.0` (CSS rollup)
  - Source: `https://cdn.jsdelivr.net/npm/...`
  - Used for buttons (`db-button`), accordion (`db-accordion`, `db-accordion-item`)

**Web Component:**
- Vanilla Custom Elements v1 (`customElements.define`) — no framework
  - Location: `embed/webcomponent.js`
  - Tag: `<x-3d-viewer>`
  - Uses Shadow DOM (`attachShadow({ mode: 'open' })`)

**Testing:**
- None detected

**Build/Dev:**
- No bundler, no transpiler, no build pipeline

## Key Dependencies

**Critical:**
- `vendor/three.module.min.js` — entire 3D runtime; version not directly readable from minified file
- `vendor/addons/controls/OrbitControls.js` — camera interaction
- `vendor/addons/loaders/GLTFLoader.js` — GLTF/GLB model loading
- `vendor/addons/loaders/DRACOLoader.js` — Draco mesh compression support
- `vendor/addons/loaders/KTX2Loader.js` — KTX2 texture compression support
- `vendor/addons/utils/BufferGeometryUtils.js` — geometry utilities
- `vendor/addons/utils/WorkerPool.js` — worker pool for loaders

**Codec/Transcoder Assets (binary):**
- `vendor/addons/libs/draco/` — Draco WASM decoder (path set in `DRACOLoader.setDecoderPath`)
- `vendor/addons/libs/basis/` — Basis/KTX2 WASM transcoder (path set in `KTX2Loader.setTranscoderPath`)
- `vendor/addons/libs/ktx-parse.module.js` — KTX2 parsing
- `vendor/addons/libs/zstddec.module.js` — Zstandard decompression

## Configuration

**Environment:**
- No `.env` files; no server-side environment variables
- All configuration is passed via URL query parameters to `viewer/index.html`:
  - `?model=<url>` — GLB/GLTF asset URL (relative path)
  - `?theme=light|dark` — background color scheme (default: `dark`)
  - `?lang=de|en` — locale (default: `de`)
  - `?gui=1` or `?debug=gui` — enable lil-gui debug panel
  - `?anim=0` — disable camera/transition animations (accessibility)
  - `?arcLift=<float>` — arc camera lift factor (default: `0.4`)
  - `?arcMax=<float>` — arc camera max lift in radians (default: `1.0`)
  - `?arcSafe=<float>` — arc safe-radius factor (default: `0.0`)
  - `?camMinY=<float>` — minimum camera Y position in world space
  - `?camMaxY=<float>` — maximum camera Y position in world space
  - `?camPos=x,y,z` — initial camera position (used with debug GUI)
  - `?camTar=x,y,z` — initial camera target
  - `?fov=<float>` — initial field of view
  - `?canvasHover=0` — disable canvas-driven hover highlight

**Build:**
- No build config files (no webpack.config, vite.config, tsconfig, rollup.config, etc.)

## Platform Requirements

**Development:**
- Any static HTTP server (XAMPP Apache, or `node serve.js`)
- Modern browser with ES module import map support
- No npm install required

**Production:**
- Static file hosting only (no server-side logic)
- Files to serve: `viewer/`, `vendor/`, `assets/`, optionally `embed/`, `host-example/`
- CORS-compatible hosting required if viewer and host are on different origins

---

*Stack analysis: 2026-04-13*
