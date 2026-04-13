# Phase 2: Dokumentation & Demo — Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

README mit funktionierendem Embed-Snippet, GitHub Pages Live-Demo mit AE86-Modell (self-hosted DB UX), und vollständige API-Referenz unter `docs/api.md`. Ziel: Ein Entwickler kann den Viewer innerhalb von 5 Minuten embedden, ohne den Quellcode zu lesen.

Kein Scope: Interaktive API-Console, npm-Paket, CDN-Hosting, Animation-Steuerung.

</domain>

<decisions>
## Implementation Decisions

### Demo-Seite: Zweck
- **D-01:** Viewer-Showcase — der 3D-Viewer steht im Vordergrund, keine Code-Beispiele auf der Seite
- **D-02:** AE86 ist das Demo-Modell (`assets/ae86.glb`, 812 KB — passt für GitHub Pages)

### Demo-Seite: Layout
- **D-03:** Hero-Layout — Viewer nimmt den oberen Bereich ein (groß), darunter Tab-Navigation
- **D-04:** Unter dem Viewer: Tabs mit Kamera-Preset-Buttons (animateCamera / focus Commands)
- **D-05:** Keine Sichtbarkeit-Toggles, keine Live-API-Console in dieser Phase

### Demo-Seite: DB UX Komponenten
- **D-06:** `db-header` / `db-navigation` — Seitenheader mit Projektname + GitHub-Link
- **D-07:** `db-tabs` — Tab-Navigation unter dem Viewer
- **D-08:** `db-button` — Kamera-Preset Buttons in den Tabs
- **D-09:** Accordion — für evtl. Beschreibungstexte oder Bauteil-Gruppen (falls im AE86 sinnvoll)
- **D-10:** Alle DB UX Komponenten werden self-hosted aus `vendor/db-ux/` geladen — kein CDN

### Demo-Seite: Sprache
- **D-11:** Deutsch — Demo-Seite in deutscher Sprache (Primärzielgruppe: DE-Kunden und eigener Einsatz)
- **D-12:** README auf GitHub bleibt Englisch (internationales Open-Source-Publikum)

### README (DOC-01)
- **D-13:** Englisch — README.md für GitHub, Embed-Snippet als erstes (copy-paste-ready)
- **D-14:** Quick-Start-Fokus: Embed-Code + `?model=` Parameter + bereit in unter einer Minute

### API-Referenz (DOC-03)
- **D-15:** `docs/api.md` wird erweitert — bestehende Struktur beibehalten, fehlende Commands ergänzen
- **D-16:** Fehlende Commands: `setOrbitConstraints`, `setHover`, `setAnimationEnabled`, `modelReady` Event
- **D-17:** Legacy-Commands mit Deprecation-Hinweis markieren: Tabelle "Alte API → Neuer Name"

### GitHub Pages / Deployment (DOC-02)
- **D-18:** Deployed aus `/docs`-Ordner auf `master`-Branch → `designhaus-berlin.github.io/3d-viewer`
- **D-19:** Viewer `iframe` zeigt auf relativen Pfad (`../viewer/index.html` oder equivalent in docs/)
- **D-20:** AE86-Asset muss in `docs/` oder per relativem Pfad erreichbar sein (kein externer Asset-Server)

### Claude's Discretion
- Genaue Farbgebung und Abstände im Hero-Bereich (DB UX Design Tokens werden verwendet)
- Welche Kamera-Presets konkret gezeigt werden (Frontansicht, Seite, Detail — aus AE86-Geometrie ableiten)
- Ob die Demo-Seite `host-example/index.html` ersetzt oder zusätzlich zu ihr existiert
- Wie `docs/` strukturiert ist (Unterordner für Assets, etc.)
- Sprache der `api.md` (aktuell gemischt DE/EN — konsistent machen)

</decisions>

<specifics>
## Spezifische Anforderungen

- DB UX Design System wird self-hosted unter `vendor/db-ux/` ausgeliefert — keine Requests an `cdn.jsdelivr.net` oder andere externe Server (Datenschutz-Constraint aus PROJECT.md)
- Die bestehende `host-example/index.html` lädt DB UX aktuell vom CDN — diese Abhängigkeit muss für die GitHub-Pages-Demo eliminiert werden
- DB UX Pakete: `@db-ux/wc-core-components` + `@db-ux/core-foundations`, Apache-2.0, selbst gehostet
- `assets/ae86.glb` (812 KB) ist klein genug für GitHub Pages direkt
- Die Demo soll alle `postMessage`-Commands zeigen, die in `docs/api.md` stehen — als lebendige Dokumentation

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-Anforderungen
- `.planning/REQUIREMENTS.md` — DOC-01, DOC-02, DOC-03 (vollständige Anforderungen für diese Phase)
- `.planning/ROADMAP.md` §Phase 2 — Success Criteria (4 messbare Ziele)
- `.planning/PROJECT.md` — Constraints (Zero-Build, Self-hosted, Datenschutz, kein Framework)

### Bestehende Dokumentation
- `docs/api.md` — Aktueller Stand der API-Referenz (wird erweitert, nicht neu geschrieben)
- `host-example/index.html` — Bestehende Demo-Seite (Layout-Referenz, zeigt welche DB UX Komponenten bereits verwendet werden)

### Design System
- `vendor/db-ux/` — Ziel-Verzeichnis für self-hosted DB UX Assets (noch nicht vorhanden — researcher soll ermitteln welche Pakete und welche Dateien dort landen)

### Bestehender Viewer
- `viewer/index.html` — Viewer-Quellcode; zeigt welche URL-Parameter und postMessage-Commands tatsächlich implementiert sind (Source of Truth für api.md)
- `embed/webcomponent.js` — Web Component Wrapper (DOC-01 kann alternativ `<x-3d-viewer>` zeigen)

</canonical_refs>

<code_context>
## Existing Code Insights

### Wiederverwendbare Assets
- `host-example/index.html`: Vollständige Demo-Seite mit DB UX Accordion, Sidebar-Layout, postMessage-Integration — guter Ausgangspunkt für neue Hero+Tabs-Struktur
- `docs/api.md`: Bestehende API-Doku mit Grundstruktur vorhanden, muss erweitert werden

### Etablierte Patterns
- DB UX Custom Elements (`<db-button>`, `<db-header>`) bereits in `host-example/index.html` eingesetzt (aktuell CDN-gebunden)
- postMessage-Wrapper `send(type, payload)` in `host-example/index.html` bewährt — kann in Demo wiederverwendet werden
- `iframe` mit `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"` — bewährt

### Integration Points
- `docs/` Ordner ist der GitHub Pages Root (`/docs` Branch Setting)
- Viewer wird per relativer URL in das iframe geladen — Pfadstruktur unter `docs/` muss stimmen
- AE86-Modell: `assets/ae86.glb` muss von GitHub Pages erreichbar sein (entweder in `docs/assets/` kopiert oder aus Repo-Root referenziert)

</code_context>

<deferred>
## Deferred Ideas

- Interaktive API-Console (Live-postMessage-Commands tippen) → v2 (DOC-V2-01)
- Englische Version der Demo-Seite → Backlog
- Sichtbarkeit-Toggles für AE86-Bauteile auf der Demo-Seite → kann in Phase 4 ergänzt werden wenn Modularisierung fertig

</deferred>

---

*Phase: 02-dokumentation-demo*
*Context gathered: 2026-04-13*
