# 3D Viewer

## What This Is

Ein selbst-gehosteter Three.js 3D-Viewer, der per `<iframe>` in beliebige Webseiten eingebettet wird und vollständig über eine `postMessage`-API gesteuert wird. Entwickelt für den eigenen Einsatz, für Kundenprojekte und als Open-Source-Tool auf GitHub. Der Host braucht kein Three.js-Wissen — er sendet einfach JSON-Nachrichten.

## Core Value

Der Viewer muss zuverlässig embedden und auf alle API-Commands reagieren — ohne Build-Step, ohne externe Abhängigkeiten, überall lauffähig.

## Requirements

### Validated

- ✓ postMessage API: `animateCamera`, `focus`, `setVisibility`, `setOrbitEnabled`, `setAnimationEnabled` — existing
- ✓ Hover-Highlight via Emissive-Glow (rAF-gedrosselt) — existing
- ✓ Bogen-Kamerafahrten (`arcCfg`: liftFactor, liftMax, safeRadius) — existing
- ✓ Debug-GUI (lil-gui) mit "Copy Button JS" Snippet-Generator — existing
- ✓ Web Component Wrapper (`<x-3d-viewer>`) via `embed/webcomponent.js` — existing
- ✓ Self-hosted vendor libs (Three.js, lil-gui, DRACO, KTX2, Basis) — kein CDN — existing
- ✓ Blender Workflow: `viewerPivot` Custom Property für eigene Pivot-Punkte — existing
- ✓ `prefers-reduced-motion` Support (`?anim=0`) — existing
- ✓ URL-Parameter: `?model=`, `?gui=`, `?anim=` — existing
- ✓ Events an Host: `ready`, `loading`, `poi`, `camera`, `aliases`, `error` — existing

### Active

- [ ] Dokumentation & GitHub Pages Demo — saubere README + Demo-Seite mit AE86-Modell
- [ ] Performance-Optimierung für große Modelle — DRACO-Nutzung prüfen, LOD, Lazy Loading
- [ ] Sicherheit: `postMessage`-Origin-Validierung + `ALLOW_ORIGIN` konfigurierbar
- [ ] `console.log` in Produktion entfernen (aktuell loggt jedes API-Command)
- [ ] `playClip` implementieren oder als not-supported dokumentieren
- [ ] Legacy-API deprecation warnings (6 alte Command-Namen)
- [ ] Modularisierung: Viewer-Logik aus der monolithischen `index.html` in ES-Module auslagern
- [ ] npm / CDN-Paket veröffentlichen

### Out of Scope

- Build-Step (Webpack, Vite etc.) — bewusste Entscheidung, zero-build bleibt Kernprinzip bis Modularisierung explizit beschlossen
- Backend / Server-Side-Rendering — reines Frontend-Tool
- Multi-Modell gleichzeitig laden — nicht angefragt, zu viel Komplexität für jetzt
- Eigene 3D-Modellierung / -Bearbeitung — der Viewer zeigt nur, er editiert nicht

## Context

- Läuft lokal auf XAMPP (`http://localhost/3d-viewer/`), deployed via GitHub Pages oder eigenem Hosting
- Kein Build-Step: Alles in `viewer/index.html` (815 Zeilen), Vendor-Libs unter `vendor/`
- GitHub-Repo: https://github.com/designhaus-berlin/3d-viewer
- Testmodell: `assets/ae86.glb` (812 KB, Toyota AE86)
- Große GLB-Datei (`assets/260302_Dresden-Cotta_gesamt.glb`, 294 MB) lokal vorhanden, in `.gitignore`
- Performance-Probleme bei großen Modellen — Ursache unklar (Datei vs. Viewer), soll analysiert werden
- Nebenprojekt, kein Zeitdruck — solide aufbauen

## Constraints

- **Zero-Build**: Keine Transpiler, kein Bundler — direktes ESM, läuft per file:// oder einfachem HTTP-Server
- **Self-hosted**: Alle Libs lokal unter `vendor/` — kein CDN, offline-fähig
- **Kein Framework**: Vanilla JS, kein React/Vue/Svelte
- **Browser-only**: Kein Node.js im Viewer selbst (`serve.js` nur optionaler Dev-Server)
- **Backwards Compatibility**: Legacy postMessage-API-Aliases müssen während einer Migrationsfrist erhalten bleiben

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Iframe-Isolation statt Web Component intern | Vollständige JS-Isolation, Host-Code kann nie Three.js-Internals berühren | ✓ Good |
| Self-hosted vendor libs | Kein CDN-Ausfall, offline-fähig, kontrollierte Versionen | ✓ Good |
| Alles in einer `viewer/index.html` | Einfacher Start, null Konfiguration | ⚠️ Revisit — bei 815 Zeilen Grenze erreicht |
| `ALLOW_ORIGIN = '*'` | Dev-Convenience | ⚠️ Revisit — Sicherheitsrisiko in Produktion |
| postMessage als primäre API | Funktioniert cross-origin, framework-agnostisch | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after initialization*
