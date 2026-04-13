---
phase: 01-security-hardening
verified: 2026-04-13T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Cross-origin message is silently dropped (no ?allowOrigins=)"
    expected: "window.postMessage from DevTools console at http://localhost/3d-viewer/viewer/index.html (no ?allowOrigins=) — sending {type:'setOrbitEnabled',payload:{enabled:false}} from an injected cross-origin context produces no effect on orbit controls and no console output"
    why_human: "Cannot programmatically simulate a cross-origin postMessage sender without a running second origin; the origin guard uses event.origin which only differs in a real cross-origin scenario"
  - test: "Allowlisted origin is accepted"
    expected: "Open http://localhost/3d-viewer/viewer/index.html?allowOrigins=https://trusted.example.com — in DevTools console run isOriginAllowed('https://trusted.example.com') → must return true; isOriginAllowed('https://other.example.com') → must return false"
    why_human: "DevTools console access needed to call the module-scoped function directly; cannot invoke it from this verification context"
  - test: "No console.log in production session (no ?gui=1)"
    expected: "Open http://localhost/3d-viewer/viewer/index.html, clear DevTools Console, run window.postMessage({type:'focus',payload:{selector:'all'}}, '*') — ZERO lines appear in console"
    why_human: "Requires live browser DevTools observation; cannot verify console output programmatically from a static analysis context"
  - test: "console.log visible in debug mode (?gui=1)"
    expected: "Open http://localhost/3d-viewer/viewer/index.html?gui=1, clear DevTools Console, run window.postMessage({type:'focus',payload:{selector:'all'}}, '*') — '[host→viewer] focus {selector: \"all\"}' appears in console"
    why_human: "Same as above — requires live browser DevTools"
---

# Phase 1: Security Hardening — Verification Report

**Phase Goal:** Der Viewer validiert eingehende postMessage-Origins und loggt keine sensitiven Daten in Produktion
**Verified:** 2026-04-13
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A cross-origin page cannot send commands to the viewer — messages from unlisted origins are silently dropped | VERIFIED | Line 740: `if (!isOriginAllowed(event.origin)) return;` is the first statement in the message handler body, before any data access |
| 2 | The ?allowOrigins= URL param lets a host developer authorize specific origins without touching source code | VERIFIED | Lines 61–64: `url.searchParams.get('allowOrigins')` parsed via `.split(',').map(o => o.trim()).filter(Boolean)`; no code change required |
| 3 | No console.log appears in DevTools during a production session (no ?gui=1) — even after multiple postMessage commands | VERIFIED (static) | Line 745: the only `[host→viewer]` log is `if (showGui) console.log(...)`. All other console.log calls (lines 220–223) are inside the `if (showGui) { ... }` block that starts at line 133. No bare console.log outside a showGui guard exists in the message handler path |
| 4 | When ?gui=1 is active, the [host→viewer] log is still visible in DevTools | VERIFIED (static) | Line 745: `if (showGui) console.log('[host→viewer]', type, payload)` — the log fires when showGui is true, which is set at line 132 when `?gui=1` or `?debug=gui` is in the URL |

**Score:** 4/4 truths verified (static analysis; behavioral confirmation requires human — see Human Verification section)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `viewer/index.html` | isOriginAllowed() function + origin guard in message handler + guarded console.log | VERIFIED | All three elements present and substantive — lines 66–69, 740, 745 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| URL param `?allowOrigins=` | `_allowOrigins` array | `url.searchParams.get('allowOrigins').split(',').map(o=>o.trim()).filter(Boolean)` | WIRED | Lines 61–64 exactly match the specified pattern |
| `window.addEventListener('message', ...)` | `isOriginAllowed(event.origin)` | First guard before any data access | WIRED | Line 740 precedes line 741 (`const data = event.data`) — confirmed by line numbers |
| `console.log` | `showGui` flag | `if (showGui)` guard | WIRED | Line 745 wraps the log; `showGui` defined at line 132 |

### Data-Flow Trace (Level 4)

