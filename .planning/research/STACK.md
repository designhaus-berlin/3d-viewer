# Stack Research

**Domain:** Self-hosted Three.js 3D Viewer — new capabilities layer (GitHub Pages, performance, security, npm)
**Researched:** 2026-04-13
**Confidence:** MEDIUM-HIGH (GitHub Pages: HIGH | Three.js perf: HIGH | npm packaging: HIGH | postMessage security: HIGH)

---

## Context

The existing stack (Three.js ESM, vendor-hosted, zero-build, iframe + postMessage API) is fixed — this document
covers only what needs to be added for the four active milestone goals. Nothing here replaces or disrupts the
existing zero-build constraint.

---

## 1. GitHub Pages Deployment

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GitHub Actions | n/a | Deploy workflow from `master` to Pages | Required for Git LFS binary resolution — direct branch publishing serves LFS pointer files, not actual binaries |
| Git LFS | n/a | Track large GLB files (>50 MB) | GitHub hard-limits regular files to 100 MB; the Dresden GLB is 294 MB — LFS is the only viable path |
| `.nojekyll` file | n/a | Suppress Jekyll processing | Without it, GitHub Pages Jekyll processor mangles `vendor/` paths that start with underscores or ignores certain dirs |

### Deployment Pattern

**Publish source:** GitHub Actions (not direct branch) — mandatory because Git LFS objects must be explicitly
fetched in CI before the site deploy step. Direct branch publishing serves LFS pointer text files.

**Recommended workflow structure:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true          # critical — fetches real binaries, not LFS pointers
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'          # serve repo root; viewer at /viewer/
      - uses: actions/deploy-pages@v4
        id: deployment
```

### What NOT to Deploy

The 294 MB Dresden GLB must stay in `.gitignore` or be stored in LFS — never as a regular tracked file.
Demo on GitHub Pages uses only `assets/ae86.glb` (812 KB, safe for regular git).

### MIME Type Note

GitHub Pages (Apache-backed CDN) serves `.glb` as `application/octet-stream`. Three.js `GLTFLoader` does not
rely on MIME type — it inspects magic bytes — so this is not a problem. No `.htaccess` workaround needed.
**Confidence: HIGH** (Three.js forum confirmed, GLTFLoader source verified).

### Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GitHub Actions deploy | Direct branch publish | Only if no LFS files exist (ae86-only demo) — then simpler |
| Git LFS for large GLBs | Cloudflare R2 / S3 for binaries | Better if self-hosting beyond GitHub's LFS storage limits (Free: 1 GB) |

---

## 2. Three.js Performance for Large GLB Models

### Asset Pipeline Tools (run offline, not in viewer)

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `@gltf-transform/cli` | v4.x (latest) | One-command Draco + KTX2 optimization pipeline | The definitive GLTF toolchain by Don McCurdy (Three.js core contributor). Handles draco, meshopt, uastc, etc1s, resize, simplify in one CLI |
| `gltfpack` (meshoptimizer) | latest | Alternative geometry + texture compression | Produces smaller files than Draco for some geometry types; reports 570 MB → 1.4 MB (geometry only) |

**Recommended pre-processing pipeline for large models:**

```bash
# Install once
npm install -g @gltf-transform/cli

# Full pipeline: resize textures + KTX2 normals + ETC1S diffuse + Draco geometry
npx gltf-transform resize input.glb step1.glb --width 2048 --height 2048
npx gltf-transform uastc step1.glb step2.glb \
  --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" \
  --level 4 --rdo --zstd 18
npx gltf-transform etc1s step2.glb step3.glb --quality 128
npx gltf-transform draco step3.glb output.glb --method edgebreaker

