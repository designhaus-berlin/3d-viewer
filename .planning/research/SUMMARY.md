# Project Research Summary

**Project:** 3D Viewer — self-hosted embeddable Three.js viewer with postMessage API
**Domain:** Embeddable iframe 3D viewer, zero-build, vanilla ESM
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

The 3D Viewer is a production-functional but pre-release embeddable iframe viewer built on Three.js. The core architecture (iframe isolation + postMessage API + self-hosted vendor libs) is sound and should not change. What the project lacks is production readiness: two active security vulnerabilities (ALLOW_ORIGIN=* and no inbound origin check), a monolithic 815-line index.html at the limit of maintainability, missing documentation, and gaps in competitive features (no annotations, no animation playback, no screenshot API). The viewer already outperforms model-viewer and Babylon.js Viewer on arc camera motion, external hover highlight, Blender workflow integration, and Debug GUI — these differentiators should be protected.

The recommended build sequence is: fix security first (blocks public deployment), then harden the foundation (modularize + document + GitHub Pages demo), then extend with ecosystem features (npm package, performance audit, missing differentiators). Security cannot slip to later: ALLOW_ORIGIN=* is visible in source to any evaluator and signals amateur code. The modularization from monolithic index.html to ES modules (viewer.js, scene.js, camera.js, loader.js, selectors.js, hover.js, api.js, debug.js) is the architectural prerequisite for npm packaging, annotations, animation controls, and testability.

The 294 MB Dresden GLB is the key performance risk. Browser GPU memory crashes at ~250-300 MB uncompressed; Draco + KTX2 pre-processing via @gltf-transform/cli is mandatory before that model can run in-browser. For GitHub Pages deployment, Git LFS with GitHub Actions is required because LFS pointer files are served instead of binaries without the lfs: true checkout flag.

## Key Findings

### Recommended Stack

The existing stack is correct and fixed: Three.js r172 ESM, self-hosted under vendor/, zero-build, iframe + postMessage. No new runtime dependencies are needed. The additions required are: (1) GitHub Actions workflow with lfs: true for Pages deployment, (2) @gltf-transform/cli v4.x as an offline pre-processing tool for large GLBs, (3) a package.json with type: module and exports field for npm publishing.

**Core technologies:**
- Three.js r172 (existing): 3D rendering engine — already vendored; no upgrade needed now
- GitHub Actions + Git LFS: Pages deployment — direct branch publish serves LFS pointer text, not binaries; Actions with lfs: true is the only viable path for the 294 MB Dresden model
- @gltf-transform/cli v4.x (offline tool): GLB pre-processing — Draco + KTX2 pipeline; mandatory before 294 MB model can load in browser without crashing
- package.json exports field: npm publishability — type: module + exports enables jsDelivr and esm.sh CDN resolution; ESM-only, no build step
- Strict === origin allowlist: postMessage security — indexOf/startsWith/regex origin checks all have documented bypass attacks; only exact === is safe (OWASP, MSRC 2025)

### Expected Features

The viewer is already strong on table stakes. The gaps that block a credible open-source release are: configurable origin validation, production console silence, a README with a working embed snippet, and a live GitHub Pages demo.

**Must have — missing, blocking public release:**
- Origin validation (configurable ALLOW_ORIGIN) — security red flag visible to every evaluator who reads source
- Remove console.log on every postMessage command — signals amateur code, floods production consoles
- README with working embed snippet — first touchpoint before any evaluation
- GitHub Pages demo with live postMessage console — lets evaluators try the API without setup
- modelReady event — ready fires before async load completes; hosts calling focus() on ready get silent no-ops
- playClip implemented OR documented as not-supported with explicit error postMessage — silent no-op destroys integrator trust
- Legacy API deprecation warnings — old command aliases accepted silently; integrators never learn to migrate

**Should have — add after initial release (P2):**
- Screenshot API (renderer.domElement.toDataURL()) — low complexity, high demo value
- DRACO performance audit on 294 MB Dresden model — confirm bottleneck before optimizing
- npm / CDN package (@designhaus/3d-viewer) — requires modularization first

**Defer to v2+:**
- Annotations / hotspots — HIGH complexity; needs DOM overlay system synchronized to WebGL canvas; requires modularized architecture as prerequisite
- Animation playback UI — requires playClip + AnimationMixer first, then UI layer
- Material variant switching (KHR_materials_variants) — useful for configurators, not yet requested

### Architecture Approach

The viewer must migrate from a monolithic script block in viewer/index.html (815 lines) to ES module files wired by a central orchestrator (viewer.js). The iframe boundary, importmap, and vendor/ layout remain unchanged. Key invariant: api.js is the single postMessage boundary; all other modules receive dependencies via init(deps) functions (no circular sibling imports). debug.js uses dynamic import so lil-gui has zero cost in production.

