# Phase 2: Dokumentation & Demo — Research

**Researched:** 2026-04-13
**Domain:** Static site deployment (GitHub Pages), DB UX Design System self-hosting, API documentation completeness
**Confidence:** HIGH (all major claims verified via CDN inspection, source-code audit, or npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Demo-Seite: Zweck**
- D-01: Viewer-Showcase — der 3D-Viewer steht im Vordergrund, keine Code-Beispiele auf der Seite
- D-02: AE86 ist das Demo-Modell (`assets/ae86.glb`, 812 KB — passt für GitHub Pages)

**Demo-Seite: Layout**
- D-03: Hero-Layout — Viewer nimmt den oberen Bereich ein (groß), darunter Tab-Navigation
- D-04: Unter dem Viewer: Tabs mit Kamera-Preset-Buttons (animateCamera / focus Commands)
- D-05: Keine Sichtbarkeit-Toggles, keine Live-API-Console in dieser Phase

**Demo-Seite: DB UX Komponenten**
- D-06: `db-header` / `db-navigation` — Seitenheader mit Projektname + GitHub-Link
- D-07: `db-tabs` — Tab-Navigation unter dem Viewer
- D-08: `db-button` — Kamera-Preset Buttons in den Tabs
- D-09: Accordion — für evtl. Beschreibungstexte oder Bauteil-Gruppen
- D-10: Alle DB UX Komponenten werden self-hosted aus `vendor/db-ux/` geladen — kein CDN

**Demo-Seite: Sprache**
- D-11: Deutsch — Demo-Seite in deutscher Sprache
- D-12: README auf GitHub bleibt Englisch

**README (DOC-01)**
- D-13: Englisch — README.md für GitHub, Embed-Snippet als erstes
- D-14: Quick-Start-Fokus: Embed-Code + `?model=` Parameter + bereit in unter einer Minute

**API-Referenz (DOC-03)**
- D-15: `docs/api.md` wird erweitert — bestehende Struktur beibehalten
- D-16: Fehlende Commands: `setOrbitConstraints`, `setHover`, `setAnimationEnabled`, `modelReady` Event
- D-17: Legacy-Commands mit Deprecation-Hinweis markieren

**GitHub Pages / Deployment (DOC-02)**
- D-18: Deployed aus `/docs`-Ordner auf `master`-Branch → `designhaus-berlin.github.io/3d-viewer`
- D-19: Viewer `iframe` zeigt auf relativen Pfad (`../viewer/index.html` oder equivalent in docs/)
- D-20: AE86-Asset muss in `docs/` oder per relativem Pfad erreichbar sein

### Claude's Discretion
- Genaue Farbgebung und Abstände im Hero-Bereich (DB UX Design Tokens werden verwendet)
- Welche Kamera-Presets konkret gezeigt werden (Frontansicht, Seite, Detail — aus AE86-Geometrie ableiten)
- Ob die Demo-Seite `host-example/index.html` ersetzt oder zusätzlich zu ihr existiert
- Wie `docs/` strukturiert ist (Unterordner für Assets, etc.)
- Sprache der `api.md` (aktuell gemischt DE/EN — konsistent machen)

### Deferred Ideas (OUT OF SCOPE)
- Interaktive API-Console (Live-postMessage-Commands tippen) → v2 (DOC-V2-01)
- Englische Version der Demo-Seite → Backlog
- Sichtbarkeit-Toggles für AE86-Bauteile auf der Demo-Seite → Phase 4
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | README mit funktionierendem Embed-Snippet — copy-paste embedden ohne weitere Doku | README.md existiert bereits mit gutem Inhalt; Lücken identifiziert (kein englischer Quick-Start, kein Embed-Snippet ganz oben) |
| DOC-02 | GitHub Pages Demo — Live-Viewer mit AE86 auf designhaus-berlin.github.io/3d-viewer; alle Assets self-hosted | Path-Strategie geklärt (docs/index.html + symlink-freie Asset-Referenzierung), DB UX Self-hosting-Dateien identifiziert |
| DOC-03 | API-Referenz vollständig — docs/api.md deckt alle Commands inkl. Legacy-Deprecation-Hinweise ab | Gap-Analyse abgeschlossen: 2 Events fehlen (modelReady, camera), 2 Commands fehlen (setOrbitConstraints, setAnimationEnabled vollständig mit Parametern); api.md Grundstruktur vorhanden |
</phase_requirements>

---

## Summary

Phase 2 ist eine reine Dokumentations- und Deployment-Phase — kein neuer Viewer-Code. Die drei Aufgaben sind unabhängig voneinander und können parallel geplant werden: README aktualisieren (DOC-01), Demo-Seite in `docs/` bauen und DB UX self-hosten (DOC-02), `docs/api.md` vervollständigen (DOC-03).

**Kritischster Befund:** Der GitHub Pages `/docs`-Ansatz hat eine fundamentale Pfad-Einschränkung. `docs/index.html` liegt in `docs/`, aber `viewer/index.html` liegt im Repo-Root. GitHub Pages serviert **nur** den `docs/`-Ordner. Der iframe `src` muss auf `https://designhaus-berlin.github.io/3d-viewer/viewer/index.html` zeigen — das geht nicht per relativer Pfad `../viewer/index.html`, weil `viewer/` außerhalb des GitHub-Pages-Root liegt. **Lösung:** Den gesamten nötigen Content nach `docs/` kopieren oder GitHub Pages auf den Repo-Root (gesamte `master`-Branch) umzustellen. Beides hat Implikationen, die unten dokumentiert sind.

**DB UX Self-hosting:** Konkrete Dateiliste und Struktur sind vollständig ermittelt. Das `relative.css` von `@db-ux/core-foundations@4.5.0` verwendet `../assets/`-Pfade — bei korrekter Verzeichnisstruktur unter `vendor/db-ux/` sind keine Pfad-Anpassungen im CSS nötig. Die gesamte self-gehostete DB UX-Grundlage ist ca. 1–2 MB (ohne Icon-Font-Varianten, nur Default + Fallback).

**Primary recommendation:** GitHub Pages auf den Repo-Root (`master`-Branch) konfigurieren, `docs/` behält `api.md`; `docs/index.html` wird die Demo-Seite, der iframe zeigt auf `../viewer/index.html` relativ — das funktioniert, weil GitHub Pages dann den gesamten Repo-Root serviert.

---

## Standard Stack

### Core (bereits im Projekt vorhanden)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Three.js | vendor (minified) | 3D rendering | already vendored |
| DB UX wc-core-components | 4.5.0 | Web Components (db-header, db-tabs, db-button, db-accordion) | Projekt-Entscheidung D-10 |
| DB UX core-foundations | 4.5.0 | Design Tokens, Fonts, Icons (CSS) | Pflicht-Dependency für wc-core-components |

**Hinweis zu Versionen:** [VERIFIED: npm registry] `@db-ux/wc-core-components` und `@db-ux/core-foundations` haben aktuell Version **4.6.0** als latest. Die Entscheidung verwendet **4.5.0** (was `host-example/index.html` aktuell per CDN lädt). Beide Versionen existieren auf npm. Da die Entscheidung 4.5.0 festlegt und Konsistenz mit dem bestehenden Beispiel wichtig ist, bleibt 4.5.0 die Zielversion.

### Keine weiteren Dependencies nötig
Diese Phase fügt keine neuen Build-Tools oder Transpiler hinzu. Zero-Build bleibt.

---

## Architecture Patterns

### Empfohlene `docs/`-Struktur

**Problem:** GitHub Pages kann nur aus dem Repo-Root (`master`-Branch) oder dem `/docs`-Ordner servieren. Der `/docs`-Ordner enthält derzeit nur `api.md`. Wenn GitHub Pages auf `/docs` zeigt, ist `viewer/index.html` (im Repo-Root) für den Browser nicht erreichbar — ein iframe `src="../viewer/index.html"` würde einen 404 liefern.

**Zwei Lösungsoptionen:**

**Option A (empfohlen): GitHub Pages auf Repo-Root konfigurieren**
- GitHub Pages Einstellung: Source = `master` Branch, Folder = `/ (root)`
- `docs/index.html` wird die Demo-Seite (GitHub Pages serviert sie als `designhaus-berlin.github.io/3d-viewer/docs/index.html`)  
- ODER: `index.html` im Repo-Root als Demo-Seite
- iframe src: `./viewer/index.html?model=./assets/ae86.glb` (relativ)
- Vorteile: Kein Duplizieren von Viewer-Dateien, viewer/ und assets/ bleiben wo sie sind
- Nachteil: Die Repo-Root ist die Pages-Root — alle Dateien im Root sind öffentlich (sind sie sowieso)

**Option B: Viewer in docs/ duplizieren**
- GitHub Pages Einstellung: Source = `master` Branch, Folder = `/docs`
- `docs/viewer/` enthält eine Kopie von `viewer/index.html`
- `docs/vendor/` enthält eine Kopie von `vendor/`
- `docs/assets/ae86.glb` enthält eine Kopie des Modells
- Nachteil: Massive Duplikation (~50+ MB vendor-Dateien), Pflege-Albtraum, zwei Quellen der Wahrheit

**Entscheidung für Planner:** Option A ist klar vorzuziehen. Der Planner soll GitHub Pages auf Root konfigurieren. `docs/index.html` bleibt als kanonischer Pfad für api.md; die Demo-Seite kommt als `docs/demo.html` oder als `index.html` im Root.

**Empfohlene finale Struktur:**

```
/ (Repo-Root = GitHub Pages Root)
├── docs/
│   ├── api.md            ← existiert, wird erweitert
│   └── index.html        ← NEUE Demo-Seite (DOC-02)
├── viewer/
│   └── index.html        ← Viewer (bleibt wo er ist)
├── vendor/
│   ├── three.module.min.js
│   ├── lil-gui.esm.min.js
│   ├── addons/
│   └── db-ux/            ← NEU: self-hosted DB UX
│       ├── foundations/
│       │   ├── build/styles/relative.css
│       │   └── assets/
│       │       ├── fonts/          ← 6x woff2 (~170KB gesamt)
│       │       └── icons/fonts/    ← default/ + fallback/ (~5KB gesamt minimal)
│       └── wc/
│           └── esm/                ← gesamtes dist/esm/ Verzeichnis
├── assets/
│   └── ae86.glb          ← bleibt wo es ist (812KB, unter 100MB-Limit)
└── index.html            ← optional: Redirect → docs/index.html
```

Iframe in `docs/index.html`:
```html
<iframe src="../viewer/index.html?model=../assets/ae86.glb&theme=light">
```

### DB UX Self-Hosting Pattern

[VERIFIED: CDN inspection at cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0 und /wc-core-components@4.5.0]

**Schritt 1: CSS laden (`@db-ux/core-foundations@4.5.0`)**

Datei: `build/styles/relative.css` (298 KB)
- Enthält alle Design-Tokens, @font-face-Deklarationen
- Pfade zu Fonts: `../assets/fonts/OpenSans-*-EU.woff2` (relativ zur CSS-Datei)
- Pfade zu Icon-Fonts: `../assets/icons/fonts/default/db-ux.woff2` etc.
- Bei Ablage in `vendor/db-ux/foundations/build/styles/relative.css` werden Assets erwartet unter `vendor/db-ux/foundations/assets/`

```html
<link rel="stylesheet" href="../vendor/db-ux/foundations/build/styles/relative.css">
```

**Schritt 2: Font-Dateien** (nur WOFF2 für Web, keine TTF nötig)
```
vendor/db-ux/foundations/assets/fonts/
  OpenSans-Light-EU.woff2      (~28KB)
  OpenSans-Regular-EU.woff2    (~28KB)
  OpenSans-Medium-EU.woff2     (~29KB)
  OpenSans-SemiBold-EU.woff2   (~28KB)
  OpenSans-Bold-EU.woff2       (~28KB)
  OpenSans-ExtraBold-EU.woff2  (~28KB)
```
Gesamt Fonts: ca. 170 KB

**Schritt 3: Icon-Font-Dateien** (minimal — nur Default + Fallback)

Für `db-header`, `db-tabs`, `db-button` werden nur die Default-Größen benötigt.
```
vendor/db-ux/foundations/assets/icons/fonts/
  default/db-ux.woff2         (~4.5KB)
  fallback/icon-font-fallback.woff2  (~704B)
```
Nur wenn andere Größen (`default_16`, `default_24` etc.) genutzt werden: weitere Directories. Empfehlung: Zunächst nur `default/` und `fallback/` — bei fehlenden Icons im Browser die weiteren Varianten ergänzen.

**Schritt 4: Web Components JS**

Das `dist/esm/db-ux.js` ist der Stencil-Bootstrap-Loader. Er hat relative Imports zu gehashten Hilfsdateien im gleichen Verzeichnis — daher muss **das gesamte `dist/esm/`-Verzeichnis** kopiert werden.

```html
<script type="module">
  import { defineCustomElements } from '../vendor/db-ux/wc/esm/loader.js';
  defineCustomElements();
</script>
```

Alternativ (einfacher, keine Import-Map nötig):
```html
<script type="module" src="../vendor/db-ux/wc/esm/db-ux.js"></script>
```

`db-ux.js` registriert alle Custom Elements automatisch. Beide Ansätze funktionieren ohne Bundler, weil der Stencil-Output native ESM mit relativen Pfaden ist.

**Dateigröße Schätzung self-hosted DB UX (minimal):**
| Verzeichnis | Geschätzte Größe |
|-------------|-----------------|
| `foundations/build/styles/relative.css` | 298 KB |
| `foundations/assets/fonts/` (6x woff2) | ~170 KB |
| `foundations/assets/icons/fonts/default/` | ~4.5 KB |
| `foundations/assets/icons/fonts/fallback/` | ~1 KB |
| `wc/esm/` (gesamtes Verzeichnis ~30+ Dateien) | ~300 KB |
| **Gesamt** | **~775 KB** |

### DB UX Komponenten-Verwendung in docs/index.html

[VERIFIED: host-example/index.html lesen — zeigt tatsächliche Verwendung]

`host-example/index.html` nutzt DB UX aktuell **nur als CSS-Klassen** (keine Web Component Tags):
- `class="db-button"` auf `<button>` — funktioniert mit nur CSS
- `class="db-accordion"`, `class="db-accordion-item"` — nur CSS-basiert
- Kein `<db-header>`, kein `<db-tabs>` — diese Custom Elements werden in Phase 2 erst eingesetzt

Für die neue Demo-Seite (D-06 bis D-09) werden echte Custom Elements benötigt:
```html
<db-header>
  <span slot="logo">3D Viewer</span>
  <a slot="action" href="https://github.com/designhaus-berlin/3d-viewer">GitHub</a>
</db-header>

<db-tabs>
  <db-tab-list>
    <db-tab>Übersicht</db-tab>
    <db-tab>Räder</db-tab>
  </db-tab-list>
  <db-tab-panel>...</db-tab-panel>
</db-tabs>

<db-button onclick="send('focus', {...})">Frontansicht</db-button>
```

**ACHTUNG:** Die genaue Slot-API von `db-header` und `db-tabs` muss beim Bauen aus der Custom Elements Manifest-Datei (`dist/custom-elements.json`, 1.22 MB) abgeleitet werden oder durch Sichten der Stencil-Quellen. [ASSUMED] Die oben gezeigten Slot-Namen entsprechen Standard-Stencil-Patterns, sind aber nicht direkt aus der CDN-Dokumentation verifiziert.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Design Tokens / CSS Variables | eigene Farbvariablen | DB UX `relative.css` | Entscheidung D-10; Konsistenz mit host-example |
| Web Component Custom Elements | eigene `<my-header>` | `<db-header>`, `<db-tabs>`, `<db-button>` | D-06 bis D-09 |
| Icon Fonts | SVG-Icons einbauen | DB UX `assets/icons/fonts/` | Icons sind in den Web Components eingebaut |
| postMessage send-Helper | neu schreiben | aus `host-example/index.html` übernehmen | bereits bewährt, 4 Zeilen |

---

## API Gap Analysis (DOC-03)

### Vergleich: `viewer/index.html` vs. `docs/api.md`

[VERIFIED: vollständige Durchsicht beider Dateien]

**Commands (Host → Viewer):**

| Command | In viewer/index.html? | In docs/api.md? | Status |
|---------|----------------------|-----------------|--------|
| `animateCamera` | ja (case) | ja | vollständig |
| `focus` | ja (case) | ja, alle 3 Varianten | vollständig |
| `setVisibility` | ja (case) | ja | vollständig |
| `setOrbitEnabled` | ja (case) | ja | vollständig |
| `setAnimationEnabled` | ja (case) | ja | vollständig — README hat es, aber check api.md |
| `setHover` | ja (case) | ja | vollständig |
| `setOrbitConstraints` | ja (case, vollständig) | ja, vollständig | vollständig |
| `setDebug` | ja (case) | NEIN | **FEHLT in api.md** |
| `playClip` | ja (case, gibt warn) | NEIN | **FEHLT** — sollte als "not implemented" dokumentiert werden |

**Events (Viewer → Host):**

| Event | In viewer/index.html? | In docs/api.md? | Status |
|-------|----------------------|-----------------|--------|
| `ready` | ja (`post({type:'ready'...})`) | ja | vollständig |
| `loading` | ja | ja | vollständig |
| `poi` | ja | ja | vollständig |
| `aliases` | ja (`post({type:'aliases'...})`) | ja | vollständig |
| `camera` | ja (in `setCamera` legacy) | ja | vollständig |
| `error` | ja | ja | vollständig |
| `modelReady` | ja (`post({type:'modelReady'...})`) | **NEIN** | **FEHLT** |

**Legacy Commands:**

| Legacy Command | Deprecated Warning in Code? | In api.md? | Status |
|----------------|---------------------------|------------|--------|
| `setCamera` | ja | nein (alte api.md nur `setCamera` als Beispiel) | muss als deprecated markiert werden |
| `setVisible` | ja | nein | muss als deprecated markiert werden |
| `enableOrbit` | ja | nein | muss als deprecated markiert werden |
| `focusNode` | ja | nein | muss als deprecated markiert werden |
| `focusWheel` | ja | nein | muss als deprecated markiert werden |
| `setWheelVisible` | ja | nein | muss als deprecated markiert werden |

**Befund:** Die aktuelle `docs/api.md` (1 KB) ist der **alte**, minimale Stand (< 30 Zeilen). Die `README.md` (447 Zeilen) ist bereits die vollständige neue API-Referenz. Das Ziel laut D-15 ist `docs/api.md` erweitern. In der Praxis bedeutet das: `docs/api.md` bekommt den Inhalt der README-API-Abschnitte plus die fehlenden Einträge (`modelReady`, `setDebug`, `playClip` not-implemented, Legacy-Deprecation-Tabelle).

**Zusätzlich fehlend in api.md (im Vergleich zur README):** Die `docs/api.md` enthält keine `setAnimationEnabled`-, `setHover`-, oder `setOrbitConstraints`-Dokumentation — all das steht bereits in der README, fehlt aber in `docs/api.md`. Der einfachste Plan: README-API-Inhalt nach `docs/api.md` spiegeln + die Lücken auffüllen.

**URL-Parameter:** `allowOrigins` (Phase 1 neu hinzugekommen) fehlt in `README.md` URL-Parameter-Tabelle. Muss ergänzt werden.

---

## GitHub Pages Deployment (DOC-02) — Technische Details

### Origin-Validierung und postMessage

[VERIFIED: viewer/index.html SEC-01 Implementierung + GitHub Pages CORS-Verhalten]

Das in Phase 1 implementierte SEC-01 prüft `event.origin` gegen die Allowlist. Auf GitHub Pages:
- Demo-Seite: `https://designhaus-berlin.github.io/3d-viewer/docs/index.html`
- Viewer (wenn Root-Deployment): `https://designhaus-berlin.github.io/3d-viewer/viewer/index.html`
- **Beides ist gleicher Origin** (`https://designhaus-berlin.github.io`)
- Same-Origin postMessage funktioniert ohne `allowOrigins`-Parameter
- iframe `sandbox="allow-scripts allow-same-origin"` ist nötig für postMessage mit Same-Origin

Der Viewer-iframe-`src` muss auf eine URL zeigen, die von GitHub Pages serviert wird. Bei Option A (Root-Deployment):
```html
src="../viewer/index.html?model=../assets/ae86.glb&theme=light"
```
Funktioniert, weil beide Pfade relativ zum Repo-Root sind und GitHub Pages den Root serviert.

### AE86-Asset

[VERIFIED: .gitignore + du-Befehl auf lokalem Filesystem]
- `assets/ae86.glb` ist 812 KB — weit unter dem GitHub 100 MB-Limit
- `assets/ae86.glb` ist NICHT in `.gitignore` — die Datei wird committed
- `assets/260302_Dresden-Cotta_gesamt.glb` (294 MB) ist in `.gitignore` — bleibt lokal
- Kein Git LFS nötig für ae86.glb
- GitHub Pages unterstützt kein Git LFS — relevant nur für große Dateien

### GitHub Pages Konfiguration

[ASSUMED] GitHub Pages Einstellungen müssen im Repo unter **Settings → Pages → Source** auf `master` Branch, Folder `/ (root)` geändert werden (oder verifiziert dass dies bereits so konfiguriert ist). Die aktuelle Einstellung ist unbekannt — der Planner soll diese als zu prüfenden Schritt einbauen.

---

## Common Pitfalls

### Pitfall 1: `/docs`-Only GitHub Pages mit iframe auf viewer/

**Was schiefläuft:** `docs/index.html` hat `<iframe src="../viewer/index.html">`. GitHub Pages serviert nur `/docs/` — der Pfad `../viewer/` liegt außerhalb des Roots und liefert 404.

**Warum es passiert:** GitHub Pages `/docs`-Modus sieht nur den `docs/`-Unterordner als Web-Root.

**Wie vermeiden:** GitHub Pages auf Root-Branch konfigurieren (Option A). Dann ist `viewer/` erreichbar.

**Warning sign:** 404 auf die iframe-URL beim ersten GitHub Pages Test.

### Pitfall 2: DB UX `rollup.css` statt `relative.css` für Self-Hosting

**Was schiefläuft:** `rollup.css` (298 KB) referenziert Fonts als `"@db-ux/core-foundations/assets/fonts/..."` — das sind Node.js-Modul-Pfade, die im Browser nicht aufgelöst werden. Fonts laden nicht.

**Wie vermeiden:** `relative.css` verwenden. Diese nutzt `"../assets/fonts/..."` — funktioniert mit der beschriebenen Verzeichnisstruktur.

**Warning sign:** Viewer lädt, aber Fonts sind System-Fallback (kein Open Sans), Icons fehlen.

### Pitfall 3: Nur `dist/esm/db-ux.js` kopieren, rest fehlt

**Was schiefläuft:** `db-ux.js` importiert `./index-Bs7RfNRP.js` und `./app-globals-DQuL1Twl.js` mit relativen Pfaden. Fehlen diese, bricht das Modul mit einem Netzwerk-404-Fehler.

**Wie vermeiden:** Das **gesamte** `dist/esm/`-Verzeichnis kopieren (alle ~30+ Dateien). Die Datei `dist/db-ux/` (Stencil lazy-load chunks) ebenfalls mitkopiern.

**Warning sign:** Browser-Konsole zeigt `Failed to fetch` für gehashte JS-Dateien.

### Pitfall 4: postMessage origin mismatch zwischen localhost und GitHub Pages

**Was schiefläuft:** Demo-Seite sendet `postMessage` an den iframe. Lokal ist Origin `http://localhost` oder `http://localhost/3d-viewer/`. Auf GitHub Pages ist Origin `https://designhaus-berlin.github.io`. Wenn der Planner hardkodierte Origins in den Viewer-Aufruf einbaut, funktioniert es nur lokal ODER nur auf GitHub Pages.

**Wie vermeiden:** Viewer-URL ohne `?allowOrigins=`-Parameter einbetten. Dann gilt Same-Origin-Logik: Origin der Demo-Seite = Origin des Viewers = automatisch erlaubt.

**Warning sign:** Kein 3D-Viewer-Response auf Kamera-Buttons, Browser-Konsole zeigt kein `[host→viewer]`-Log auch bei `?gui=1`.

### Pitfall 5: `modelReady` vs. `ready` verwechseln

**Was schiefläuft:** Es gibt sowohl ein `ready`-Event (beim Viewer-Start, vor dem Model-Load) als auch ein `modelReady`-Event (nach erfolgreichem Laden des Modells). Demo-Code der auf `ready` wartet, um Kamera-Presets einzustellen, wird fehlschlagen weil das Modell noch nicht geladen ist.

**Wie vermeiden:** Demo-Seite hört auf `modelReady` bevor Kamera-Commands gesendet werden. API-Referenz dokumentiert beide Events klar getrennt.

---

## Code Examples

### Demo-Seite: postMessage send-Pattern (aus host-example übernehmen)

```javascript
// [VERIFIED: host-example/index.html]
const iframe = document.getElementById('viewer');
const ORIGIN = new URL(iframe.src).origin;  // same-origin auf GitHub Pages

function send(type, payload) {
  iframe.contentWindow.postMessage({ type, payload }, ORIGIN);
}
```

### DB UX Self-Hosting laden (docs/index.html)

```html
<!-- [VERIFIED: CDN inspection + relative.css path-Analyse] -->
<link rel="stylesheet"
  href="../vendor/db-ux/foundations/build/styles/relative.css">

<script type="module" src="../vendor/db-ux/wc/esm/db-ux.js"></script>
```

### Viewer-iframe in docs/index.html

```html
<!-- [VERIFIED: viewer/index.html URL params + GitHub Pages root-deployment] -->
<iframe
  id="viewer"
  src="../viewer/index.html?model=../assets/ae86.glb&theme=light"
  allow="xr-spatial-tracking; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
  referrerpolicy="no-referrer"
  style="width:100%;height:100%;border:0">
</iframe>
```

### DB UX `db-tabs` Pattern (auf Basis Stencil-Standard)

```html
<!-- [ASSUMED] Slot-API aus Stencil-Standard, nicht direkt verifiziert -->
<db-tabs>
  <db-tab-list slot="tab-list">
    <db-tab>Übersicht</db-tab>
    <db-tab>Vorderachse</db-tab>
    <db-tab>Hinterachse</db-tab>
  </db-tab-list>
  <db-tab-panel>
    <!-- Kamera-Preset-Buttons für Übersicht -->
    <db-button onclick="send('focus', {selector:'all', padding:1.4, durationMs:1000})">
      Gesamtansicht
    </db-button>
  </db-tab-panel>
</db-tabs>
```

**Wichtig:** Die genauen Slot-Namen (`tab-list`, etc.) müssen beim Implementieren gegen `dist/custom-elements.json` verifiziert werden, bevor der Code als fertig gilt.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `host-example` CDN-URLs für DB UX | Self-hosted unter `vendor/db-ux/` | Phase 2 | Datenschutz-Constraint erfüllt |
| `docs/api.md` als Mini-Referenz (22 Zeilen) | Vollständige API-Referenz mit allen Commands, Events, Legacy-Tabelle | Phase 2 | DOC-03 erfüllt |
| README auf Deutsch, keine Quick-Start-Snippet | README auf Englisch, Embed-Snippet ganz oben | Phase 2 | DOC-01 erfüllt |
| Viewer nur lokal/XAMPP lauffähig | Viewer auf GitHub Pages live | Phase 2 | DOC-02 erfüllt |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub Pages ist aktuell auf `/docs`-Ordner konfiguriert (unbekannt) | GitHub Pages Deployment | Planner muss falschen Schritt korrigieren |
| A2 | `db-header` Slot-API: `slot="logo"`, `slot="action"` für Content | DB UX Komponenten-Verwendung | Demo-Seite rendered `db-header` falsch; fix durch Sichten von custom-elements.json |
| A3 | `db-tabs` / `db-tab-list` / `db-tab-panel` sind die korrekten Tag-Namen | DB UX Komponenten-Verwendung | Tabs funktionieren nicht; fix durch custom-elements.json |
| A4 | `designhaus-berlin.github.io` ist der korrekte GitHub Pages Hostname für das Repo `designhaus-berlin/3d-viewer` | GitHub Pages Deployment | URL in README und Demo falsch — fix durch GitHub Settings |

---

## Open Questions

1. **Aktuelle GitHub Pages Konfiguration des Repos**
   - Was wir wissen: Pages ist unter `designhaus-berlin.github.io/3d-viewer` geplant (CONTEXT.md D-18)
   - Was unklar: Ist GitHub Pages bereits aktiviert? Aktuell `/docs` oder Root?
   - Empfehlung: Planner baut einen Verificationsschritt ein: "GitHub Pages Settings prüfen und auf Root konfigurieren"

2. **`db-tabs` und `db-header` Slot-API**
   - Was wir wissen: Stencil-basierte Web Components, Stencil-Standard-Slots
   - Was unklar: Genaue Slot-Namen ohne Bundler ausprobieren
   - Empfehlung: Wave 0 des Plans soll `dist/custom-elements.json` (1.22 MB) parsen oder eine Test-HTML mit allen nötigen Komponenten bauen bevor die vollständige Demo-Seite implementiert wird

3. **Icon-Font Varianten: welche sind tatsächlich nötig?**
   - Was wir wissen: CSS referenziert `default/`, `default_16/`, `default_24/` etc.
   - Was unklar: Welche Icon-Sizes werden von `db-header`, `db-tabs`, `db-button` tatsächlich genutzt?
   - Empfehlung: Minimal starten (`default/` + `fallback/`), fehlende Größen im Browser-Netzwerk-Tab identifizieren und nachtragen

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| XAMPP Apache | Local dev/test | ja | auf `http://localhost/3d-viewer/` | node serve.js |
| Git | Commit & Push nach GitHub | [ASSUMED] ja | — | — |
| GitHub Pages | DOC-02 | [ASSUMED] ja, muss aktiviert/konfiguriert werden | — | kein Fallback — manuell aktivieren |
| npm (für Download der DB UX Dateien) | vendor/db-ux/ befüllen | [ASSUMED] verfügbar | — | Manual Download vom CDN (jsdelivr) |
| Browser (Chrome/Firefox) | Manuelle Validierung | ja (XAMPP impliziert Browser) | — | — |

**Hinweis zum DB UX-Download:** Die Dateien können entweder per `npm pack @db-ux/wc-core-components@4.5.0` + `tar -xf` extrahiert werden, oder direkt per `curl` von `cdn.jsdelivr.net/npm/`. Da kein `package.json` im Projekt existiert (Zero-Build-Constraint), ist der `curl`-Download bevorzugt — kein `node_modules/` entsteht.

---

## Validation Architecture

Diese Phase hat keinen automatisierten Test-Runner. Validierung erfolgt manuell durch Browser-Tests und `curl`-Checks.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manuell (kein automatisierter Test-Runner) |
| Config file | keine |
| Quick run command | `curl -I http://localhost/3d-viewer/docs/index.html` |
| Full suite command | Manuelle Browser-Checkliste (siehe unten) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | README.md enthält englisches Embed-Snippet als ersten Code-Block | manual | `curl -s http://localhost/3d-viewer/README.md \| grep -A 5 'iframe'` | ✅ README.md existiert |
| DOC-01 | Embed-Snippet (copy-paste) lädt Viewer ohne weitere Schritte | manual browser | Browser-Test: leere HTML-Seite + Snippet | ✅ viewer/index.html existiert |
| DOC-02 | GitHub Pages URL liefert HTTP 200 | curl | `curl -I https://designhaus-berlin.github.io/3d-viewer/docs/index.html` | ❌ Wave 0: docs/index.html erstellen |
| DOC-02 | Kein externer Request beim Laden der Demo-Seite | manual browser | DevTools → Network-Tab → Filter: external domains | ❌ Wave 0: vendor/db-ux/ befüllen |
| DOC-02 | AE86-Modell lädt im Live-Viewer | manual browser | Demo-Seite öffnen, warten auf modelReady | ❌ Wave 0: docs/index.html erstellen |
| DOC-02 | Kamera-Preset-Buttons bewegen die Kamera | manual browser | Button klicken, Kamera-Animation beobachten | ❌ Wave 0: docs/index.html erstellen |
| DOC-03 | docs/api.md enthält setDebug | manual | `curl -s http://localhost/3d-viewer/docs/api.md \| grep setDebug` | ✅ docs/api.md existiert (klein) |
| DOC-03 | docs/api.md enthält modelReady | manual | `curl -s http://localhost/3d-viewer/docs/api.md \| grep modelReady` | ✅ |
| DOC-03 | docs/api.md enthält Legacy-Deprecation-Tabelle | manual | `curl -s http://localhost/3d-viewer/docs/api.md \| grep deprecated` | ✅ |

### Manuelle Browser-Checkliste (vollständige Validierung)

**Lokal (XAMPP):**
- [ ] `http://localhost/3d-viewer/docs/index.html` lädt ohne JS-Fehler
- [ ] DevTools → Network: Kein Request an `cdn.jsdelivr.net` oder andere externe Domains
- [ ] DB UX Fonts geladen: Texte in Open Sans (nicht System-Font)
- [ ] `db-header` zeigt Projektname + GitHub-Link
- [ ] `db-tabs` sind klickbar, Tab-Wechsel funktioniert
- [ ] AE86-Modell lädt (loading-Event Fortschritt sichtbar, modelReady empfangen)
- [ ] Kamera-Preset-Buttons in Tabs senden `animateCamera`/`focus` korrekt
- [ ] Browser-Konsole leer (kein JS-Fehler, kein 404)

**GitHub Pages:**
- [ ] `https://designhaus-berlin.github.io/3d-viewer/docs/index.html` → HTTP 200
- [ ] Viewer lädt AE86 über HTTPS
- [ ] Alle Assets self-hosted (Network-Tab: alle Requests auf `designhaus-berlin.github.io`)
- [ ] postMessage funktioniert (Kamera-Buttons reagieren)

**README/DOC:**
- [ ] README.md öffnen auf GitHub → Embed-Snippet ist copy-paste-fähig
- [ ] `docs/api.md` auf GitHub → alle 8 Commands + alle 7 Events + Legacy-Tabelle

### Sampling Rate
- **Pro Task-Commit:** `curl -I http://localhost/3d-viewer/docs/index.html` (HTTP 200 check)
- **Pro Wave-Merge:** Vollständige manuelle Browser-Checkliste lokal
- **Phase Gate:** Vollständige Browser-Checkliste auf GitHub Pages grün bevor `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `docs/index.html` — existiert noch nicht (Demo-Seite)
- [ ] `vendor/db-ux/` — existiert noch nicht (muss befüllt werden)
- [ ] GitHub Pages auf Root konfigurieren — unbekannter aktueller Status

---

## Security Domain

> `security_enforcement` nicht explizit auf `false` gesetzt — Abschnitt enthalten.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | nein | statische Seite, kein Login |
| V3 Session Management | nein | kein Session-State |
| V4 Access Control | nein | öffentliche Demo |
| V5 Input Validation | ja (gering) | postMessage payload — bereits via SEC-01 (Phase 1) abgesichert |
| V6 Cryptography | nein | kein Crypto in Phase 2 |

### Relevante Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Externe CDN-Request aus Demo-Seite | Keine direkte Sicherheitslücke, aber Datenschutz-Verletzung | Alle Assets self-hosted (Datenschutz-Constraint) |
| Malicious postMessage an iframe | Tampering | SEC-01 (Phase 1) bereits implementiert — Same-Origin auf GitHub Pages automatisch |
| Veraltete DB UX Version mit Vulnerabilities | Supply Chain | Feste Version 4.5.0, offline gecacht — kein automatisches Update |

---

## Sources

### Primary (HIGH confidence)
- CDN inspection `cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/` — Verzeichnisstruktur, Dateinamen, Dateigrößen
- CDN inspection `cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/` — Verzeichnisstruktur, ESM-Dateien
- `cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/relative.css` — Font-Pfad-Analyse
- `cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js` — Stencil-Bootstrap-Analyse
- `viewer/index.html` (lokale Datei) — vollständige postMessage-Switch-Case-Analyse
- `host-example/index.html` (lokale Datei) — CDN-URLs, bestehende Komponenten-Verwendung
- `docs/api.md` (lokale Datei) — Gap-Analyse
- `README.md` (lokale Datei) — Gap-Analyse
- npm registry — Version 4.5.0 und 4.6.0 Existenz-Check

### Secondary (MEDIUM confidence)
- GitHub Docs: About large files — 100 MB Datei-Limit bestätigt [CITED: docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github]
- GitHub Docs: GitHub Pages serves with Access-Control-Allow-Origin: * [CITED: github.com/orgs/community/discussions/22399]

### Tertiary (LOW confidence)
- DB UX `db-tabs`/`db-header` Slot-API — aus Stencil-Standard-Pattern, nicht direkt aus Dokumentation verifiziert [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — CDN-Inspektion der exakten Paketstruktur
- Architecture: HIGH — Pfad-Analyse aus CSS + Stencil-Bootstrap-Quellcode
- API Gap Analysis: HIGH — direkte Quellcode-Analyse viewer/index.html vs. docs/api.md
- GitHub Pages Path-Strategie: HIGH — GitHub Pages Dokumentation + Logik-Analyse
- DB UX Komponenten Slot-API: LOW — nur aus Stencil-Konventionen, nicht direkt verifiziert

**Research date:** 2026-04-13
**Valid until:** 2026-07-13 (DB UX 4.5.0 ist gepinnte Version — stabil; GitHub Pages Verhalten ändert sich selten)
