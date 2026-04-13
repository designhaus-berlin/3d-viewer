# Codebase Concerns

**Analysis Date:** 2026-04-13

**Triage Date:** 2026-04-13

**Status legend:**
- ✅ Fixed — resolved in named phase or quick-fix
- 📋 Planned — scheduled for named phase/requirement
- 📝 Documented — acknowledged, no code change required; documented in api.md or README
- 🗂 Backlog — out of v1 scope; revisit for v2

---

## Tech Debt

**Monolithic single-file architecture:**
- **Status:** 📋 Phase 4 (MOD-01–MOD-09): modularisation
- Issue: All viewer logic (Three.js setup, model loading, picking, hover, animations, postMessage API, debug GUI) lives in one `<script type="module">` inside `viewer/index.html` (815 lines). HTML, CSS, and JS are fully interleaved with no module boundaries.
- Files: `viewer/index.html`
- Impact: Every new feature or bug fix risks unintended side effects; refactoring any subsystem requires understanding the entire file. No tree-shaking or dead-code elimination possible.
- Fix approach: Extract JS into separate ES modules (e.g., `viewer/src/camera.js`, `viewer/src/api.js`, `viewer/src/hover.js`) imported via `<script type="module" src="...">`. HTML stays as shell only.

**Legacy API layer not sunset:**
- **Status:** 📋 Phase 2 (DOC-03) + console.warn added in quick-fix 260413
- Issue: Six legacy message types (`setCamera`, `setVisible`, `enableOrbit`, `focusNode`, `focusWheel`, `setWheelVisible`) are documented as deprecated but handled in the same `switch` block alongside the new API, with no deprecation warnings emitted to hosts.
- Files: `viewer/index.html` lines 782–800, `embed/webcomponent.js` lines 89–94
- Impact: New integrations could unknowingly use stale method names. Dead code accumulates as the old API is never removed.
- Fix approach: Emit a `console.warn` when legacy message types are received; schedule removal after a migration window.

**`playClip` is a documented no-op stub:**
- **Status:** ✅ Fixed in quick-fix 260413: console.warn emitted; full AnimationMixer deferred to backlog
- Issue: `case 'playClip':` in the message handler has an empty body (no `AnimationMixer`, no `AnimationClip` support). The method is also exposed on the Web Component (`el.playClip(name)`). The API docs do not list it, but it is present in `webcomponent.js`.
- Files: `viewer/index.html` line 801, `embed/webcomponent.js` line 94
- Impact: Hosts calling `playClip` silently do nothing. GLTF models with baked animations cannot be controlled.
- Fix approach: Implement `THREE.AnimationMixer` in `loadModel()` and wire up `playClip`/`stopClip`; or explicitly remove the stub and document the gap.

**Debug `console.log` left in production message handler:**
- **Status:** ✅ Fixed in Phase 1 (SEC-02): guarded behind showGui flag
- Issue: `console.log('[host→viewer]', type, payload)` fires on every incoming postMessage, unconditionally, including in production builds.
- Files: `viewer/index.html` line 731
- Impact: Every API call floods the browser console; exposes full payload data (including camera coordinates and selectors) to any third-party script that has console access.
- Fix approach: Guard behind `if (showGui)` or the existing `?gui=1` flag, or remove entirely.

**Inline import map uses relative `../vendor/` path:**
- **Status:** 📋 Phase 4: path restructured during modularisation
- Issue: The import map in `viewer/index.html` resolves `three` to `../vendor/three.module.min.js`. This works only when the viewer is served from `viewer/`. Any path change (e.g., moving to `app/viewer/`) silently breaks all Three.js imports with no useful error.
- Files: `viewer/index.html` lines 20–27
- Impact: Fragile to directory restructuring.
- Fix approach: Publish an absolute import map at the root level, or use a build step to inject the correct path.

---

## Security Considerations

**`ALLOW_ORIGIN = '*'` hardcoded in outbound postMessage:**
- **Status:** 📋 Phase 2: set after GitHub Pages origin is known (deploy target not yet finalised)
- Risk: The viewer posts events (`ready`, `poi`, `loading`, `error`, `camera`, `aliases`) to `parent` with target origin `'*'`. Any page that embeds the viewer in an iframe — including a malicious cross-origin page — receives all events. The comment says "In Produktion hart setzen" but this is never enforced.
- Files: `viewer/index.html` line 620–622
- Current mitigation: None. The wildcard is intentional for dev convenience.
- Recommendations: Set `ALLOW_ORIGIN` to the known host origin passed as a URL param (e.g., `?origin=https://example.com`) and validate it server-side or against an allowlist before use.

