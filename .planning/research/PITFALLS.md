# Pitfalls Research

**Domain:** Self-hosted Three.js 3D Viewer — iframe/postMessage embedded, zero-build, vanilla ES modules
**Researched:** 2026-04-13
**Confidence:** HIGH (all critical pitfalls confirmed in codebase analysis + external sources)

---

## Critical Pitfalls

### Pitfall 1: postMessage with No Origin Validation — Any Page Can Drive the Viewer

**What goes wrong:**
`window.addEventListener('message', ...)` in `viewer/index.html` accepts commands from any origin. An attacker who can reference the iframe's `contentWindow` — or trick a user into visiting a page that embeds the viewer — can send `setVisibility`, `animateCamera`, `setOrbitEnabled`, or any other command. For a product viewer embedded in an e-commerce site, this means a malicious page could hide all geometry, lock the camera, or spam fake `poi` events to confuse the host application.

**Why it happens:**
`*` is the "just works" default during development. The `webcomponent.js` wrapper already validates `ev.origin` correctly (line 41), so developers assume the protection is global — but it only applies when the Web Component wrapper is used. Direct `<iframe>` embeds (as in `host-example/index.html`) receive no protection.

**How to avoid:**
Check `event.origin` as the first line of the message handler. Accept an `?allowedOrigin=https://example.com` URL parameter at viewer load time. Reject messages from any origin not matching the parameter. Fall back to rejecting all messages if the parameter is absent and the viewer is not same-origin. Pattern: `if (event.origin !== ALLOWED_ORIGIN) return;`

**Warning signs:**
- `event.origin` is never referenced in the `message` event handler
- `webcomponent.js` validates origin but `viewer/index.html` does not
- `host-example/index.html` uses `const ORIGIN = '*'` for all outbound commands

**Phase to address:** Security hardening phase (before any public GitHub Pages deployment)

---

### Pitfall 2: ALLOW_ORIGIN='*' Leaks All Viewer Events to Any Embedder

**What goes wrong:**
The viewer posts `ready`, `poi`, `loading`, `error`, `camera`, and `aliases` events to `parent` with target origin `'*'`. Any page that embeds the viewer in an iframe — including an untrusted third-party page — receives all events. This exposes camera coordinates, object selectors, model aliases, and error messages. In a product-configurator context, this leaks which parts a user is looking at.

**Why it happens:**
`postMessage(data, '*')` is the simplest cross-origin call that always succeeds. Restricting to a specific origin requires knowing it at runtime, which requires a design decision (URL param, server config, or hardcoded list). The code comment "In Produktion hart setzen" acknowledges the problem but does not enforce it.

**How to avoid:**
Pass the host origin into the viewer via a URL parameter (e.g., `?origin=https://shop.example.com`). Validate the parameter on load (allowlist check or same-origin check). Use the validated value as the `targetOrigin` in every `parent.postMessage(...)` call. Reject load if the parameter is absent and the viewer is cross-origin.

**Warning signs:**
- `const ALLOW_ORIGIN = '*'` at the top of `viewer/index.html` (line 620–622)
- Comment says "hard-code in production" but no enforcement path exists
- `host-example/index.html` also posts to `'*'`

**Phase to address:** Security hardening phase

---

### Pitfall 3: Three.js Material Cloning Without Disposal Causes VRAM Leak

**What goes wrong:**
Every mesh that is ever hovered gets its material cloned (guarded by `_matCloned` flag). Cloned materials are never disposed when hover state clears or when the model is replaced. For the Dresden-Cotta model (700+ meshes), each interactive session accumulates `MeshStandardMaterial` instances on the GPU. In long-running embedded viewers (product pages left open for hours), this causes progressive GPU memory pressure that eventually crashes the tab or forces a GPU reset.

**Why it happens:**
`material.clone()` is the correct pattern for per-instance material modification. But Three.js does not garbage-collect GPU resources — calling `material.dispose()` is mandatory and must be explicit. The Three.js docs warn about this, but the pattern is easy to overlook: `scene.clear()` and `scene.remove()` do not free GPU memory.

