# Phase 1: Security Hardening — Research

**Researched:** 2026-04-13
**Domain:** postMessage origin validation, production console hygiene — vanilla JS, zero-build, single-file viewer
**Confidence:** HIGH (all findings verified against codebase + prior deep research in STACK.md and PITFALLS.md)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Inbound postMessage: `event.origin` checked against configurable allowlist; unauthorized origins silently ignored | Origin validation pattern verified; `?allowOrigins=` param design confirmed safe |
| SEC-02 | Debug `console.log` removed from production; log only when `?gui=1` active | `showGui` flag already exists at line 119; guard pattern is a one-liner |
</phase_requirements>

---

## Summary

Phase 1 addresses two specific, localized bugs in `viewer/index.html`. Both fixes are surgical — no
architectural changes, no new dependencies, no risk of regressions in unrelated subsystems.

**SEC-01** requires adding an origin allowlist to the inbound `message` event listener at line 726. The
listener currently accepts messages from any origin because `event.origin` is never checked. The fix
introduces a `?allowOrigins=` URL parameter parsed at viewer startup and an `isOriginAllowed(origin)` guard
function inserted as the first check in the handler. The `webcomponent.js` wrapper already implements correct
origin validation (line 41) — the pattern there is the reference implementation; the viewer itself must
mirror it.

**SEC-02** requires guarding the `console.log('[host→viewer]', type, payload)` at line 731 behind the
existing `showGui` boolean (declared at line 119). One line change. No new flag, no new config — `showGui`
is already derived from `?gui=1` and is the canonical debug gate in this codebase.

Both fixes are backward-compatible: the default behavior when `?allowOrigins=` is omitted can remain
permissive (accept same-origin messages without configuration), or strict (reject all cross-origin messages
until an explicit list is provided). The phase success criteria specify "unauthorized origins are silently
ignored" — meaning the fix must be ACTIVE, not opt-in. See the design decision section below.

**Primary recommendation:** Implement the two changes as two separate, clearly-labeled edits to
`viewer/index.html`. Each edit maps 1:1 to one requirement. Total code change is under 20 lines.

---

## Project Constraints (from CLAUDE.md)

| Directive | Implication for Phase 1 |
|-----------|------------------------|
| **Zero-Build** — no transpiler, no bundler | All code must be plain ES2020 JS, runnable directly in the browser without any compilation step |
| **Self-hosted** — all libs under `vendor/`, no CDN | No new npm packages; no external scripts to load for this fix |
| **Vanilla JS, no framework** | No helper libraries; origin checking is one line of native JS |
| **Browser-only** — no Node.js in viewer | No Node-specific APIs; `URL`, `URLSearchParams`, and `location` are sufficient |
| **Backwards Compatibility** — legacy API aliases preserved | Origin validation must not break legitimate hosts that currently embed the viewer without `?allowOrigins=` — see fallback design below |
| **GSD Workflow** — edits through `/gsd-execute-phase` | Do not make direct repo edits outside GSD workflow |

---

## Standard Stack

No new libraries are required for either fix.

### Existing APIs Used

| API | Source | Purpose | Confidence |
|-----|--------|---------|------------|
| `event.origin` | Browser native | Exact string of the sender's origin in a `message` event | HIGH [VERIFIED: MDN] |
| `URLSearchParams` | Already used at line 53 via `new URL(location.href)` | Parse `?allowOrigins=` at viewer startup | HIGH [VERIFIED: codebase line 53] |
| `showGui` boolean | `viewer/index.html` line 119 | Existing debug gate, derived from `?gui=1` | HIGH [VERIFIED: codebase line 119] |
| `String.prototype.split(',')` | Browser native | Parse comma-separated origins from URL param | HIGH [VERIFIED: MDN] |

### No-Install Confirmation

Both SEC-01 and SEC-02 are pure code edits within `viewer/index.html`. No `npm install`, no new vendor
files, no new HTML files required.

---

## Architecture Patterns

### Recommended Project Structure (unchanged)

Phase 1 makes no structural changes. `viewer/index.html` remains the single-file monolith. No new files
are created.

### Pattern 1: Origin Allowlist with Exact `===` Matching

**What:** Parse `?allowOrigins=https://example.com,https://other.com` at startup. Build a `Set` or array
of allowed origins. Check `event.origin` against it with strict `===` equality before processing any
message.

