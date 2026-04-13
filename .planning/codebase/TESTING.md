# Testing Patterns

**Analysis Date:** 2026-04-13

## Test Framework

**Runner:** None

No test framework is present. There is no `package.json`, no `jest.config.*`, no `vitest.config.*`, no `*.test.*`, and no `*.spec.*` file anywhere in the project.

**Assertion Library:** None

**Run Commands:** Not applicable

## Test File Organization

**Location:** No test files exist

**Naming:** No convention established

## Test Structure

No tests exist. The entire project is a single-page application (`viewer/index.html`) plus a host example (`host-example/index.html`), a web component (`embed/webcomponent.js`), and a dev server (`serve.js`). No logic is extracted into importable modules that could be unit-tested without a browser environment.

## Current Verification Approach

The project is verified manually via XAMPP (http://localhost/3d-viewer/) and via `curl` requests. No automated verification exists.

**Manual checks performed by:**
- Loading `viewer/index.html` in a browser via iframe
- Posting messages from the host page and observing 3D camera behavior
- Checking `console.log('[host→viewer]', type, payload)` output in DevTools

## Testability Assessment

**Hard to test (current structure):**
- All logic is inline inside `<script type="module">` in `viewer/index.html` — no exportable functions
- Three.js renderer, camera, and controls are instantiated at module evaluation time, coupling logic to DOM and WebGL availability
- postMessage API requires a real browser with cross-frame messaging

**Could be unit-tested without major refactoring:**
- `easeInOutCubic(t)` — pure math function
- `parseTriplet(str)` in `host-example/index.html` — pure string parser
- Constraint math in `applyConstraints()` — trigonometry only
- `detectWheels()` heuristic — depends on Three.js `Object3D` but could be tested with mocks

**Integration test candidates:**
- postMessage round-trip: host sends `focus`, viewer moves camera and fires no error
- `loadModel` error path: invalid URL → `post({type:'error', ...})`

## Mocking

**Framework:** None

No mocking infrastructure exists. The `serve.js` dev server uses raw Node.js `http` and `fs` — no test doubles or dependency injection.

## Fixtures and Factories

**Test Data:** None

The project ships one real GLB asset (`assets/ae86.glb`) and generates a procedural demo model (`createDemoModel()`) inside the viewer when no `?model=` URL param is given. This procedural model functions implicitly as a fixture for manual testing:

```js
// viewer/index.html — inline demo "bridge" model
function createDemoModel(){
  root = new THREE.Group(); root.name = 'demoBridge';
  // pfeilerL, pfeilerR, tragwerk, seil — stable IDs/Tags
}
```

**Location:** Inline in `viewer/index.html` at the `createDemoModel` function.

## Coverage

**Requirements:** None enforced

**View Coverage:** Not applicable

## Test Types

**Unit Tests:** Not present

**Integration Tests:** Not present

**E2E Tests:** Not present

## Recommendations for Adding Tests

If tests are added in the future, the recommended path is:

1. **Extract pure functions** from `viewer/index.html` into a `viewer/lib/` directory (e.g., `easing.js`, `math.js`, `selector.js`) so they can be imported without a DOM.

2. **Use Vitest** — it runs in Node without a browser for pure logic, and supports JSDOM/happy-dom for light DOM tests. No bundler required for simple setups.

3. **Use Playwright** for postMessage / camera integration tests — it can control an iframe and inspect state via `page.evaluate()`.

4. **Suggested first test targets** (highest value, lowest effort):
   - `easeInOutCubic` — 1 pure function, 5 assertions
   - `parseTriplet` — edge cases: null, NaN, valid
   - `_setAspect` in `X3DViewer` (webcomponent) — DOM manipulation, testable with JSDOM

---

*Testing analysis: 2026-04-13*