**Inbound postMessage has no origin validation:**
- **Status:** ✅ Fixed in Phase 1 (SEC-01): event.origin checked against allowedOrigin URL param
- Risk: `window.addEventListener('message', ...)` in `viewer/index.html` accepts messages from any origin (`event.origin` is never checked). Any script on any page that can reference the iframe's `contentWindow` (or guess it) can send arbitrary API commands (disable orbit, hide geometry, animate camera).
- Files: `viewer/index.html` line 726–807
- Current mitigation: The `webcomponent.js` wrapper correctly validates `ev.origin` against `this._origin` (line 41), but this protection only exists when using the Web Component — not when the iframe is embedded directly as in `host-example/index.html`.
- Recommendations: Check `event.origin` at the top of the message handler. Accept a `?allowedOrigin=` URL param at load time and reject messages from other origins.

**`host-example/index.html` sends postMessage to `ORIGIN = '*'`:**
- **Status:** ✅ Fixed in quick-fix 260413: ORIGIN derived from new URL(iframe.src).origin
- Risk: `const ORIGIN = '*'` is used for all outbound commands to the iframe. Identical problem as above — on any cross-origin embed, commands could be intercepted.
- Files: `host-example/index.html` line 273–276
- Current mitigation: None.
- Recommendations: Derive origin from `iframe.src` before sending, same as `webcomponent.js` does.

**`sandbox="allow-same-origin"` weakens iframe isolation:**
- **Status:** 📝 Documented: requires separate subdomain to safely remove; deferred — no subdomain configured
- Risk: Both `host-example/index.html` and `webcomponent.js` grant `allow-same-origin` to the iframe. Combined with `allow-scripts`, this means the viewer iframe can access `parent.document`, `parent.localStorage`, and `parent.cookies` if served from the same origin. This negates most iframe sandboxing.
- Files: `host-example/index.html` line 178, `embed/webcomponent.js` line 35
- Current mitigation: The viewer is self-contained and does not attempt parent DOM access today.
- Recommendations: Only grant `allow-same-origin` if the viewer is on a separate subdomain or path that truly requires it for the import map. Otherwise, consider serving viewer from a different origin so `allow-same-origin` can be removed.

**Model URL parameter is not validated:**
- **Status:** 🗂 Backlog: requires allowlist config or CSP connect-src; no current deploy target to constrain
- Risk: `url.searchParams.get('model')` is passed directly to `GLTFLoader.loadAsync()` with no allowlist check. An attacker who can control the iframe src URL can point the viewer at arbitrary URLs, triggering authenticated fetches from the viewer's origin.
- Files: `viewer/index.html` line 54, 256–283
- Current mitigation: Errors are caught and reported via postMessage, but the fetch still occurs.
- Recommendations: Validate `modelUrl` against an allowlist of permitted origins/paths before loading, or restrict via server-level CSP `connect-src`.

---

## Performance Bottlenecks

**Per-pointer-event full scene traverse for raycasting:**
- **Status:** 📋 Phase 3 (PERF-02): cache mesh array after model load
- Problem: On every `pointermove` (throttled to rAF), `root.traverse()` is called to collect all visible meshes into a fresh array, then `raycaster.intersectObjects()` runs on the full list.
- Files: `viewer/index.html` lines 431–434
- Cause: No cached mesh list; array is rebuilt every frame. For the Dresden-Cotta model with 700+ objects, this is O(n) per frame.
- Improvement path: Cache the mesh array once after model load and update only when visibility changes. Use `raycaster.intersectObjects(meshCache, false)` (non-recursive since meshes are already collected flat).

**Multiple redundant `Box3.setFromObject(root)` calls per `focus()` invocation:**
- **Status:** 📋 Phase 3 (PERF-02): cache bounding box after load
- Problem: A single call to `focus()` can trigger up to 3 separate `new THREE.Box3().setFromObject(root)` or `setFromObject(targetObj)` calls (lines 683, 695, 699).
- Files: `viewer/index.html` lines 683–699
- Cause: Each call walks the full scene graph. On a 700-object model, each walk is expensive.
- Improvement path: Compute and cache the model's bounding box once after load; invalidate on visibility change.

**`syncFromCamera()` monkey-patches `renderer.render` when debug GUI is active:**
- **Status:** 📋 Phase 3 or Phase 4: move to controls.change event
- Problem: When `?gui=1`, `renderer.render` is replaced with a wrapper that calls `syncFromCamera()` every frame, which iterates all `gui.controllersRecursive()` and calls `updateDisplay()` on each.
- Files: `viewer/index.html` lines 216–217
- Cause: Synchronization is done inside the render loop rather than on a `controls.change` event.
- Improvement path: Listen to `controls.addEventListener('change', syncFromCamera)` instead of wrapping `renderer.render`.