**Major components:**
1. config.js — URL param parsing; exports arcCfg, animCfg, constraints; no Three.js dependency; extracted first
2. scene.js — creates renderer, scene, camera, controls, lights; dependency root; passes objects to other modules
3. camera.js — tween engine, arc/linear travel, frameObject(); receives deps via init
4. loader.js — GLTFLoader + DRACO/KTX2 setup, loadModel(), detectWheels(), posts loading/ready/aliases
5. selectors.js — resolveSelector() + aliases Map; pure data module; populated by loader
6. hover.js — emissive glow, raycaster, poi dispatch, material cloning; owns all material mutation
7. api.js — postMessage dispatcher; origin validation lives here; legacy alias map
8. debug.js — lil-gui panel; dynamic import; zero cost in production

Build order: config.js > scene.js > selectors.js > camera.js > loader.js > hover.js > api.js > debug.js > viewer.js > update index.html shell.

### Critical Pitfalls

1. No inbound origin check on postMessage — any page can drive the viewer API; fix: if (event.origin !== ALLOWED_ORIGIN) return; as first line of handler; configure via ?allowOrigins= URL param
2. ALLOW_ORIGIN=* leaks all viewer events — camera coords, object selectors, aliases sent to any embedder; fix: require ?origin= URL param, use validated value as targetOrigin in every parent.postMessage()
3. Cloned materials never disposed = VRAM leak — each hover clones a material never freed; on 700-mesh models causes GPU memory pressure and tab crash; fix: track clones in a Set, material.dispose() on hover-clear and model unload
4. DRACO decoder version mismatch = silent load failure — Three.js upgrade without matching DRACO WASM update causes GLTFLoader to hang with no error event; fix: create vendor/VERSIONS.txt, document upgrade procedure
5. Import map relative paths break on deploy — ../vendor/ works on XAMPP but breaks on GitHub Pages with repo-name prefix; fix: switch to absolute paths anchored to site root before deployment

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Security Hardening
**Rationale:** Two active vulnerabilities are visible in source to any evaluator. No credible public release is possible without closing these. They are low-complexity single-file edits that unblock all downstream phases.
**Delivers:** Configurable ?allowOrigins= inbound origin validation; ?origin= outbound targetOrigin enforcement; console.log gated behind ?gui=1; ?model= URL param allowlist documentation
**Addresses:** Origin validation (table stakes, missing), production console silence (table stakes, missing)
**Avoids:** Pitfalls 1 and 2 (inbound + outbound origin checks)
**Research flag:** No research needed — patterns fully specified in PITFALLS.md and STACK.md with code examples

### Phase 2: Documentation and GitHub Pages Demo
**Rationale:** Working demo and clear README are the second adoption gate. modelReady lifecycle fix and playClip resolution grouped here because they must be in place before the demo teaches integrators correct API usage.
**Delivers:** README with embed snippet and API reference; GitHub Pages demo (docs/) with AE86 model and live postMessage console; modelReady event; playClip documented with explicit error postMessage; legacy API deprecation warnings; vendor/VERSIONS.txt; .nojekyll file; import map paths switched to absolute
**Addresses:** README (table stakes, missing), GitHub Pages demo (differentiator, missing), modelReady (Pitfall 6), playClip gap, legacy aliases
**Avoids:** Pitfall 5 (import map paths), Pitfall 6 (ready before model load)
**Research flag:** Import map absolute path fix and .nojekyll documented in STACK.md and ARCHITECTURE.md; one deploy verification pass needed

### Phase 3: Modularization (ES Module Refactor)
**Rationale:** The 815-line monolith is the architectural prerequisite for npm packaging, annotations, animation controls, and testability. Clear build order exists. Zero external API changes — pure structural refactor.
**Delivers:** viewer/ split into 9 ES module files; viewer/index.html reduced to importmap shell; VRAM leak fix in hover.js; resolveSelector cache built at load time; Box3 bounding box cached after load
**Addresses:** Modularization (active requirement), VRAM leak fix (Pitfall 3), resolve cache (performance trap)
**Avoids:** Circular imports, import map split, god-object api.js (ARCHITECTURE.md anti-patterns)
**Research flag:** No additional research needed — full build order and module responsibilities defined in ARCHITECTURE.md

### Phase 4: Performance Audit and Large Model Support
**Rationale:** Dresden GLB (294 MB) is a concrete business requirement and known risk. Must follow modularization because loader.js is where DRACO/LOD changes land. Offline gltf-transform pre-processing can start in parallel with Phase 3.
**Delivers:** @gltf-transform/cli pre-processing pipeline documented; DRACO decoder version verified; pixel ratio capped at 2; LOD strategy documented (pre-bake offline, not runtime SimplifyModifier)
**Addresses:** Performance optimization (active requirement), DRACO large-model audit (P2)
**Avoids:** Pitfall 4 (DRACO version mismatch), performance traps (traverse every pointermove, multiple Box3 per focus)
**Research flag:** Profiling session on actual 294 MB Dresden GLB required before task breakdown — bottleneck unconfirmed without measurement