**When to use:** Any `window.addEventListener('message', ...)` handler that accepts cross-origin messages.

**Placement:** Immediately after the existing URL param block (around line 53–77 in `viewer/index.html`),
before the postMessage handler is registered.

**Example** (from STACK.md — confirmed pattern):

```javascript
// Source: STACK.md §4 postMessage Security + OWASP HTML5 Cheat Sheet

// Parse at startup — alongside existing URL param block
const _allowOriginsRaw = url.searchParams.get('allowOrigins'); // e.g. "https://shop.example.com"
const _allowOrigins = _allowOriginsRaw
  ? _allowOriginsRaw.split(',').map(o => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin) {
  // Same-origin embeds (file://, localhost, same host) are always allowed
  if (origin === location.origin) return true;
  // If no allowlist configured: reject all cross-origin messages in production
  if (_allowOrigins.length === 0) return false;
  // Strict exact match — never use indexOf/startsWith/regex (bypass risk)
  return _allowOrigins.some(allowed => origin === allowed);
}
```

**In the message handler** (line 726, first lines of handler body):

```javascript
window.addEventListener('message', (event) => {
  if (!isOriginAllowed(event.origin)) return; // SEC-01: silent reject
  const data = event.data || {};
  const { type, payload } = data;
  if (!type) return;
  // ... rest of handler unchanged
```

**Why `===` is mandatory — substring checks are dangerous:**

[VERIFIED: STACK.md §4, sourced from OWASP HTML5 Cheat Sheet and Microsoft MSRC August 2025]

| Unsafe check | Bypass |
|---|---|
| `origin.indexOf('example.com')` | `https://example.com.attacker.net` passes |
| `origin.startsWith('https://example.com')` | `https://example.com.evil.net` passes |
| `/example\.com/.test(origin)` | `https://notexample.com` passes (`.` matches any char) |
| `origin === 'https://example.com'` | No bypass — only exact match passes |

### Pattern 2: Debug Log Guard with `showGui`

**What:** Wrap the unconditional `console.log` at line 731 with `if (showGui)`.

**Why `showGui` and not a new flag:** `showGui` is already the single debug gate for this viewer. It is
derived from `?gui=1` at line 119, respected by the GUI initialization block, and is the convention the
rest of the file uses. Introducing a separate `?debug=1` would create two overlapping flags.

**Example:**

```javascript
// Before (line 731 — current state, fires in production):
console.log('[host→viewer]', type, payload);

// After (SEC-02 fix):
if (showGui) console.log('[host→viewer]', type, payload);
```

That is the entire change for SEC-02.

### Anti-Patterns to Avoid

- **Substring origin matching:** `origin.includes(trusted)` — bypassed by subdomain trick
  [VERIFIED: OWASP, Microsoft MSRC 2025]
- **Trusting `event.source`** instead of `event.origin` — `event.source` is the window reference, not the
  origin string; a compromised same-origin parent could send from any source
- **Removing the log entirely** — removing destroys debuggability; guarding behind `showGui` is better
- **Adding a new `?debug=` flag** — creates two overlapping debug modes; use existing `showGui`
- **Blocking same-origin messages when `?allowOrigins=` is absent** — would silently break all same-origin
  test setups including XAMPP `http://localhost/3d-viewer/` where viewer and host share origin
- **Storing `?allowOrigins=` value without sanitization** — trim whitespace from each entry; do not allow
  partial origins (e.g., `https://` alone)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Origin comparison logic | Custom regex matching, partial string matching | Exact `=== ` with `String.trim()` only | All custom string matching approaches have known bypass vectors |
| Debug mode detection | New `?verbose=` or `?log=` URL param | Existing `showGui` boolean (line 119) | Already the canonical debug gate; new flag creates split-brain |
| Allowlist storage | `localStorage`, `sessionStorage`, server config | URL param `?allowOrigins=` parsed at startup | Zero-build constraint; URL param is queryable, inspectable, and per-embed configurable |

**Key insight:** postMessage origin security is a one-liner problem. The complexity is entirely in
knowing WHICH one-liner to use (exact `===`, not substring). The viewer's `webcomponent.js` already
implements the correct pattern — the only work is replicating it in `viewer/index.html` itself.

---

## Common Pitfalls

### Pitfall 1: "Origin check in webcomponent.js = origin check in viewer"