---

## Fragile Areas

**`ready` event fires before model is loaded:**
- **Status:** ✅ Fixed in quick-fix 260413: modelReady event posted after loadModel() success
- Files: `viewer/index.html` line 623 (ready posted at script end), lines 273–283 (model loaded async)
- Why fragile: Hosts that listen for `ready` and immediately call `focus()` or `animateCamera()` will receive silently ignored commands because `root` is `null` until `loadModel()` resolves. There is no second event signalling model readiness.
- Safe modification: Add a `modelReady` event posted at the end of `loadModel()` success path (after `frameObject`). Document that `focus`/`setVisibility` commands before `modelReady` are queued or ignored.

**Material cloning creates unbounded GPU memory growth:**
- **Status:** 📋 Phase 3 (PERF-03): dispose cloned materials on model replace
- Files: `viewer/index.html` lines 395–398, 451–454
- Why fragile: Every mesh that is ever hovered gets its material cloned (guarded by `_matCloned` flag). Cloned materials are never disposed when the model is unloaded or when hover state clears. For a 700+ mesh model, each interactive session accumulates cloned `MeshStandardMaterial` instances that are never freed.
- Safe modification: Track all cloned materials in an array; call `material.dispose()` when the model is replaced or the page unloads.

**`resolveSelector` does a linear traverse on every API call:**
- **Status:** 📋 Phase 4: build name/id/tag index on modularisation
- Files: `viewer/index.html` lines 371–380
- Why fragile: Every `focus`, `setVisibility`, `setHover`, and `focusNode` call traverses the full scene graph. If the graph is deep (Dresden-Cotta: 700+ nodes), repeated API calls cause stutter. There is no index.
- Safe modification: Build a `Map<string, Object3D>` keyed by `name`, `userData.id`, and `userData.tag` immediately after model load; use the map in `resolveSelector` instead of traversal.

**Hover state is split across two separate systems that can conflict:**
- **Status:** 📋 Phase 4: unify into HoverManager on modularisation
- Files: `viewer/index.html` lines 388–436 (canvas hover), 442–470 (external hover via `setHover`)
- Why fragile: Both systems independently clone materials and manipulate emissive color. If a canvas-hover is active on mesh A, and then `setHover` targets a group containing mesh A, both `_hoveredMesh` and `_extHoveredMeshes` reference mesh A's cloned material with different emissive colors, and the clear order is undefined.
- Safe modification: Unify both hover systems into a single `HoverManager` class with priority rules (external hover wins, clears canvas hover).

**`arcCfg.safeRadius` is `0` by default (feature silently disabled):**
- **Status:** 📝 Document in Phase 2 api.md; consider enabling sane default (0.5)
- Files: `viewer/index.html` line 76, 575–580
- Why fragile: The safe-radius guard that prevents the camera from flying through the model bounding sphere is off by default. Hosts relying on collision-free arc transitions must discover and set `?arcSafe=0.85` via docs. The GUI mentions it but the URL param name differs from the GUI label in wording.
- Safe modification: Document the default explicitly in `api.md`; consider enabling a sane default (e.g., `0.5`) for real-model use cases.

---

## Known Bugs

**`setOrbitConstraints` / `setHover` / `setAnimationEnabled` undocumented in `docs/api.md`:**
- **Status:** 📋 Phase 2 (DOC-01): add to api.md
- Symptoms: Three implemented and used message types are missing from the public API reference.
- Files: `docs/api.md`, `viewer/index.html` lines 751–757, 759–779
- Trigger: Any integrator reading docs only. `host-example/index.html` uses `setOrbitConstraints` and `setHover` directly.
- Workaround: Read source code.

**`onPick` (pointerdown) does not filter invisible meshes:**
- **Status:** ✅ Fixed in quick-fix 260413: o.isMesh && o.visible filter added
- Symptoms: Clicking on a region where a hidden mesh overlaps a visible one can fire a `poi` event for the invisible mesh.
- Files: `viewer/index.html` line 479
- Trigger: After `setVisible(selector, false)`, clicking over the hidden region. Compare with hover handler which correctly filters `o.visible` (line 431).
- Workaround: None at the API level. Host must ignore `poi` events for selectors it knows are hidden.

---

## Dependencies at Risk