Not applicable — this phase adds security guards, not data-rendering components. No dynamic data flows to verify.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `isOriginAllowed` function exists and is callable | `grep -c "isOriginAllowed" viewer/index.html` | 2 matches (definition line 66, call site line 740) | PASS |
| `_allowOrigins` parsed from URL | `grep -c "_allowOrigins" viewer/index.html` | 4 matches (raw var, array var, array continuation, usage in `.some()`) | PASS |
| No substring bypass patterns in origin comparison | `grep "indexOf\|startsWith\|includes" viewer/index.html` | 0 matches | PASS |
| Guard is FIRST statement in message handler | Guard at line 740, data access at line 741 | Order confirmed — guard precedes data read | PASS |
| `[host→viewer]` log is guarded | `if (showGui) console.log('[host→viewer]', ...)` at line 745 | Exactly 1 match, properly guarded | PASS |
| Clipboard logs inside showGui block | Lines 220–223 inside `if (showGui) { ... }` block opened at line 133 | Confirmed inside guard — not unconditional | PASS |
| Commits from SUMMARY exist in git history | `git log --oneline` | `1df4f5e` (SEC-01) and `e8f9f10` (SEC-02) both present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEC-01 | 01-01-PLAN.md | Inbound-postMessage-Validierung — event.origin gegen Allowlist | SATISFIED | `isOriginAllowed()` at lines 66–69; guard at line 740; `_allowOrigins` parsed from `?allowOrigins=` at lines 61–64; `===` strict equality only (no substring bypass) |
| SEC-02 | 01-01-PLAN.md | Debug-console.log aus Produktion entfernen — Log nur wenn ?gui=1 | SATISFIED | Line 745: `if (showGui) console.log('[host→viewer]', type, payload)` — the only path-reachable log in the message handler is fully gated |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None detected | — | — |

No TODOs, placeholders, empty implementations, or bare console.log calls found in message handler scope.

### Human Verification Required

The static analysis fully confirms all four code conditions are correct. The following behavioral checks require a live browser because they depend on actual cross-origin isolation, running DevTools, and real event.origin values.

#### 1. Cross-Origin Rejection

**Test:** From a page at a different origin (or using browser DevTools on a cross-origin frame), send `postMessage({type:'setOrbitEnabled',payload:{enabled:false}}, '*')` to the viewer iframe.
**Expected:** Orbit controls remain unchanged — the command is silently dropped with no console output.
**Why human:** `event.origin` is only meaningful in a real cross-origin scenario; static analysis cannot simulate it.

#### 2. Same-Origin Always Passes

**Test:** Open `http://localhost/3d-viewer/viewer/index.html` (no `?allowOrigins=`). In DevTools console run `window.postMessage({type:'setOrbitEnabled',payload:{enabled:true}}, '*')`.
**Expected:** Orbit controls react — same-origin messages pass through unconditionally (backward compatibility).
**Why human:** Requires live browser execution.

#### 3. Allowlist Accepts Listed Origins

**Test:** Open `http://localhost/3d-viewer/viewer/index.html?allowOrigins=https://trusted.example.com`. In DevTools console run `isOriginAllowed('https://trusted.example.com')`.
**Expected:** Returns `true`. `isOriginAllowed('https://other.example.com')` returns `false`.
**Why human:** `isOriginAllowed` is module-scoped and can only be called in DevTools on the live page.

#### 4. No Logs in Production (no ?gui=1)

**Test:** Open `http://localhost/3d-viewer/viewer/index.html`, clear DevTools Console, run `window.postMessage({type:'focus',payload:{selector:'all'}}, '*')`.
**Expected:** Zero lines appear in console.
**Why human:** Requires live DevTools console observation.

#### 5. Logs Visible in Debug Mode (?gui=1)

**Test:** Open `http://localhost/3d-viewer/viewer/index.html?gui=1`, clear DevTools Console, run `window.postMessage({type:'focus',payload:{selector:'all'}}, '*')`.
**Expected:** `[host→viewer] focus {selector: 'all'}` appears in console.
**Why human:** Requires live DevTools console observation.

### Gaps Summary

No gaps. All must-haves are statically verified. The code is correctly structured for both SEC-01 and SEC-02. Status is `human_needed` solely because the behavioral impact of the origin guard (actual cross-origin rejection) and console suppression can only be confirmed in a live browser session.

---

_Verified: 2026-04-13_
_Verifier: Claude (gsd-verifier)_
