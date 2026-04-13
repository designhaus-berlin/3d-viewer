---
phase: quick-260413-pfh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - viewer/index.html
  - host-example/index.html
  - .planning/codebase/CONCERNS.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "onPick ignores invisible meshes — poi events only fire for visible geometry"
    - "Legacy API calls emit a console.warn with the canonical replacement name"
    - "modelReady event is posted after successful model load"
    - "host-example postMessage targets the iframe's actual origin, not '*'"
    - "CONCERNS.md has a triage status annotation on every concern section"
  artifacts:
    - path: "viewer/index.html"
      provides: "4 targeted bug-fixes"
    - path: "host-example/index.html"
      provides: "Correct ORIGIN derivation"
    - path: ".planning/codebase/CONCERNS.md"
      provides: "Triage status on every concern"
  key_links:
    - from: "viewer/index.html onPick"
      to: "o.visible filter"
      via: "o.isMesh && o.visible"
    - from: "viewer/index.html loadModel"
      to: "post modelReady"
      via: "after progressEl.hidden = true"
    - from: "host-example/index.html"
      to: "iframe.src origin"
      via: "new URL(iframe.src).origin"
---

<objective>
Four targeted code fixes in viewer/index.html and host-example/index.html, plus a triage
status pass over CONCERNS.md.

Purpose: Close four known bugs / security gaps with minimal-diff surgical edits; document
the disposition of every CONCERNS.md item so the backlog is clear for future phases.

Output:
- viewer/index.html — 3 edits (onPick filter, legacy warns, modelReady event)
- host-example/index.html — 1 edit (ORIGIN derivation)
- .planning/codebase/CONCERNS.md — status annotation on every concern section
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Three viewer/index.html fixes — onPick filter, legacy warns, modelReady</name>
  <files>viewer/index.html</files>
  <action>
Make three surgical edits. Read the file first, then apply:

**Edit A — onPick invisible mesh filter (line ~492)**

Current:
```js
const objs = []; root && root.traverse(o=>{ if (o.isMesh) objs.push(o); });
```
Replace with:
```js
const objs = []; root && root.traverse(o=>{ if (o.isMesh && o.visible) objs.push(o); });
```

**Edit B — Legacy API console.warn (lines ~796-816)**

Inside the `// ── Legacy API` block, add a `console.warn` call immediately before each
`break` (do NOT restructure the cases — add warn as the first statement in each case):

```js
case 'setCamera':
  console.warn('[3d-viewer] "setCamera" is deprecated — use "animateCamera" instead.');
  setCamera(payload?.position, payload?.target, payload?.durationMs);
  break;
case 'setVisible':
  console.warn('[3d-viewer] "setVisible" is deprecated — use "setVisibility" instead.');
  setVisible(payload?.selector, payload?.visible !== false);
  break;
case 'enableOrbit':
  console.warn('[3d-viewer] "enableOrbit" is deprecated — use "setOrbitEnabled" instead.');
  enableOrbit(payload?.enabled !== false);
  break;
case 'focusNode':
  console.warn('[3d-viewer] "focusNode" is deprecated — use "focus" instead.');
  focusNode(payload?.selector, payload?.padding);
  break;
case 'focusWheel':
  console.warn('[3d-viewer] "focusWheel" is deprecated — use "focus" with a wheel selector instead.');
  // jetzt animiert statt sofort
  focus('wheel'+(payload?.index||1), payload?.padding || 1.4, payload?.durationMs ?? 800);
  break;
case 'setWheelVisible':
  console.warn('[3d-viewer] "setWheelVisible" is deprecated — use "setVisibility" with a wheel selector instead.');
  setVisible('wheel'+(payload?.index||1), payload?.visible !== false);
  break;
case 'playClip':
  console.warn('[3d-viewer] "playClip" is not implemented — GLTF animations are not yet supported.');
  break;
```

**Edit C — modelReady event (line ~291)**

Locate the success path of loadModel(), immediately after `progressEl.hidden = true;`:

Current:
```js
progressEl.hidden = true;
```
Replace with:
```js
progressEl.hidden = true;
post({type:'modelReady', payload:{ url }});
```
  </action>
  <verify>
    <automated>
      curl -s http://localhost/3d-viewer/viewer/index.html | grep -c "o.isMesh && o.visible"
      curl -s http://localhost/3d-viewer/viewer/index.html | grep -c "is deprecated"
      curl -s http://localhost/3d-viewer/viewer/index.html | grep -c "modelReady"
    </automated>
  </verify>
  <done>
    - grep "o.isMesh && o.visible" returns 1
    - grep "is deprecated" returns 6 (one per legacy case, excluding playClip)
    - grep "modelReady" returns 1
    - grep "is not implemented" returns 1 (playClip warn)
  </done>
</task>

<task type="auto">
  <name>Task 2: host-example ORIGIN fix — derive from iframe.src</name>
  <files>host-example/index.html</files>
  <action>
Read host-example/index.html first.

Locate line ~273:
```js
const ORIGIN = '*';
```

Replace with:
```js
const ORIGIN = new URL(iframe.src).origin;
```

The `iframe` variable is already declared on the line above (`const iframe = document.getElementById('viewer');`), so this is safe.

No other changes. Do not touch the `send()` function or any other logic.
  </action>
  <verify>
    <automated>
      curl -s http://localhost/3d-viewer/host-example/index.html | grep "new URL(iframe.src).origin"
    </automated>
  </verify>
  <done>grep returns the corrected ORIGIN line; the string literal '*' no longer appears as ORIGIN value</done>
</task>

<task type="auto">
  <name>Task 3: CONCERNS.md triage — annotate every concern with status</name>
  <files>.planning/codebase/CONCERNS.md</files>
  <action>
Read .planning/codebase/CONCERNS.md in full.

Add a one-line **Status:** annotation immediately after each concern's bullet title line
(the bold heading). Use the triage mapping below. Do not rewrite concern prose — only
insert the status line.

Format for each status line:
```
- **Status:** [emoji + phase/disposition text]
```

**Triage mapping:**

Tech Debt section:
- Monolithic single-file architecture → `📋 Phase 4 (MOD-01–MOD-09): modularisation`
- Legacy API layer not sunset → `📋 Phase 2 (DOC-03) + console.warn added in quick-fix 260413`
- playClip is a documented no-op stub → `✅ Fixed in quick-fix 260413: console.warn emitted; full AnimationMixer deferred to backlog`
- Debug console.log left in production → `✅ Fixed in Phase 1 (SEC-02): guarded behind showGui flag`
- Inline import map uses relative path → `📋 Phase 4: path restructured during modularisation`

Security Considerations section:
- ALLOW_ORIGIN='*' hardcoded in outbound postMessage → `📋 Phase 2: set after GitHub Pages origin is known (deploy target not yet finalised)`
- Inbound postMessage has no origin validation → `✅ Fixed in Phase 1 (SEC-01): event.origin checked against allowedOrigin URL param`
- host-example sends postMessage to ORIGIN='*' → `✅ Fixed in quick-fix 260413: ORIGIN derived from new URL(iframe.src).origin`
- sandbox="allow-same-origin" weakens iframe isolation → `📝 Documented: requires separate subdomain to safely remove; deferred — no subdomain configured`
- Model URL parameter is not validated → `🗂 Backlog: requires allowlist config or CSP connect-src; no current deploy target to constrain`

Performance Bottlenecks section:
- Per-pointer-event full scene traverse for raycasting → `📋 Phase 3 (PERF-02): cache mesh array after model load`
- Multiple redundant Box3.setFromObject calls per focus() → `📋 Phase 3 (PERF-02): cache bounding box after load`
- syncFromCamera monkey-patches renderer.render → `📋 Phase 3 or Phase 4: move to controls.change event`

Fragile Areas section:
- ready event fires before model is loaded → `✅ Fixed in quick-fix 260413: modelReady event posted after loadModel() success`
- Material cloning creates unbounded GPU memory growth → `📋 Phase 3 (PERF-03): dispose cloned materials on model replace`
- resolveSelector does a linear traverse on every API call → `📋 Phase 4: build name/id/tag index on modularisation`
- Hover state is split across two systems that can conflict → `📋 Phase 4: unify into HoverManager on modularisation`
- arcCfg.safeRadius is 0 by default → `📝 Document in Phase 2 api.md; consider enabling sane default (0.5)`

