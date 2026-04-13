# 3D Viewer — Roadmap

**Milestone:** v1.0 — Produktionsreife & öffentliche Veröffentlichung
**Generated:** 2026-04-13
**Requirements:** 15 v1 requirements mapped across 4 phases

---

## Phases

- [ ] **Phase 1: Security Hardening** — Viewer ist sicher genug für öffentliches Deployment
- [ ] **Phase 2: Dokumentation & Demo** — Entwickler können den Viewer ohne Kontakt embedden und ausprobieren
- [ ] **Phase 3: Performance** — Große Modelle laden zuverlässig ohne Crash oder VRAM-Leak
- [ ] **Phase 4: Modularisierung** — Monolithische index.html ist in wartbare ES-Module aufgeteilt

---

## Phase Details

### Phase 1: Security Hardening
**Goal**: Der Viewer validiert eingehende postMessage-Origins und loggt keine sensitiven Daten in Produktion
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. Eine Seite von einer nicht-autorisierten Origin kann keine postMessage-Commands an den Viewer senden — sie werden stillschweigend ignoriert
  2. Die erlaubten Origins sind per URL-Parameter konfigurierbar, sodass ein Host-Entwickler den Viewer ohne Code-Änderung scharf schalten kann
  3. In einer normalen Produktions-Session (kein `?gui=1`) erscheint kein einziges `console.log` im Browser-DevTools, auch nicht bei mehrfachen postMessage-Commands
  4. Bei aktivem Debug-Modus (`?gui=1`) sind Logs weiterhin sichtbar
**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md — Origin allowlist (SEC-01) + production log guard (SEC-02)

### Phase 2: Dokumentation & Demo
**Goal**: Entwickler können den Viewer auf GitHub Pages live ausprobieren und per Copy-Paste in ihre Seite einbetten
**Depends on**: Phase 1
**Requirements**: DOC-01, DOC-02, DOC-03
**UI Stack**: DB UX Design System — `@db-ux/wc-core-components` + `@db-ux/core-foundations`, self-hosted unter `vendor/db-ux/` (kein CDN, Apache-2.0)
**Success Criteria** (what must be TRUE):
  1. Ein Entwickler, der die GitHub-Repo-Seite aufruft, kann den Embed-Snippet aus der README kopieren, in eine leere HTML-Seite einfügen und hat einen funktionierenden Viewer — ohne weitere Doku zu lesen
  2. Die Live-Demo auf `designhaus-berlin.github.io/3d-viewer` lädt das AE86-Modell und ist über HTTPS erreichbar; alle Assets (DB UX Fonts, Icons, CSS) werden self-hosted ausgeliefert — kein Request an externe Server
  3. Jedes postMessage-Command (`animateCamera`, `focus`, `setVisibility`, `setOrbitEnabled`, `setAnimationEnabled`) ist in `docs/api.md` mit Parametern, Beispiel und etwaigen Legacy-Deprecation-Hinweisen dokumentiert
  4. Die API-Referenz benennt explizit, welche Legacy-Command-Namen deprecated sind und welcher neue Name zu verwenden ist
**Plans**: TBD
**UI hint**: yes

### Phase 3: Performance
**Goal**: Große GLB-Dateien werden zuverlässig geladen; VRAM-Leaks treten nicht auf; der DRACO-Decoder-Stand ist nachvollziehbar dokumentiert
**Depends on**: Phase 2
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. `vendor/VERSIONS.txt` existiert und listet die verwendeten WASM-Versionen (DRACO, KTX2, Basis) — ein Entwickler kann einen Versions-Mismatch erkennen, bevor er ein Modell lädt
  2. Eine schriftliche Schritt-für-Schritt-Anleitung beschreibt, wie ein 294-MB-GLB mit `@gltf-transform/cli` offline komprimiert wird, sodass es im Browser ladbar ist
  3. Nach mehrfachem Laden und Wechseln von Modellen zeigt der Browser Task-Manager keinen wachsenden GPU-Speicherverbrauch (dispose() für Texturen und Geometrien wird aufgerufen)
**Plans**: TBD

### Phase 4: Modularisierung
**Goal**: Die Viewer-Logik ist in eigenständige ES-Module aufgeteilt; `viewer/index.html` ist ein reines Shell-Dokument mit Import-Map
**Depends on**: Phase 3
**Requirements**: MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, MOD-08, MOD-09
**Success Criteria** (what must be TRUE):
  1. `viewer/index.html` enthält keinen Inline-Skript-Block mit Viewer-Logik mehr — nur noch Import-Map und einen `<script type="module">` der `viewer/src/viewer.js` importiert
  2. Jedes der 8 Module (`config.js`, `scene.js`, `camera.js`, `loader.js`, `selectors.js`, `hover.js`, `api.js`, `debug.js`) existiert als eigene Datei unter `viewer/src/` mit klar definiertem `export`
  3. Der Viewer funktioniert nach der Refaktorierung identisch: alle postMessage-Commands reagieren wie vorher, die Debug-GUI öffnet sich bei `?gui=1`, das AE86-Modell lädt ohne Fehler
  4. `debug.js` wird erst beim ersten Aufruf mit `?gui=1` dynamisch importiert — ohne Debug-Modus entsteht kein Netzwerk-Request für lil-gui
  5. Ein externer Entwickler, der `viewer/index.html` in einer frischen Checkout-Kopie öffnet, sieht keine Browser-Konsolenfehler
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 0/1 | Not started | - |
| 2. Dokumentation & Demo | 0/? | Not started | - |
| 3. Performance | 0/? | Not started | - |
| 4. Modularisierung | 0/? | Not started | - |

---

## Backlog

### Phase 999.1: Barrierefreiheit & Layout-Varianten für iframe-Viewer (BACKLOG)

**Goal:** Den 3D-Viewer barrierefrei machen und zwei fertige Embedding-Layout-Varianten als Referenz-Implementierung bereitstellen.

**Kontext:** Das Konzept: 3D-Modell läuft im iframe, die Hauptseite steuert ihn über postMessage. Beschreibungstexte und Navigation leben in der Hauptseite (nicht im iframe) — damit sind sie für Screenreader und SEO zugänglich.

**Zwei Layout-Varianten:**
1. **Button-Layout** — Buttons klicken blendet passenden Text ein + steuert Kamera/Sichtbarkeit im Viewer
2. **Accordion-Layout** — Aufklappmenü-Sektionen mit Beschreibungstext + passenden Viewer-Commands

**Offene Fragen:**
- Wie barrierefrei ist der Viewer aktuell? (ARIA, Keyboard-Navigation, Screenreader)
- Welches WCAG-Level wird angestrebt?
- Sollen die Layout-Varianten in `host-example/` oder als eigene Demo-Seiten leben?

**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote mit /gsd-review-backlog wenn bereit)
