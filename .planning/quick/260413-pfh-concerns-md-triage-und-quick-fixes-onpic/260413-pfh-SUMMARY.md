---
quick_id: 260413-pfh
slug: concerns-md-triage-und-quick-fixes-onpic
status: complete
completed: 2026-04-13
commits:
  - 7d5722e
  - a8c4ce0
  - e8b7e2c
---

# Quick Task 260413-pfh — CONCERNS.md Triage & Quick-Fixes

**Completed:** 2026-04-13
**Tasks:** 3/3
**Files modified:** 3

## Accomplishments

### Task 1: Three viewer/index.html fixes (commit 7d5722e)

**A — onPick invisible mesh filter (line 493)**
- Before: `if (o.isMesh) objs.push(o)`
- After: `if (o.isMesh && o.visible) objs.push(o)`
- Effect: Clicking over a hidden mesh no longer emits a `poi` event

**B — Legacy API console.warn (lines 798–824)**
- Added `console.warn(...)` inside each of the 7 legacy cases:
  - `setCamera` → use `animateCamera`
  - `setVisible` → use `setVisibility`
  - `enableOrbit` → use `setOrbitEnabled`
  - `focusNode` → use `focus`
  - `focusWheel` → use `focus` with wheel selector
  - `setWheelVisible` → use `setVisibility` with wheel selector
  - `playClip` → not implemented, GLTF animations not yet supported
- Effect: Integrators using stale API names now see actionable deprecation warnings

**C — modelReady event (line 292)**
- After: `progressEl.hidden = true;` in loadModel() success path
- Added: `post({type:'modelReady', payload:{ url }});`
- Effect: Hosts can safely gate `focus`/`setVisibility` commands on `modelReady` instead of the early `ready` event

### Task 2: host-example ORIGIN fix (commit a8c4ce0)

- File: `host-example/index.html` line 273
- Before: `const ORIGIN = '*';`
- After: `const ORIGIN = new URL(iframe.src).origin;`
- Effect: postMessage commands are sent only to the viewer's actual origin — closes T-qfx-01

### Task 3: CONCERNS.md triage (commit e8b7e2c)

- File: `.planning/codebase/CONCERNS.md`
- Added triage legend block (✅ Fixed / 📋 Planned / 📝 Documented / 🗂 Backlog)
- Added Status annotation to every concern item (24 items across 8 sections)
- Disposition: **6 Fixed**, **11 Planned**, **3 Documented**, **8 Backlog**

## Triage Summary

| Status | Count | Items |
|--------|-------|-------|
| ✅ Fixed | 6 | console.log in prod, inbound validation, host-example ORIGIN, onPick invisible, ready event, playClip warn |
| 📋 Planned | 11 | Phases 2, 3, 4 — docs, performance, modularisation |
| 📝 Documented | 3 | sandbox isolation, outbound ALLOW_ORIGIN, arcCfg.safeRadius default |
| 🗂 Backlog | 8 | Model URL validation, Three.js/lil-gui updates, test suite, linting, LOD, model unload |

## Verification

All fixes confirmed via grep against merged files:
- `o.isMesh && o.visible` — 2 occurrences (hover + onPick)
- `is deprecated` — 6 warnings (legacy cases)
- `is not implemented` — 1 warning (playClip)
- `modelReady` — 1 post call
- `new URL(iframe.src).origin` — 1 occurrence in host-example