**How to avoid:**
Track all cloned materials in a `Set` on model load. On hover-clear, call `material.dispose()` and restore the original material. On model unload or `beforeunload`, traverse the set and dispose all entries. Separately, dispose all textures via `material.map?.dispose()` — `Texture.dispose()` alone does not close the underlying `ImageBitmap` (Three.js issue #23953); explicitly call `texture.source.data?.close()` for GLB-loaded textures.

**Warning signs:**
- `_matCloned` flag set but no corresponding dispose call anywhere in the file
- `renderer.info.memory.textures` grows in DevTools Memory tab across interactions
- No `beforeunload` handler calling dispose

**Phase to address:** Performance optimization phase

---

### Pitfall 4: DRACO Decoder Version Mismatch Causes Silent Load Failure

**What goes wrong:**
`vendor/addons/libs/draco/` contains compiled WASM binaries with no version tag in filenames or a README. When Three.js is upgraded, the bundled DRACO decoder version must be upgraded in lockstep. A mismatch produces either `TypeError: decoder.DecodeArrayToPointCloud is not a function` or a silent uncaught promise rejection in `GLTFLoader` where neither `onLoad` nor `onError` fires — the model simply never appears with no console error.

**Why it happens:**
The DRACO decoder is a compiled WASM artifact that ships separately from `three.js` itself. It is version-coupled to the Three.js DRACO loader but has no automatic coupling mechanism. When developers download a new `three.module.min.js`, they often forget to also replace the DRACO WASM files.

**How to avoid:**
Create `vendor/VERSIONS.txt` recording `three@r160`, `draco@1.5.6`, `basis@1.x`, `lil-gui@0.19.2`. Make the upgrade procedure explicit: "upgrade Three.js → copy matching DRACO from `node_modules/three/examples/jsm/libs/draco/`." Add a startup check: compare `DRACOLoader` version string against a known-good value and warn via the `error` postMessage event if mismatched.

**Warning signs:**
- No version file in `vendor/addons/libs/draco/` or `vendor/addons/libs/basis/`
- `loadAsync()` hangs with no error after Three.js upgrade
- `renderer.info.programs` shows 0 after a model that previously loaded

**Phase to address:** Performance optimization phase (DRACO usage audit) and npm packaging phase (version lockfile)

---

### Pitfall 5: import map Relative Path Breaks on Directory Restructure

**What goes wrong:**
The inline import map in `viewer/index.html` resolves `three` to `../vendor/three.module.min.js`. This path is relative to the HTML file's location. Moving the viewer from `viewer/` to any other path (e.g., `dist/viewer/`, `app/viewer/`, or serving from root for GitHub Pages) silently breaks all Three.js imports. The failure mode is `Uncaught TypeError: Failed to resolve module specifier "three"` — every import fails and the viewer is a blank canvas.

**Why it happens:**
Relative import map paths are resolved from the document's URL, not the script's URL. This is unintuitive — developers expect module resolution to be consistent with `<script src="...">` behavior. There is no build step to correct the path, so a manual change in one place is easily missed.

**How to avoid:**
Use an absolute path anchored to the site root: `/3d-viewer/vendor/three.module.min.js`. For GitHub Pages, use the repo-name prefix: `/repo-name/vendor/three.module.min.js`. Document the path assumption in the import map comment. When modularizing, generate the import map from a single source-of-truth (e.g., a `paths.js` config imported at the top of `index.html` via a `<script>` block that writes the import map dynamically).

**Warning signs:**
- Import map uses `../vendor/` (relative up-traversal) rather than `/vendor/` (absolute)
- Moving or renaming `viewer/` directory causes blank viewer with no obvious error
- GitHub Pages URL structure differs from local XAMPP path

**Phase to address:** Modularization phase and GitHub Pages deployment phase

---

### Pitfall 6: `ready` Event Fires Before Model Is Loaded — Silent Command Ignoring

**What goes wrong:**
`viewer/index.html` fires the `ready` postMessage at the end of the inline script (line 623), before `loadModel()` resolves. `root` is `null` until the async load completes. Hosts that listen for `ready` and immediately call `focus()` or `setVisibility()` receive silently ignored commands — no error event, no rejection, the command simply does nothing.

**Why it happens:**
`ready` semantically means "iframe initialized," not "model ready." Developers naturally conflate the two. Async model loading is decoupled from iframe initialization, and there is no second lifecycle event to signal model readiness.

**How to avoid:**
Add a `modelReady` event posted at the end of the `loadModel()` success path (after `frameObject()`). Document that `focus`, `setVisibility`, and camera commands require `modelReady`, not just `ready`. Optionally: queue commands received between `ready` and `modelReady` and replay them on model load.

**Warning signs:**
- `ready` is posted unconditionally on line 623 regardless of whether a `?model=` param is present
- `root === null` for seconds after `ready` fires on large models
- Host integration guide does not mention `modelReady` event

**Phase to address:** Documentation phase (document the contract) and modularization phase (implement command queue)

---

### Pitfall 7: `sandbox="allow-same-origin allow-scripts"` Defeats Iframe Isolation

**What goes wrong:**
`host-example/index.html` and `webcomponent.js` grant `allow-same-origin` to the iframe. When the viewer is served from the same origin as the host (typical for XAMPP/GitHub Pages setups), this combination means the viewer iframe can access `parent.document`, `parent.localStorage`, and `parent.cookies` with no restriction. The iframe sandbox provides no security boundary at all in same-origin deployments.

**Why it happens:**
`allow-same-origin` is required for the inline import map to work correctly in some browsers when the viewer is same-origin. Developers add it to fix import map resolution and do not realize it eliminates all same-origin sandboxing.

**How to avoid:**
Serve the viewer from a separate subdomain or path that is truly cross-origin from the host (e.g., host on `shop.example.com`, viewer on `viewer.example.com`). Then `allow-same-origin` can be removed entirely, and the sandbox is meaningful. For GitHub Pages specifically, note that all pages under `username.github.io` share the same origin, so cross-origin sandboxing is impossible unless a custom domain is used.

**Warning signs:**
- `sandbox` attribute contains both `allow-scripts` and `allow-same-origin`
- Viewer and host are served from the same domain/port
- GitHub Pages deployment: viewer and host both under `username.github.io`

**Phase to address:** Security hardening phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `ALLOW_ORIGIN = '*'` | Instant cross-origin postMessage without config | Any embedder receives sensitive viewer events | Never in production |
| No origin check on inbound `message` | Zero config needed for dev integration | Any page can drive the viewer API | Never in production |
| Monolithic 815-line `index.html` | Zero tooling required | No tree-shaking, high cognitive load, merge conflicts guaranteed | MVP phase only — already at the limit |
| Vendored WASM with no version record | Works offline without npm | Silent breakage on Three.js upgrade, no audit trail | Acceptable short-term with a VERSIONS.txt lockfile |
| `console.log` on every postMessage | Easy debugging during development | Floods production consoles, exposes payload data | Dev only, gate behind `?gui=1` flag |
| Relative import map paths | Simple for local XAMPP dev | Breaks on any directory rename or GitHub Pages deploy | Dev only, switch to absolute before deploy |
| No model dispose on unload | Simpler code | VRAM leak on model swap; tab crash on long sessions with large models | Acceptable when one model, one page load |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Direct `<iframe>` embed | Send `postMessage` to `'*'` targetOrigin | Derive origin from `iframe.src` before sending: `new URL(iframe.src).origin` |
| Direct `<iframe>` embed | Call `focus()` on `ready` | Wait for `modelReady` event; queue commands otherwise |
| Web Component | Assume Web Component `_origin` check protects direct embeds | Web Component protection does not transfer to raw `<iframe>` usage |
| GitHub Pages | Assume `sandbox="allow-same-origin"` isolates viewer | Same-origin on `github.io` means no isolation; use custom subdomain |
| DRACO-compressed GLB | Use unmatched DRACO decoder version | Pin decoder version to match Three.js; record in `vendor/VERSIONS.txt` |
| GLTFLoader + DRACOLoader | Forget to call `dracoLoader.setDecoderPath()` | Decoder silently falls back to non-compressed path or hangs; always set path explicitly |
| npm package consumers | `import { Viewer } from '3d-viewer'` expecting CJS | Package is ESM-only (`type: module`); consumers must use ESM or a bundler |
| Host CSP | Add `frame-src 'self'` and forget the viewer is cross-origin | Must include viewer origin explicitly in `frame-src` or use `frame-src *` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `root.traverse()` on every `pointermove` to collect mesh array | FPS drops on pointer move; 100%+ CPU on hover over large model | Cache mesh array after model load; invalidate on `setVisibility` | ~200+ visible meshes (Dresden-Cotta: 700+) |
| Multiple `Box3.setFromObject(root)` per `focus()` call | `focus()` call causes 100ms+ jank on large model | Cache bounding box after load; invalidate on visibility change | ~500+ meshes |
| `syncFromCamera()` inside `renderer.render` wrapper | GUI active = every render frame iterates all GUI controllers | Move sync to `controls.addEventListener('change', ...)` | Any model when `?gui=1` is active |
| Cloned materials never disposed | GPU memory grows monotonically per hover interaction | Track clones in a `Set`; dispose on clear and on model unload | ~50+ hover interactions on 700-mesh model |
| `resolveSelector` full scene traverse on every API call | Stutter on rapid API calls (e.g., hover events from host) | Build `Map<string, Object3D>` index after load | ~300+ nodes |
| No LOD on large urban models | Load time 10–30s, FPS <10 on mobile | Implement `THREE.LOD` or tile loading | Models above ~50 MB uncompressed |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No `event.origin` check on inbound `message` | Any page can send API commands to the viewer | `if (event.origin !== ALLOWED_ORIGIN) return;` as first line of handler |
| `postMessage(data, '*')` for outbound events | All viewer events (camera coords, object names) sent to any embedder | Require `?origin=` param; use validated origin as `targetOrigin` |
| `?model=` param passed directly to `GLTFLoader` with no allowlist | Viewer fetches arbitrary URLs including authenticated resources on its origin | Validate against allowlist of permitted origins/paths; use CSP `connect-src` |
| `allow-same-origin` + `allow-scripts` in same-origin deploy | iframe can access parent DOM, cookies, localStorage | Serve viewer on a separate subdomain, or remove `allow-same-origin` if import maps allow |
| Debug `console.log` of full postMessage payload in production | Any injected third-party script sees all API commands and coordinates | Gate behind `?gui=1`; remove unconditional log on line 731 |
| No `X-Frame-Options` / `frame-ancestors` on the host page | Host page itself can be clickjacked | Add `Content-Security-Policy: frame-ancestors 'self' https://trusted.com` to host responses |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| `arcCfg.safeRadius = 0` by default | Camera flies through model geometry on arc transitions | Set a sane default (e.g., `0.5`); document the URL param prominently |
| `ready` event but no `modelReady` event | Integrators call `focus()` immediately on `ready`; nothing happens; they think the API is broken | Fire `modelReady` after model load; document lifecycle clearly |
| `setOrbitConstraints`, `setHover`, `setAnimationEnabled` undocumented | Integrators use docs, miss three fully-functional commands | Audit all `switch` cases against `docs/api.md` before publishing |
| `playClip` is a silent no-op | Integrators call it, nothing plays, no error — hours of debugging | Either implement `AnimationMixer` or throw an explicit `error` postMessage |
| `onPick` fires for invisible meshes | Clicking near hidden geometry fires `poi` for an invisible object; host gets unexpected selector | Filter `!o.visible` in `onPick` the same way hover does |
| Legacy API aliases with no deprecation warning | New integrators copy old host examples and use stale command names indefinitely | Emit `console.warn('[3d-viewer] deprecated: use X instead of Y')` on legacy commands |

---

## "Looks Done But Isn't" Checklist

- [ ] **postMessage security:** Origin validation exists in `webcomponent.js` — verify it also exists in `viewer/index.html` message handler directly
- [ ] **ALLOW_ORIGIN:** Comment says "hard-code in production" — verify the code actually enforces it, not just says to
- [ ] **DRACO support:** DRACOLoader is wired up — verify decoder version matches Three.js version and is recorded in `vendor/VERSIONS.txt`
- [ ] **Model dispose:** Model loads successfully — verify `geometry.dispose()`, `material.dispose()`, `texture.dispose()` are all called on model swap/unload
- [ ] **API documentation:** `docs/api.md` exists — verify `setOrbitConstraints`, `setHover`, `setAnimationEnabled` are listed
- [ ] **`modelReady` event:** `ready` event fires — verify a second `modelReady` event fires after the async load completes
- [ ] **Import map paths:** Viewer works on XAMPP — verify it also works on GitHub Pages with the actual repo-name URL prefix
- [ ] **npm package `exports` field:** Package installs — verify ESM import path resolves correctly in both Node.js and browser import map contexts

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| postMessage no origin check (found in prod) | LOW | Add `if (event.origin !== ALLOWED_ORIGIN) return;` — single line change; no API breakage |
| ALLOW_ORIGIN='*' outbound events (found in prod) | LOW | Add `?origin=` param support; update host examples; one-day work |
| VRAM leak from cloned materials (found in prod) | MEDIUM | Requires tracking all clones and wiring dispose into hover-clear and model-unload paths; 1–2 days |
| DRACO version mismatch after Three.js upgrade (found in prod) | LOW | Copy matching DRACO from `node_modules/three/examples/jsm/libs/draco/` into `vendor/`; update VERSIONS.txt |
| Import map path broken on deploy (found in prod) | LOW | Change `../vendor/` to absolute path; 30-minute fix |
| `ready` before model (found after integrator complaints) | MEDIUM | Add `modelReady` event + command queue; update docs; 1 day |
| Monolithic HTML causes merge conflict (found mid-refactor) | HIGH | Requires full modularization — cannot be done incrementally without tests as safety net |
| `sandbox` isolation gap on same-origin deploy | MEDIUM | Requires subdomain setup or DNS change; external dependency on hosting config |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| No origin check on inbound postMessage | Security hardening | Automated: send message from different-origin test page, verify it is rejected |
| ALLOW_ORIGIN='*' outbound events | Security hardening | Manual: embed viewer in cross-origin page, verify events are not received without `?origin=` |
| `?model=` URL param not validated | Security hardening | Manual: pass arbitrary URL, verify it is rejected or CSP blocks the fetch |
| `sandbox` same-origin bypass | Security hardening | Manual: verify viewer cannot access `parent.document` from browser console |
| Debug `console.log` in production | Security hardening / documentation | Automated: load viewer without `?gui=1`, verify console is silent on postMessage |
| VRAM leak from material cloning | Performance optimization | Manual: hover 50+ meshes in DevTools Memory tab, verify `renderer.info.memory.textures` is stable |
| `root.traverse()` every pointermove | Performance optimization | DevTools Performance profile on large model, verify no traverse spike per frame |
| Multiple Box3 per `focus()` | Performance optimization | DevTools Performance profile, verify single bounding box compute per focus call |
| DRACO version mismatch | Performance optimization + npm packaging | Load a known DRACO-compressed GLB; verify decode completes with no console error |
| Import map relative path | Modularization + GitHub Pages deploy | Deploy to GitHub Pages, verify viewer loads with repo-name prefix |
| `ready` before model | Documentation + modularization | Integration test: send `focus()` on `ready`, verify it is queued and replays on `modelReady` |
| Monolithic HTML merge risk | Modularization | Structural: each subsystem in its own file; ESLint catches cross-module globals |
| `playClip` silent no-op | Documentation (document gap) or later implementation phase | Integration test: call `playClip`, verify either animation plays or `error` event fires |
| Missing API docs for 3 commands | Documentation | Doc coverage script: parse `switch` cases in `viewer/index.html`, diff against `docs/api.md` |
| Legacy API no deprecation warning | Documentation | Integration test: send `setCamera` (legacy), verify `console.warn` is emitted |

---

## Sources

- Codebase analysis: `viewer/index.html`, `embed/webcomponent.js`, `host-example/index.html` (2026-04-13)
- `.planning/codebase/CONCERNS.md` — security, performance, and fragility audit (2026-04-13)
- [MSRC: postMessaged and Compromised (2025)](https://msrc.microsoft.com/blog/2025/08/postmessaged-and-compromised/)
- [CyberCX: PostMessage Vulnerabilities](https://cybercx.com.au/blog/post-message-vulnerabilities/)
- [postmessage.dev — Complete Guide to postMessage Security](https://postmessage.dev/)
- [Three.js forum: Considerations for loading large GLB files](https://discourse.threejs.org/t/considerations-for-loading-large-glb-files/65842)
- [Three.js issue #23953: Texture.dispose() doesn't close ImageBitmap](https://github.com/mrdoob/three.js/issues/23953)
- [Three.js issue #20883: Draco decoding errors result in uncaught promise rejections](https://github.com/mrdoob/three.js/issues/20883)
- [Three.js issue #14552: DRACOLoader Unknown minor version](https://github.com/mrdoob/three.js/issues/14552)
- [Codrops: Building Efficient Three.js Scenes (2025)](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [GitHub Community: GitHub Pages does not support custom CORS headers](https://github.com/orgs/community/discussions/157852)
- [GitHub Community: COOP/COEP headers not configurable on GitHub Pages](https://github.com/orgs/community/discussions/13309)
- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options)
- [Liran Tal: TypeScript in 2025 with ESM and CJS npm publishing is still a mess](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)
- [LogRocket: ES modules in browsers with import maps](https://blog.logrocket.com/es-modules-in-browsers-with-import-maps/)

---
*Pitfalls research for: self-hosted Three.js iframe viewer (zero-build, vanilla ESM)*
*Researched: 2026-04-13*
