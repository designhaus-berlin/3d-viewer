# Feature Research

**Domain:** Self-hosted embeddable iframe 3D viewer with postMessage API (Three.js)
**Researched:** 2026-04-13
**Confidence:** HIGH (core categories), MEDIUM (differentiator ordering)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features developers assume exist when evaluating an embeddable 3D viewer.
Missing these = they move to model-viewer, Babylon.js Viewer, or Sketchfab.

| Feature | Why Expected | Complexity | Status | Notes |
|---------|--------------|------------|--------|-------|
| GLB/glTF loading via URL param | Every competing tool does this as entry point | LOW | DONE | `?model=` param exists |
| Loading progress feedback | Users abandon blank screens after ~2s | LOW | DONE | `loading` event with 0–1 progress |
| `ready` event to host | Host must know when commands are safe to send | LOW | DONE | fires with `apiVersion` |
| `error` event to host | Host must handle load failures | LOW | DONE | `{ code, message }` |
| Orbit controls (rotate/zoom/pan) | Baseline interaction expectation | LOW | DONE | OrbitControls |
| Camera focus on object/selector | Core embed use case: "show me this part" | MEDIUM | DONE | `focus` command |
| Show/hide mesh by name | Product configurators require this | MEDIUM | DONE | `setVisibility` |
| Responsive canvas resizing | Iframes live inside fluid layouts | LOW | DONE | ResizeObserver-style listener |
| Web Component wrapper (`<x-3d-viewer>`) | Framework-agnostic HTML embedding is expected | MEDIUM | DONE | `embed/webcomponent.js` |
| `prefers-reduced-motion` support | WCAG 2.3.3 compliance; users with vestibular disorders | LOW | DONE | `?anim=0`, `setAnimationEnabled` |
| Self-contained (no CDN) | Reliability; offline/intranet deployments | LOW | DONE | all under `vendor/` |
| `source: 'viewer'` message envelope | Required to filter messages in multi-iframe pages | LOW | DONE | present on all outbound events |
| Origin validation on postMessage | Security baseline; OWASP-recommended | LOW | MISSING | `ALLOW_ORIGIN='*'` must be configurable |
| No `console.log` in production | Clutters host developer consoles; signals amateur code | LOW | MISSING | currently logs every command |
| Clear README with embed snippet | First thing evaluators look at before trying | LOW | MISSING | — |

### Differentiators (Competitive Advantage)

Features that distinguish this viewer from drop-in alternatives (model-viewer, Babylon.js Viewer).
These align with the core value: zero-build, zero-Three.js-knowledge on the host side.

| Feature | Value Proposition | Complexity | Status | Notes |
|---------|-------------------|------------|--------|-------|
| Arc camera motion (sphere arc, not straight line) | Avoids clipping through geometry; produces cinematic feel; competitors use linear interpolation | MEDIUM | DONE | `arcCfg` tunable per model |
| `viewerPivot` Blender Custom Property | Designer controls the pivot for camera arcs directly in Blender, no JS needed | LOW | DONE | userData.viewerPivot |
| Hover highlight (canvas + external via `setHover`) | Dual-track: user hover AND programmatic highlight from host — competitors don't expose external hover | MEDIUM | DONE | emissive glow, material cloning |
| `setOrbitConstraints` (azimuth/polar/distance) | Product detail pages need locked orbit to prevent model disappearing; not in model-viewer | MEDIUM | DONE | per-command reset option |
| Debug GUI with "Copy Button JS" snippet | Eliminates the "how do I build the JS call?" question for integrators; zero-friction onboarding | MEDIUM | DONE | lil-gui, `?gui=1` |
| Wheel auto-detection (`detectWheels`) + `aliases` event | Domain-specific automotive feature; hosts get `wheel1–4` selectors without manual mapping | HIGH | DONE | heuristic regex on node names |
| Zero-build embedding: raw `<iframe>` or Web Component | Works with any stack, no npm install required for host; model-viewer requires a package | LOW | DONE | core architectural choice |
| `setOrbitEnabled` toggle | Presentational mode (autoplay slides) that freezes orbit while preserving model state | LOW | DONE | — |
| `poi` click event with selector name | Host can react to user mesh-clicks with zero Three.js knowledge | LOW | DONE | `{ id, name }` payload |
| Configurable arc parameters via URL | Per-model tuning without code change; works in CMS/no-code contexts | LOW | DONE | `?arcLiftFactor=`, etc. |
| DRACO + KTX2 + Basis support | Large compressed models load; competitors either don't support or require CDN decoder | MEDIUM | DONE (infrastructure) | decoders under vendor/, but effectiveness on 294MB model unverified |
| Annotations / hotspots (HTML elements tracking 3D points) | Babylon.js Viewer has this; model-viewer has this; users building product pages expect it | HIGH | MISSING | would need screen-space projection of 3D points + DOM overlay system |
| `playClip` / animation playback control | Babylon.js Viewer has full play/pause/seek/speed; required for animated models | MEDIUM | MISSING | `playClip` listed as unimplemented |
| Screenshot API | Sketchfab exposes `getScreenShot()`; useful for "save view" and thumbnailing | MEDIUM | MISSING | could use `renderer.domElement.toDataURL()` |
| Interactive GitHub Pages demo with live postMessage console | Evaluators want to try the API before integrating; lowers adoption barrier significantly | MEDIUM | MISSING | — |
| npm / CDN package | Enables `import { X3DViewer } from '3d-viewer'`; reaches broader developer audience | MEDIUM | MISSING | — |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build, with rationale. Prevents scope creep in roadmap.