Known Bugs section:
- setOrbitConstraints / setHover / setAnimationEnabled undocumented → `📋 Phase 2 (DOC-01): add to api.md`
- onPick does not filter invisible meshes → `✅ Fixed in quick-fix 260413: o.isMesh && o.visible filter added`

Dependencies at Risk section:
- Three.js r160 — self-hosted, no automated updates → `🗂 Backlog: manual vendor upgrade; no npm, no build step`
- lil-gui v0.19.2 — self-hosted → `🗂 Backlog: minor risk; update when Three.js is updated`
- Draco and Basis/KTX2 decoders — version unknown → `📋 Phase 3 (PERF-01): add vendor/VERSIONS.txt lockfile`
- host-example loads DB UX from jsDelivr CDN → `📋 Phase 2 (DOC-02): self-host DB UX CSS or document as demo-only dependency`

Test Coverage Gaps section:
- No test suite exists → `📋 Phase 4: tests become feasible after modularisation`
- No linting or formatting tooling → `🗂 Backlog: low priority; codebase is stable`

Scaling Limits section:
- Single GLB model, no LOD or streaming → `🗂 Backlog: out of v1 scope`
- No model unload / scene reset path → `🗂 Backlog: out of v1 scope`

After inserting all status lines, add a **Triage legend** block at the very top of the
file, immediately after the `**Analysis Date:**` line:

```
**Triage Date:** 2026-04-13

**Status legend:**
- ✅ Fixed — resolved in named phase or quick-fix
- 📋 Planned — scheduled for named phase/requirement
- 📝 Documented — acknowledged, no code change required; documented in api.md or README
- 🗂 Backlog — out of v1 scope; revisit for v2
```
  </action>
  <verify>
    <automated>
      grep -c "Status:" C:/xampp/htdocs/3d-viewer/.planning/codebase/CONCERNS.md
    </automated>
  </verify>
  <done>
    - grep "Status:" count matches number of annotated concerns (expect ~20)
    - Triage legend block present near top of file
    - File is valid markdown (no broken headings)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| host page → viewer iframe | postMessage inbound; already hardened in Phase 1 |
| viewer iframe → host page | postMessage outbound; ALLOW_ORIGIN fix deferred to Phase 2 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-qfx-01 | Tampering | host-example ORIGIN='*' | mitigate | derive from new URL(iframe.src).origin — done in Task 2 |
| T-qfx-02 | Information Disclosure | Legacy warn exposes API method names in console | accept | names are already in open-source code; no PII |
| T-qfx-03 | Spoofing | modelReady fires after successful load; no auth on URL | accept | model URL validation is Backlog item; not in scope here |
</threat_model>

<verification>
After all tasks complete:

1. Load http://localhost/3d-viewer/viewer/index.html in browser with ?gui=1
2. Load a model, open DevTools console — verify no console.warn on normal API calls
3. Send a legacy command (e.g. type=setCamera) — verify console.warn appears
4. Hide a mesh via setVisibility, click the hidden area — verify no poi event fires
5. Check DevTools Network — modelReady event appears in console after model loads
6. Load http://localhost/3d-viewer/host-example/index.html — verify no JS error on ORIGIN line
7. Confirm CONCERNS.md has Status line under every concern heading
</verification>

<success_criteria>
- viewer/index.html: onPick filters o.visible; 7 legacy console.warns present; modelReady posted after load
- host-example/index.html: ORIGIN = new URL(iframe.src).origin
- CONCERNS.md: every concern has a Status annotation; triage legend present at top
</success_criteria>

<output>
After completion, create `.planning/quick/260413-pfh-concerns-md-triage-und-quick-fixes-onpic/260413-pfh-SUMMARY.md`

Include:
- Files changed
- Each fix with before/after line reference
- CONCERNS.md triage count (X concerns annotated)
</output>
