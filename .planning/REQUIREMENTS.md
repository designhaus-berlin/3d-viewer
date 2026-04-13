# Requirements — 3D Viewer

**Milestone:** v1.0 — Produktionsreife & öffentliche Veröffentlichung
**Generated:** 2026-04-13
**Status:** Approved

---

## v1 Requirements

### Security

- [ ] **SEC-01**: Inbound-postMessage-Validierung — `event.origin` wird gegen eine konfigurierbare Allowlist geprüft; nicht-autorisierte Origins werden ignoriert
- [ ] **SEC-02**: Debug-`console.log` aus Produktion entfernen — kein payload-Leak mehr; Log nur noch wenn `?gui=1` aktiv

### Dokumentation & Demo

- [ ] **DOC-01**: README mit funktionierendem Embed-Snippet — Entwickler können copy-paste embedden ohne weitere Doku zu lesen
- [ ] **DOC-02**: GitHub Pages Demo — Live-Viewer mit AE86-Modell auf `designhaus-berlin.github.io/3d-viewer` erreichbar; deployed aus `/docs`-Ordner
- [ ] **DOC-03**: API-Referenz vollständig — `docs/api.md` deckt alle Commands ab inkl. bisher undokumentierter und Legacy-Deprecation-Hinweise

### Performance

- [ ] **PERF-01**: DRACO-Decoder-Version verifiziert — `vendor/VERSIONS.txt` dokumentiert WASM-Versionen; kein silent-fail bei Versionsmismatch
- [ ] **PERF-02**: gltf-transform Offline-Pipeline dokumentiert — Schritt-für-Schritt Anleitung zum Komprimieren großer GLBs vor dem Upload
- [ ] **PERF-03**: VRAM-Leak behoben — `dispose()` für Texturen und Geometrien wird beim Modellwechsel aufgerufen; kein GPU-Speicherleck bei langen Sessions

### Modularisierung

- [ ] **MOD-01**: `viewer/index.html` wird zum Shell — JS-Logik ausgelagert in ES-Module unter `viewer/src/`
- [ ] **MOD-02**: `config.js` — URL-Parameter-Parsing isoliert
- [ ] **MOD-03**: `scene.js` — Three.js Objekt-Graph (Renderer, Scene, Lights, Camera)
- [ ] **MOD-04**: `camera.js` — Tween-Engine, Arc-Fahrten, animateCamera-Logic
- [ ] **MOD-05**: `loader.js` — GLTFLoader, DRACOLoader, KTX2Loader, loadModel()
- [ ] **MOD-06**: `selectors.js` — resolveSelector(), Aliases-Map, detectWheels()
- [ ] **MOD-07**: `hover.js` — Emissive-Highlight, Raycaster, rAF-Throttling
- [ ] **MOD-08**: `api.js` — gesamte postMessage-Logik (inbound + outbound), Legacy-Alias-Mapping
- [ ] **MOD-09**: `debug.js` — lil-gui (dynamic import, nur wenn `?gui=1`)

---

## v2 Requirements

- **SEC-V2-01**: Outbound-postMessage Origin konfigurierbar — `ALLOW_ORIGIN` per URL-Param `?origin=` statt hartkodiertem `'*'`
- **PKG-V2-01**: npm-Paket `@designhaus/3d-viewer` — `package.json` mit `exports`-Field, veröffentlicht auf npm/CDN
- **PKG-V2-02**: jsDelivr/esm.sh CDN-Unterstützung — Import direkt per CDN-URL ohne Download
- **DOC-V2-01**: Interaktive Demo-Konsole — Live-postMessage-Commands in der Demo-Seite ausprobierbar
- **PERF-V2-01**: LOD für große Modelle — Level-of-Detail Stufen, pre-baked mit gltf-transform
- **API-V2-01**: AnimationMixer — `playClip` / `stopClip` implementiert für GLTF-Animationen

---

## Out of Scope

- **Multi-Modell gleichzeitig** — zu viel Komplexität, kein aktueller Bedarf
- **Built-in 3D-Editor** — der Viewer zeigt nur, er editiert nicht
- **Server-Side Rendering / Backend** — reines Frontend-Tool
- **Build-Step (Bundler/Transpiler)** — zero-build bleibt Kernprinzip
- **Proprietary Format Support** (FBX, OBJ direkt) — GLTF/GLB ist Standard
- **Eigene Modellbibliothek** — Viewer lädt was der Host angibt

---

## Traceability

| Requirement | Phase |
|-------------|-------|
| SEC-01, SEC-02 | Phase 1 — Security Hardening |
| DOC-01, DOC-02, DOC-03 | Phase 2 — Dokumentation & Demo |
| PERF-01, PERF-02, PERF-03 | Phase 3 — Performance |
| MOD-01 – MOD-09 | Phase 4 — Modularisierung |

---

*Last updated: 2026-04-13 after initial requirements definition*