| Feature | Why Requested | Why Problematic | What to Do Instead |
|---------|---------------|-----------------|-------------------|
| Multi-model support (load N models simultaneously) | "Can it compare two cars side by side?" | Doubles scene complexity, breaks selector/alias namespacing, memory management nightmare; not requested by current users | Out of scope — document explicitly |
| Built-in 3D model editor (transform gizmos, property panel) | "Can I reposition things?" | Violates the viewer's contract: it shows, not edits; balloons scope to a full 3D app | Host can send `animateCamera` to frame; actual editing is Blender's job |
| Server-side rendering / SSR-compatible viewer | Frameworks like Next.js trigger this ask | Viewer is iframe-isolated; SSR is irrelevant inside an iframe boundary; adding SSR support adds a build step | Document that the iframe pattern handles SSR hosts naturally |
| Backend API for model processing (conversion, optimization) | "Can it auto-compress my GLB?" | Completely different product; would require Node.js server, storage, queuing | Document Blender + gltf-transform as the pre-processing workflow |
| Real-time collaboration / multi-user cursors | "Can multiple people view the same state?" | Requires WebSocket server, session management — out of scope for a static viewer | Out of scope — document explicitly |
| Proprietary format support (FBX, OBJ, STEP, IFC) | "My models are in FBX" | Each format adds a loader, increases bundle size, adds maintenance burden; Three.js loaders for FBX/STEP are fragile | Recommend gltf-transform / Blender to convert to GLB before embedding |
| `eval()`-based dynamic command execution | "Can I send arbitrary JS?" | XSS vector; destroys the security model entirely | postMessage JSON protocol is the correct abstraction |
| Automatic CDN fallback for vendor libs | "What if vendor/ is slow?" | Breaks offline/intranet guarantee; introduces CDN availability dependency | Self-hosted is the point — document this as a feature, not a limitation |

---

## Feature Dependencies

```
[Interactive GitHub Pages Demo]
    └──requires──> [Clean README + embed snippet]
                       └──requires──> [Origin validation (configurable ALLOW_ORIGIN)]
                       └──requires──> [console.log removed in production]

[npm / CDN Package]
    └──requires──> [Modularization out of monolithic index.html]
                       └──requires──> [ES module structure]

[Annotations / Hotspots]
    └──requires──> [Screen-space projection of 3D coords → DOM overlay]
    └──enhances──> [poi click event] (click → open annotation)

[playClip / Animation Controls]
    └──requires──> [Model has glTF animations in gltf.animations]
    └──enhances──> [setAnimationEnabled] (controls interact)

[Screenshot API]
    └──requires──> [renderer.domElement accessible at screenshot time]
    └──enhances──> [Debug GUI] (add "Screenshot" action)

[Legacy API deprecation warnings]
    └──requires──> [Clear CHANGELOG + migration guide]
    └──conflicts──> [npm package v1.0.0] (can't ship breaking change without version bump)

[DRACO performance for large models]
    └──requires──> [Profiling session on 294MB GLB to confirm bottleneck]
    └──enhances──> [Loading progress feedback] (long loads need accurate progress)
```

### Dependency Notes

- **GitHub Pages Demo requires clean security model:** Evaluators will inspect the source; `ALLOW_ORIGIN='*'` is a visible red flag that undermines trust before adoption.
- **npm package requires modularization:** Publishing `viewer/index.html` as a package makes no sense; the 815-line monolith must be split into ES modules first.
- **Annotations require new architectural layer:** A DOM overlay synchronized to the WebGL canvas is a significant addition; it does not compose easily with the current single-file architecture. Do not attempt until modularization is complete.
- **playClip conflicts with setAnimationEnabled naming:** The existing `setAnimationEnabled` controls camera animation (tweens), not glTF clip playback. New animation API must use unambiguous naming or users will be confused.

---

## MVP Definition

This project is already functional (the viewer exists and works). "MVP" here means the minimum to be a credible open-source library that developers evaluate and adopt.

### Launch With — Credible Open-Source Release

- [ ] **Origin validation** (`ALLOW_ORIGIN` configurable) — security red flags block adoption
- [ ] **Remove production console.log** — signals code quality to evaluators
- [ ] **Clear README with working embed snippet** — first touchpoint; without it, no one tries
- [ ] **GitHub Pages demo with live postMessage console** — lets evaluators try API in browser, zero setup
- [ ] **Legacy API deprecation warnings + CHANGELOG** — communicates maturity and migration path
- [ ] **`playClip` implemented or documented as not-supported** — open question kills confidence

### Add After Initial Adoption (v1.x)