# Or one-liner (auto mode, less control):
npx gltf-transform optimize input.glb output.glb --compress draco --texture-compress ktx2
```

### Runtime Techniques (in viewer code)

| Technique | API | Impact | When to Use |
|-----------|-----|--------|-------------|
| Draco decompression | `DRACOLoader` (already in vendor/) | 60–90% geometry size reduction, decoded in Web Worker | Always for pre-processed models |
| KTX2 transcoding | `KTX2Loader` (already in vendor/) | 4–10× GPU VRAM reduction | When models have KTX2-compressed textures |
| `LOD` object | `THREE.LOD` | 30–40% FPS improvement in large scenes | Pre-baked LOD levels from gltf-transform `--simplify` |
| `InstancedMesh` | `THREE.InstancedMesh` | 1000 objects → 1 draw call | Repeated geometry (trees, bolts, seats) |
| `BatchedMesh` | `THREE.BatchedMesh` | Merges different geometries per material | Mixed static geometry sharing same material |
| Draw call monitoring | `renderer.info.render.calls` | Diagnostic | Target < 100 calls/frame for 60fps |
| Memory monitoring | `renderer.info.memory` | Leak detection | Watch for growing geometry/texture counts |
| Proper disposal | `.dispose()` on geometry, material, texture | Prevents VRAM leaks | Always on model swap / viewer teardown |

### Browser Memory Constraint

Critical limit: browsers typically crash around 250–300 MB allocated GPU/CPU memory. The Dresden GLB at 294 MB
uncompressed is at the boundary — Draco + KTX2 pre-processing is **mandatory**, not optional, before that file
can work in a browser viewer.

### LOD Strategy (for the Dresden model)

Runtime LOD generation is impractical for a 294 MB model — `SimplifyModifier` blocks the main thread.
**Correct approach:** pre-bake LOD levels offline with gltf-transform `--simplify`, export as separate GLBs
or use `MSFT_lod` extension, then load the appropriate level based on use case.

### What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `SimplifyModifier` at runtime | Blocks main thread; too slow for large models | Pre-bake LODs with gltf-transform offline |
| Loading full 294 MB GLB uncompressed | Browser crashes at ~250 MB allocation | Draco + KTX2 pre-processing mandatory |
| `renderer.setPixelRatio(window.devicePixelRatio)` unconditionally | On Retina/4K screens doubles/quadruples fragment work | Cap at 2: `Math.min(window.devicePixelRatio, 2)` |
| Wildcard `THREE.LOD` with runtime polygon reduction | No good runtime mesh simplification in Three.js core | Offline gltf-transform pipeline |

---

## 3. npm Packaging (Vanilla JS ESM, No Build Step)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Native `.js` ESM source | ES2020+ | Ship source as-is | Zero-build constraint means source IS the package — no transpilation |
| `package.json` `exports` field | n/a | Module entry point declaration | Replaces `main`; recognized by Node 12+, all modern bundlers, jsDelivr, esm.sh |
| `"type": "module"` | n/a | Mark package as ESM | Required for Node to treat `.js` files as ESM without `.mjs` extension |

### Minimal `package.json` for ESM-Only Package

```json
{
  "name": "@designhaus/3d-viewer",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./embed/webcomponent.js",
    "./viewer": "./viewer/index.html"
  },
  "files": [
    "embed/",
    "viewer/",
    "vendor/",
    "assets/ae86.glb"
  ],
  "engines": {
    "node": ">=18"
  },
  "keywords": ["three.js", "3d-viewer", "gltf", "glb", "webcomponent", "iframe"],
  "license": "MIT"
}
```

**Why `exports` over `main`:**
- jsDelivr reads `exports` to resolve CDN URLs: `https://cdn.jsdelivr.net/npm/@designhaus/3d-viewer/embed/webcomponent.js`
- esm.sh reads `exports` for its import map generation
- Bundlers (Vite, Webpack, Rollup) all respect `exports` — gives us subpath control

**CDN import map usage for consumers (no build, no npm install):**

```html
<script type="importmap">
{
  "imports": {
    "@designhaus/3d-viewer": "https://esm.sh/@designhaus/3d-viewer"
  }
}
</script>
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/@designhaus/3d-viewer/embed/webcomponent.js';
</script>
```

### What NOT to Do

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Dual ESM+CJS package | Zero-build constraint means no build step to generate CJS; targeting browsers only, not Node — CJS irrelevant | ESM-only with `"type": "module"` |
| `"main"` field | Deprecated in favor of `exports`; CDNs fall back to it only if `exports` absent | `"exports"` field |
| Publishing `vendor/` with Three.js | Massive package size; Three.js is a peer dependency, not bundled | Mark Three.js as `peerDependencies`, document required importmap |
| `*.min.js` as published files | Obscures source, no minification benefit without bundling | Publish readable source; consumers minify if they want |

### Scoped Package Name

Use `@designhaus/3d-viewer` (scoped) rather than `3d-viewer` (unscoped). The unscoped name is very likely
taken on npm. Scoped names require `npm publish --access public` for free accounts.

---

## 4. postMessage Security

### Pattern: Strict Allowlist with Exact `===` Matching

```javascript
// In viewer/index.html — replace the current ALLOW_ORIGIN = '*'

// Configured via URL param: ?allowOrigins=https://example.com,https://other.com
// Or falls back to environment constant set at deploy time
const ALLOW_ORIGINS_RAW = new URLSearchParams(location.search).get('allowOrigins');
const ALLOW_ORIGINS = ALLOW_ORIGINS_RAW
  ? ALLOW_ORIGINS_RAW.split(',').map(o => o.trim())
  : ['*']; // dev default only — production must set explicit origins

function isOriginAllowed(origin) {
  if (ALLOW_ORIGINS.includes('*')) return true; // dev mode only
  // CRITICAL: use === not indexOf/startsWith/includes/regex
  return ALLOW_ORIGINS.some(allowed => origin === allowed);
}

window.addEventListener('message', (event) => {
  if (!isOriginAllowed(event.origin)) {
    console.warn('[viewer] Rejected message from', event.origin);
    return;
  }
  // process event.data
});
```

### Why `indexOf` / `startsWith` / regex Are Dangerous

- `indexOf('example.com')` matches `https://example.com.attacker.com` — attacker registers subdomain
- `startsWith('https://example.com')` matches `https://example.com.evil.net`
- Regex `/example\.com/` matches `https://notexample.com` (dot is any char) and `https://example.com.evil.net`
- **Only `=== 'https://exact-origin.com'` is safe** (confirmed by OWASP HTML5 Cheat Sheet and Microsoft MSRC August 2025 research)