### Phase 5: npm Package and CDN Distribution
**Rationale:** Hard prerequisite on Phase 3 (modularization). Reaches a new audience and introduces a public versioned API surface. Must follow stable, publicly-deployed viewer.
**Delivers:** @designhaus/3d-viewer npm package with type: module and exports; embed/webcomponent.js as primary export; jsDelivr CDN URL documented; import map usage example in README
**Addresses:** npm / CDN package (active requirement, P2)
**Avoids:** Dual ESM+CJS complexity; Three.js bundling pitfall
**Research flag:** No additional research needed — full package.json structure specified in STACK.md and ARCHITECTURE.md

### Phase Ordering Rationale

- Security is Phase 1: vulnerabilities visible in source; no public deployment before close; low complexity so no reason to delay
- Docs/Demo is Phase 2 (before modularization): low complexity, establishes adoption baseline; existing monolith works for demo
- Modularization is Phase 3: highest effort, prerequisite for Phases 4 and 5; deferring past documentation is safe because external API does not change
- Performance audit follows modularization: profiling and changing loader.js is cleaner on modularized code
- npm packaging is last: requires stable, modularized, deployed viewer to reference in package README

### Research Flags

Phases likely needing deeper research during planning:
- Phase 4 (Performance): Profiling session on actual Dresden GLB required before task breakdown — bottleneck could be decode time, geometry count, texture VRAM, or draw calls; cannot specify tasks precisely without measurement data

Phases with standard patterns (skip research-phase):
- Phase 1 (Security): Fully specified in PITFALLS.md and STACK.md with code patterns; no unknowns
- Phase 2 (Docs/Demo): Standard GitHub Pages + README; import map path fix documented; no unknowns
- Phase 3 (Modularization): Full build order and module responsibilities in ARCHITECTURE.md; no unknowns
- Phase 5 (npm): package.json structure fully specified in STACK.md; no unknowns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | GitHub Pages + LFS confirmed by GitHub official docs; gltf-transform by official docs; postMessage security by OWASP + MSRC 2025; npm exports by multiple authoritative sources |
| Features | HIGH | Competitor analysis cross-referenced against official docs for model-viewer, Babylon.js Viewer, Sketchfab; table stakes vs. differentiators well-established |
| Architecture | HIGH | Codebase fully analyzed (815-line monolith, specific line numbers cited in pitfalls); patterns cross-referenced against reference implementations |
| Pitfalls | HIGH | All critical pitfalls confirmed in codebase with specific line numbers; external sources HIGH confidence |

**Overall confidence:** HIGH

### Gaps to Address

- Dresden GLB performance bottleneck: Cannot be specified without a profiling session on the actual file. Phase 4 task breakdown should be deferred until after an initial profiling pass.
- DRACO decoder version: vendor/addons/libs/draco/ has no version file — current Three.js/DRACO alignment unverified. Create vendor/VERSIONS.txt and cross-reference before Phase 4.
- GitHub Pages repo name for import map: Absolute import map paths must be set to the actual repo-name prefix (/3d-viewer/vendor/...) before demo deployment; verify repo name matches designhaus-berlin/3d-viewer.
- playClip decision: Recommend document-only for Phase 2 (add explicit error postMessage response, LOW complexity); defer AnimationMixer implementation to a future phase.

## Sources

### Primary (HIGH confidence)
- GitHub Docs — Pages publishing source, LFS + Actions lfs: true requirement: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- OWASP HTML5 Security Cheat Sheet — postMessage origin validation: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- Microsoft MSRC: postMessaged and Compromised (August 2025): https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised
- gltf-transform.dev — official CLI docs, v4: https://gltf-transform.dev/
- Three.js official installation guide (import maps): https://threejs.org/manual/en/installation.html
- Babylon.js Viewer v2 documentation: https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer
- Hiroki Osame: Guide to package.json exports field: https://hirok.io/posts/package-json-exports
- Sindresorhus: Pure ESM package gist: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
- Node.js ESM packages official docs: https://nodejs.org/api/packages.html
- Codebase analysis: viewer/index.html, embed/webcomponent.js, host-example/index.html (2026-04-13)

### Secondary (MEDIUM confidence)
- Three.js forum: Considerations for loading large GLB files: https://discourse.threejs.org/t/considerations-for-loading-large-glb-files/65842
- three-gltf-viewer (donmccurdy) — module split reference: https://github.com/donmccurdy/three-gltf-viewer
- three-cad-viewer — layered architecture reference: https://github.com/bernhard-42/three-cad-viewer
- model-viewer loading examples: https://modelviewer.dev/examples/loading/
- Sketchfab Viewer API Functions: https://sketchfab.com/developers/viewer/functions

### Tertiary (LOW confidence)
- utsubo.com: 100 Three.js Tips — curated, needs cross-reference with official docs: https://www.utsubo.com/blog/threejs-best-practices-100-tips

---
*Research completed: 2026-04-13*
*Ready for roadmap: yes*