**What goes wrong:** Developer sees origin validation in `embed/webcomponent.js` line 41 and assumes the
viewer is protected. It is not. The Web Component wrapper validates origin before forwarding the message
to the iframe, but direct `<iframe>` embeds (as in `host-example/index.html`) send messages directly to
the viewer's `contentWindow` with no wrapper. The viewer's own `message` handler has no protection.

**Why it happens:** The protection in `webcomponent.js` is invisible from inside `viewer/index.html`.

**How to avoid:** The fix lives in `viewer/index.html`'s `message` handler — not in `webcomponent.js`.

**Warning signs:** The fix is missing if `event.origin` is not referenced anywhere in `viewer/index.html`'s
`window.addEventListener('message', ...)` body.

[VERIFIED: codebase — `grep event.origin viewer/index.html` returns zero results in the message handler]

---

### Pitfall 2: Breaking Backward Compatibility With `?allowOrigins=` as Mandatory

**What goes wrong:** If the fix rejects all messages when `?allowOrigins=` is absent, every existing embed
that does NOT pass the param stops working silently. This is a breaking change.

**Why it happens:** The strictest possible security posture requires the param. But the current codebase
has zero origin validation — going from "accept all" to "reject all unless configured" in one step breaks
existing integrations.

**How to avoid:** When `?allowOrigins=` is absent, accept same-origin messages and reject cross-origin
ones. This is the same default as the browser's own same-origin policy. It is not a security regression
from the current state (currently cross-origin is accepted), and it is backward-compatible for same-origin
XAMPP setups.

**Design decision for planner:** The exact fallback behavior when `?allowOrigins=` is absent must be
explicit. Recommended: `origin === location.origin` passes; all other origins rejected unless in the list.

---

### Pitfall 3: `console.log` Guard Must Cover All Payload-Leaking Logs

**What goes wrong:** The fix guards line 731 but misses other `console.log` calls that also fire
unconditionally with payload data.

**Inventory of all `console.log` calls in `viewer/index.html`** [VERIFIED: codebase grep]:

| Line | Statement | Fires unconditionally? | Action |
|------|-----------|----------------------|--------|
| 731 | `console.log('[host→viewer]', type, payload)` | YES — fires on every inbound postMessage | Guard with `if (showGui)` |
| ~line (aliases) | `console.log('[Aliases]', d.payload?.mapped)` | YES — fires after model load | Guard with `if (showGui)` |
| (clipboard fallback) | `console.log('Clipboard fehlgeschlagen, ...')` | Conditional (catch block) | Acceptable — not payload-leaking; harmless user-facing error |

The planner should include both the line 731 log AND the Aliases log in scope for SEC-02. The clipboard
log is a UI fallback message — not a security concern.

---

### Pitfall 4: `?allowOrigins=` Param Is Visible in the iframe `src` URL

**What goes wrong:** The iframe `src` URL (e.g.,
`/viewer/index.html?model=ae86.glb&allowOrigins=https://shop.example.com`) is visible in browser DevTools.
A developer might treat the allowed origin as a secret.

**Why this is not a problem:** The allowed origin is not a secret — it is a routing configuration. The
origin of the embedding page is already public information (visible in the browser address bar). The
`?allowOrigins=` param is simply the viewer's way of knowing which parent to trust.

**Implication for implementation:** No special encoding or encryption needed. Plain URL param is correct.

---

### Pitfall 5: `location.origin` Is `"null"` for `file://` URLs

**What goes wrong:** When the viewer is opened directly as `file:///.../viewer/index.html`, `location.origin`
is the string `"null"` (literally). An `event.origin === location.origin` check would then pass for any
sender whose origin is also `"null"` (i.e., other `file://` pages) — which is too permissive on desktop.

**Why it matters:** XAMPP serves files over HTTP (`http://localhost/3d-viewer/`) so `location.origin` is
`"http://localhost"` — not a problem for the standard dev workflow. But a developer who opens
`viewer/index.html` directly via `file://` would get `"null"` origin equality for all `file://` senders.

**How to avoid:** Document that the viewer must be served via HTTP (XAMPP or `serve.js`) for origin
validation to function correctly. This is already the documented setup — the MEMORY.md confirms XAMPP as
the standard dev server.

[VERIFIED: MDN — `location.origin` returns `"null"` for opaque origins including `file://`]

---

## Code Examples

Verified patterns from codebase and official references:

### Full SEC-01 Implementation