### Sending Messages: Always Specify `targetOrigin`

```javascript
// In host page — never use '*' as targetOrigin when sending sensitive data
iframeEl.contentWindow.postMessage(payload, 'https://viewer.example.com');
// NOT: iframeEl.contentWindow.postMessage(payload, '*');
```

### Input Validation After Origin Check

```javascript
// After origin validation — validate message shape before acting on it
const { type, payload } = event.data ?? {};
if (typeof type !== 'string') return;
// validate payload structure per command type
// NEVER: eval(event.data), element.innerHTML = event.data
// ALWAYS: treat data as untrusted input even from allowed origins
```

### CSP Headers (GitHub Pages)

GitHub Pages does not support custom HTTP headers — you cannot set `Content-Security-Policy: frame-ancestors`
from Pages. **Workaround:** document the `X-Frame-Options` limitation; security-conscious deployers must host
on their own server to add CSP headers. This is a known Pages limitation, not a bug to fix in the viewer.

### What NOT to Do

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `ALLOW_ORIGIN = '*'` in production | Any origin can send commands; attackers can drive viewer state | Strict allowlist with `===` matching |
| `event.origin.indexOf(trustedDomain)` | Subdomain bypass: `trustedDomain.attacker.com` passes check | `event.origin === trustedDomain` |
| `event.origin.startsWith(trustedDomain)` | Same bypass as indexOf | Exact `===` match |
| Regex origin matching | `.` in regex matches any char; complex patterns introduce bypass paths | Exact `===` match only |
| `element.innerHTML = event.data` | DOM XSS if host is compromised or origin spoof succeeds | `element.textContent` or structured data only |
| `eval(event.data)` | Arbitrary code execution | Never evaluate received strings as code |

---

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| Three.js | r172 (Dec 2024) | Latest stable as of research date. r171 brought production-ready WebGPU — upgrade beneficial but not blocking |
| `@gltf-transform/cli` | v4.x | Requires Node 18+. v3 → v4 had breaking CLI flag changes — pin to `@latest` after verifying |
| Git LFS | any | GitHub Actions `actions/checkout@v4` with `lfs: true` handles version automatically |
| GitHub Actions | `deploy-pages@v4`, `upload-pages-artifact@v3`, `configure-pages@v5` | Use these specific versions — older v1/v2 actions have known Pages deployment bugs |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GitHub Actions for Pages deploy | Direct branch publish (no Actions) | Only acceptable for ae86-only demos with no LFS files |
| `@gltf-transform/cli` | `gltfpack` alone | gltfpack is faster but less composable; use gltfpack when overall file size trumps quality |
| ESM-only npm package | Dual ESM+CJS with build step | If you need Node.js CJS consumers — but zero-build constraint prohibits this |
| Exact `===` origin allowlist | Permissive wildcard regex | No valid production use case; always use strict matching |
| Git LFS for large GLBs | External CDN (R2, S3, Backblaze) | Better for files >1 GB or when Git LFS bandwidth limits are hit |

---

## Sources

- GitHub Docs, Configuring a publishing source — HIGH confidence — `lfs: true` in checkout required
  https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Community Discussion — Git LFS + GitHub Pages no native support confirmed (2025)
  https://github.com/orgs/community/discussions/50337
- Three.js r172 release — mrdoob/three.js GitHub — HIGH confidence
  https://github.com/mrdoob/three.js/releases/tag/r172
- gltf-transform.dev — official CLI docs, v4 — HIGH confidence
  https://gltf-transform.dev/
- Three.js forum: Considerations for loading large GLB files — MEDIUM confidence (community post)
  https://discourse.threejs.org/t/considerations-for-loading-large-glb-files/65842
- utsubo.com: 100 Three.js Tips — MEDIUM confidence (curated, cross-referenced with official docs)
  https://www.utsubo.com/blog/threejs-best-practices-100-tips
- OWASP HTML5 Security Cheat Sheet — HIGH confidence — postMessage origin validation canonical reference
  https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- SecureFlag: Unchecked Origin in postMessage — HIGH confidence — indexOf/regex bypass documented
  https://knowledge-base.secureflag.com/vulnerabilities/broken_authorization/unchecked_origin_in_postmessage_vulnerability.html
- Microsoft MSRC: "postMessaged and Compromised" (August 2025) — HIGH confidence — real-world origin validation failures
  https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised
- Hiroki Osame: Guide to package.json exports field — HIGH confidence — CDN resolution behavior
  https://hirok.io/posts/package-json-exports
- Sindresorhus: Pure ESM package gist — HIGH confidence — canonical ESM-only package guidance
  https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
- jsDelivr: exports field resolution for CDN — MEDIUM confidence (issue tracker)
  https://github.com/jsdelivr/jsdelivr/issues/18263

---

*Stack research for: 3D Viewer — GitHub Pages + Performance + Security + npm*
*Researched: 2026-04-13*
