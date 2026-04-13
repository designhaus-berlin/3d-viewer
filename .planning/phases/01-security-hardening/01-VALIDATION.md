---
phase: 1
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No automated test framework — vanilla JS in browser |
| **Config file** | none |
| **Quick run command** | Manual browser test (DevTools Console) |
| **Full suite command** | Manual browser test + curl origin check |
| **Estimated runtime** | ~2 minutes manual |

---

## Sampling Rate

- **After every task commit:** Open viewer in browser, check DevTools Console
- **After every plan wave:** Run full manual verification (origin rejection + log suppression)
- **Before `/gsd-verify-work`:** All manual checks must pass
- **Max feedback latency:** ~2 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 1-01-01 | 01 | 1 | SEC-01 | Cross-origin message from unlisted origin is silently ignored | manual | Open DevTools, send postMessage from different origin, verify no handler executes | ⬜ pending |
| 1-01-02 | 01 | 1 | SEC-01 | `?allowOrigins=https://example.com` allows that origin, blocks others | manual | Load viewer with param, test from allowed and blocked origins | ⬜ pending |
| 1-01-03 | 01 | 1 | SEC-01 | No allowOrigins param = same-origin only | manual | Load without param, verify cross-origin message ignored | ⬜ pending |
| 1-02-01 | 02 | 1 | SEC-02 | No console.log in prod session (no ?gui=1) | manual | Open DevTools Console, send 3 postMessage commands, verify zero log output | ⬜ pending |
| 1-02-02 | 02 | 1 | SEC-02 | console.log visible with ?gui=1 | manual | Load with ?gui=1, send command, verify log appears | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No framework installation needed — all tests are manual browser tests.

*Existing infrastructure covers all phase requirements (vanilla JS, no build step).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Origin rejection at runtime | SEC-01 | No automated test runner; browser cross-origin security requires actual browser context | 1. Open `http://localhost/3d-viewer/viewer/index.html?allowOrigins=https://trusted.com` 2. Open DevTools Console 3. Run: `window.frames[0].postMessage({type:'setOrbitEnabled',payload:{enabled:false}}, '*')` from an untrusted origin 4. Verify: viewer does NOT respond, no log output |
| console.log suppression | SEC-02 | Requires DevTools observation in browser context | 1. Open viewer without ?gui=1 2. Open DevTools Console 3. Send any postMessage command 4. Verify: zero console output |
| Debug logs with ?gui=1 | SEC-02 | Same — requires browser DevTools | 1. Open viewer with ?gui=1 2. Send any postMessage command 3. Verify: console.log output appears |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined
- [ ] Sampling continuity: checked after each task
- [ ] Wave 0: no framework needed
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