```javascript
// Source: STACK.md §4 postMessage Security + codebase line 53 (existing URL parsing pattern)
// Place in startup block, after existing url / modelUrl / theme / lang params (around line 56)

// SEC-01: Inbound postMessage origin allowlist
// Configure via: ?allowOrigins=https://shop.example.com,https://other.example.com
// When absent: same-origin messages accepted, cross-origin messages rejected
const _allowOriginsRaw = url.searchParams.get('allowOrigins');
const _allowOrigins = _allowOriginsRaw
  ? _allowOriginsRaw.split(',').map(o => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin) {
  if (origin === location.origin) return true;  // same-origin always ok
  return _allowOrigins.some(allowed => origin === allowed); // exact match only
}
```

```javascript
// In window.addEventListener('message', ...) at line 726 — insert before any data access:
window.addEventListener('message', (event) => {
  if (!isOriginAllowed(event.origin)) return; // SEC-01: silent reject unauthorized origins
  const data = event.data || {};
  // ... rest unchanged
```

### Full SEC-02 Implementation

```javascript
// Source: codebase line 119 (showGui definition), line 731 (target log)
// Change line 731 from:
console.log('[host→viewer]', type, payload);

// To:
if (showGui) console.log('[host→viewer]', type, payload);
```

```javascript
// Also guard the Aliases log (find by searching '[Aliases]' in viewer/index.html):
// Change from:
console.log('[Aliases]', d.payload?.mapped);

// To:
if (showGui) console.log('[Aliases]', d.payload?.mapped);
```

### How `showGui` Is Currently Defined (reference — do not change)

```javascript
// Source: viewer/index.html line 119
const showGui = /(^|&)gui=1(&|$)/.test(location.search) || /(^|&)debug=gui(&|$)/.test(location.search);
```

This is already set before the postMessage handler. No initialization ordering concern.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact on This Phase |
|---|---|---|---|
| `ALLOW_ORIGIN = '*'` in dev code that ships to prod | Explicit `?allowOrigins=` per-embed param with exact `===` matching | Browser security guidance standardized circa 2015; OWASP formalized 2017 | SEC-01 brings the viewer up to current standard |
| Always-on `console.log` for debugging | Gate behind debug flag (`?gui=1` or `NODE_ENV`) | Industry norm since `debug` npm package popularity (~2014) | SEC-02 is a straightforward cleanup |

**Deprecated/outdated:**
- `ALLOW_ORIGIN = '*'` — correct for dev scaffolding; must not ship. The code comment "In Produktion hart
  setzen" (line 620) acknowledges this but provides no mechanism. Phase 1 provides the mechanism.

---

## Open Questions

1. **Fallback behavior when `?allowOrigins=` is absent**
   - What we know: The success criteria say "unauthorized origins are silently ignored" — implying the
     protection is active by default, not opt-in
   - What's unclear: Whether a bare-embed (no `?allowOrigins=`) on a same-origin XAMPP setup should still
     work without any config
   - Recommendation: Accept same-origin messages unconditionally; reject all cross-origin messages when
     `?allowOrigins=` is absent. This is backward-compatible for XAMPP dev (same-origin) while providing
     protection for cross-origin production embeds that forget the param.

2. **Should the Aliases `console.log` also be guarded?**
   - What we know: SEC-02 specifies "no `console.log` in Prod-Session (ohne `?gui=1`)"; the Aliases log
     fires once after model load and outputs object selectors
   - What's unclear: Whether the planner considers this in scope for SEC-02 or a separate task
   - Recommendation: Include it — it is the same one-line fix pattern and the Aliases object contains
     internal model structure data (selector names)

3. **Should `host-example/index.html`'s `const ORIGIN = '*'` be fixed in this phase?**
   - What we know: `host-example/index.html` line 273–276 posts to `'*'` (outbound from host to viewer)
   - What's unclear: The phase success criteria focus on the viewer's inbound handler; fixing host-example
     is technically SEC-V2-01 (outbound origin) which is a v2 requirement
   - Recommendation: Out of scope for Phase 1. Document the gap in a comment in `host-example/index.html`
     only if the planner chooses to; do not fix the outbound `'*'` in this phase.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is a pure code edit within `viewer/index.html`. No external tools, CLIs,
databases, or services are required. XAMPP is already confirmed running (per MEMORY.md).

---

## Validation Architecture

No automated test suite exists in this project. [VERIFIED: CONCERNS.md "No test suite exists"].