**Three.js r160 — self-hosted, no automated updates:**
- **Status:** 🗂 Backlog: manual vendor upgrade; no npm, no build step
- Risk: Three.js is vendored as a minified bundle (`vendor/three.module.min.js`) with no package manager entry. Security patches, API changes, and bug fixes require manual download and replacement. The current revision (r160) was released in early 2024; as of April 2026 several revisions have followed.
- Impact: New Three.js features (e.g., WebGPU renderer, improved `Box3` performance) unavailable without manual upgrade. Breaking changes go undetected until runtime.
- Migration plan: Add a `package.json` with `"three": "^0.160.0"`, use a build step to copy the relevant files into `vendor/`, or switch to a CDN with subresource integrity for the viewer itself.

**lil-gui v0.19.2 — self-hosted:**
- **Status:** 🗂 Backlog: minor risk; update when Three.js is updated
- Risk: Same vendoring concern. Minor patch releases with bug fixes are not automatically applied.
- Files: `vendor/lil-gui.esm.min.js`
- Migration plan: Include via npm and build, or pin a CDN URL with SRI hash.

**Draco and Basis/KTX2 decoders — version unknown, no README version tag:**
- **Status:** 📋 Phase 3 (PERF-01): add vendor/VERSIONS.txt lockfile
- Risk: `vendor/addons/libs/draco/` and `vendor/addons/libs/basis/` contain compiled WASM binaries with no explicit version string in the README or filenames. Upgrading Three.js may require matching decoder versions; mismatches cause silent decode failures or crashes.
- Files: `vendor/addons/libs/draco/`, `vendor/addons/libs/basis/`
- Migration plan: Record decoder versions in a `vendor/VERSIONS.txt` lockfile; align decoder upgrades with Three.js upgrades.

**`host-example/index.html` loads DB UX Design System from jsDelivr CDN:**
- **Status:** 📋 Phase 2 (DOC-02): self-host DB UX CSS or document as demo-only dependency
- Risk: External CSS dependency (`@db-ux/core-foundations@4.5.0`, `@db-ux/core-components@4.5.0`) loaded from `cdn.jsdelivr.net`. If the CDN is unavailable or the package is unpublished, the host example UI breaks. Icon font also fails (noted inline as a CSS workaround comment at line 126).
- Files: `host-example/index.html` lines 10–11
- Migration plan: Self-host the DB UX CSS alongside other vendor files, or mark host-example explicitly as a non-production demo that is CDN-dependent.

---

## Test Coverage Gaps

**No test suite exists:**
- **Status:** 📋 Phase 4: tests become feasible after modularisation
- What's not tested: All viewer logic (camera math, arc animation, selector resolution, postMessage dispatch), Web Component attribute handling, and host integration.
- Files: Entire `viewer/`, `embed/`, `host-example/` directories.
- Risk: Any refactoring of `viewer/index.html` (e.g., extracting modules) has no regression safety net. Camera arc math (`animateCameraArc`, `getModelPivot`), hover state management, and `resolveSelector` are the highest-risk areas.
- Priority: High — the arc camera and selector logic are complex enough to have subtle edge cases that only manifest with specific model geometries.

**No linting or formatting tooling:**
- **Status:** 🗂 Backlog: low priority; codebase is stable
- What's not tested: Code style, unused variables, implicit globals.
- Files: No `.eslintrc*`, no `biome.json`, no `package.json`.
- Risk: The existing code mixes indentation styles (2-space in some functions, 4-space in others), uses both arrow functions and `function` declarations inconsistently, and has dead assignment patterns (e.g., `let root = null` reassigned without cleanup).
- Priority: Medium — add ESLint with `eslint-plugin-three` or a basic browser-globals config.

---

## Scaling Limits

**Single GLB model, no LOD or streaming:**
- **Status:** 🗂 Backlog: out of v1 scope
- Current capacity: Works with `ae86.glb` (small) and `260302_Dresden-Cotta_gesamt.glb` (larger, 700+ objects). No level-of-detail switching.
- Limit: Very large urban models (tens of thousands of objects) will cause initial `Box3.setFromObject` and raycasting to stall the main thread.
- Scaling path: Implement LOD via `THREE.LOD`, progressive loading with multiple lower-detail GLBs, or tile-based loading (e.g., 3D Tiles).

**No model unload / scene reset path:**
- **Status:** 🗂 Backlog: out of v1 scope
- Current capacity: One model per page load. Switching models requires a full page reload.
- Limit: SPAs or multi-model workflows cannot swap models without reloading the iframe.
- Scaling path: Add a `loadModel` postMessage command that disposes the current `root` (geometries, materials, textures) before loading the next URL.

---

*Concerns audit: 2026-04-13*