- [ ] **npm package** — only valuable after the iframe/Web Component path is proven; requires modularization first
- [ ] **Screenshot API** — low complexity, high demo value once demo page exists
- [ ] **DRACO performance audit on large models** — only prioritize after profiling confirms it's the bottleneck

### Future Consideration (v2+)

- [ ] **Annotations / Hotspots** — HIGH complexity, requires DOM overlay system and modularized architecture; defer until modularization is done
- [ ] **Animation playback UI** — requires `playClip` first, then UI layer on top; complex enough for its own phase
- [ ] **Material variant switching** — glTF KHR_materials_variants support; useful for product configurators

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Origin validation (configurable) | HIGH | LOW | P1 |
| Remove console.log in production | HIGH | LOW | P1 |
| README + embed snippet | HIGH | LOW | P1 |
| GitHub Pages demo with live API console | HIGH | MEDIUM | P1 |
| Legacy API deprecation + CHANGELOG | MEDIUM | LOW | P1 |
| `playClip` implement or document | MEDIUM | MEDIUM | P1 |
| DRACO large-model audit | HIGH | MEDIUM | P2 |
| Screenshot API | MEDIUM | LOW | P2 |
| npm package | HIGH | HIGH | P2 |
| Modularization (ES modules) | LOW (user) / HIGH (dev) | HIGH | P2 |
| Annotations / Hotspots | HIGH | HIGH | P3 |
| Animation playback UI | MEDIUM | HIGH | P3 |
| Material variant switching | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for credible open-source release
- P2: Should have, add after initial release
- P3: Future consideration, requires architectural prerequisites

---

## Competitor Feature Analysis

| Feature | model-viewer (Google) | Babylon.js Viewer v2 | Sketchfab Viewer API | This Viewer |
|---------|----------------------|---------------------|---------------------|-------------|
| Embed pattern | Web Component (`<model-viewer>`) | Web Component (`<babylon-viewer>`) | iframe + JS SDK | iframe + Web Component both |
| Camera control | ArcRotate, limits | ArcRotate, smooth interpolation | Full (FOV, easing, constraints) | Arc + Linear, `setOrbitConstraints` |
| Focus on object | No (frame model only) | No | Yes (`focusOnVisibleGeometries`) | YES — core feature |
| Show/hide mesh | No (only material variants) | No (node graph via full API) | YES (`show()`/`hide()`) | YES |
| External hover highlight | No | No | No | YES — unique |
| Annotations/Hotspots | YES (HTML slots) | YES (surface + world hotspots) | YES (createAnnotation) | Missing |
| Animation playback | YES (play/pause/timeline) | YES (play/pause/speed/seek) | YES | Missing (playClip stub) |
| Screenshot | No | No | YES (getScreenShot) | Missing |
| Click event (poi) | No direct mesh pick | No | YES (click event) | YES |
| Loading progress | YES (poster, progress) | YES (progress bar) | YES | YES |
| Orbit constraints | YES (attributes) | YES | YES | YES |
| Debug GUI | No | No | No | YES — unique |
| postMessage security | N/A (same-page WC) | N/A (same-page WC) | Origin validated | Missing (ALLOW_ORIGIN='*') |
| Zero-build host integration | YES | YES | NO (npm required) | YES |
| Self-hosted vendor libs | NO (CDN decoders) | NO (CDN or npm) | NO | YES — unique |
| DRACO + KTX2 support | YES | YES | YES | YES (infrastructure ready) |
| Blender workflow integration | None | None | None | YES (viewerPivot) — unique |

**Competitive position:** Strong on zero-build isolation, external hover, arc camera, debug GUI, and Blender workflow. Weak on annotations, animation controls, and screenshot. Security gap (ALLOW_ORIGIN) must close before public release.

---

## Sources

- [Sketchfab Viewer API Functions](https://sketchfab.com/developers/viewer/functions) — MEDIUM confidence (web fetch of live docs)
- [Babylon.js Viewer v2 documentation](https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer) — HIGH confidence (official docs)
- [Babylon.js Viewer Hotspots](https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer/hotspots/) — HIGH confidence (official docs)
- [model-viewer loading examples](https://modelviewer.dev/examples/loading/) — MEDIUM confidence (web fetch)
- [Three.js performance best practices (discourse)](https://discourse.threejs.org/t/considerations-for-loading-large-glb-files/65842) — MEDIUM confidence (community)
- [postMessage security — OWASP HTML5 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) — HIGH confidence (official)
- [Microsoft MSRC postMessage vulnerabilities 2025](https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised) — HIGH confidence (official security research)
- [Alter Product: iframe + postMessage 3D embed guide](https://www.alterproduct.com/en/blog/embed-3d-viewer-configurator-customizer-iframe-postmessage-quick-setup) — LOW confidence (single blog)
- [Three.js accessibility discussion](https://discourse.threejs.org/t/accessibility-for-3d-websites/87092) — MEDIUM confidence (community)
- [W3C WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — HIGH confidence (official standard)

---

*Feature research for: self-hosted embeddable Three.js 3D viewer with postMessage API*
*Researched: 2026-04-13*