### Manual Verification Protocol for Phase 1

SEC-01 verification:

```
1. Open viewer in browser: http://localhost/3d-viewer/viewer/index.html?allowOrigins=https://trusted.com
2. Open DevTools console
3. Execute in console:
     window.postMessage({ type: 'focus', payload: { selector: 'all' } }, '*')
   Expected: command is IGNORED (message came from same-origin, but test simulates an origin check)

   Better test — open a second page at a different origin and embed the viewer, then send a postMessage.
   Simplest manual test: open viewer at http://localhost, then from DevTools:
     // Simulate cross-origin by checking the guard logic directly:
     isOriginAllowed('https://attacker.com') // must return false
     isOriginAllowed('http://localhost')      // must return true
     isOriginAllowed('https://trusted.com')  // must return true (if ?allowOrigins=https://trusted.com)
```

SEC-02 verification:

```
1. Open viewer WITHOUT ?gui=1:
   http://localhost/3d-viewer/viewer/index.html
2. Open DevTools console, clear it
3. Send a postMessage from host-example or console:
   document.querySelector('iframe').contentWindow.postMessage({ type: 'setOrbitEnabled', payload: { enabled: true } }, '*')
4. Expected: NO output in console
5. Repeat with ?gui=1 in viewer URL — expected: '[host→viewer] setOrbitEnabled {...}' appears in console
```

### Wave 0 Gaps

- [ ] No test infrastructure to build — verification is manual only for this phase

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | Not applicable — viewer has no user auth |
| V3 Session Management | No | No sessions; stateless iframe embed |
| V4 Access Control | Yes | Origin allowlist (`isOriginAllowed`) controls who can send commands |
| V5 Input Validation | Yes | `event.origin` validated with exact `===`; `allowOrigins` param entries trimmed |
| V6 Cryptography | No | No cryptographic operations in scope |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Cross-origin postMessage command injection | Spoofing + Tampering | `event.origin === allowedOrigin` exact check before processing |
| Subdomain bypass of substring origin check | Spoofing | Use `===` only; never `indexOf`/`startsWith`/regex |
| Payload logging exposing internal model structure | Information Disclosure | Gate all `console.log(payload)` calls behind `showGui` |
| Malicious page driving viewer state in an embed | Tampering | Origin allowlist; silent reject (no error postback to attacker) |

**Silent reject vs. error postback:** The success criteria specify "silently ignored" — do NOT post an
error event back to rejected origins. Sending an error response to an attacker confirms the viewer is
present and responding, which is itself an information leak. The correct pattern is `return;` with no
outbound message.

[VERIFIED: OWASP HTML5 Security Cheat Sheet — postMessage validation best practices]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Aliases `console.log` fires unconditionally | Common Pitfalls §3 | Low — the fix is the same one-liner; worst case it was already guarded and the change is a no-op |
| A2 | `location.origin` on XAMPP is `"http://localhost"` (not `"null"`) | Common Pitfalls §5 | Low — MEMORY.md confirms XAMPP is the dev server, not `file://` |

**All other claims in this document are VERIFIED against the codebase or CITED from official sources.**

---

## Sources

### Primary (HIGH confidence)

- `viewer/index.html` lines 53–77, 119, 620–622, 726–807 — direct codebase inspection
- `embed/webcomponent.js` line 41 — reference implementation of correct origin validation
- `.planning/research/STACK.md §4` — postMessage security patterns (sourced from OWASP + Microsoft MSRC)
- `.planning/research/PITFALLS.md` — pitfalls 1, 2, 7 (origin validation, ALLOW_ORIGIN, sandbox)
- `.planning/codebase/CONCERNS.md` — security considerations section

### Secondary (MEDIUM confidence)

- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) — canonical postMessage validation reference
- [Microsoft MSRC: postMessaged and Compromised (August 2025)](https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised) — real-world origin validation failures

### Tertiary (LOW confidence)

None — all claims in this research are verified or cited.

---

## Metadata

**Confidence breakdown:**
- SEC-01 fix design: HIGH — exact lines identified in codebase; pattern confirmed by multiple security sources
- SEC-02 fix design: HIGH — `showGui` flag confirmed at line 119; target log confirmed at line 731
- Backward compatibility analysis: HIGH — same-origin default is standard browser behavior
- Validation instructions: HIGH — manually verifiable in any browser DevTools

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable domain — postMessage security patterns do not change frequently)
