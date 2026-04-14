---
quick_id: 260414-nid
slug: db-ux-cdn-statt-self-hosted-context-md-d
status: complete
completed: 2026-04-14
commits:
  - 09bf43a
  - a8cf437
  - b442ac6
---

# Quick Task 260414-nid — DB UX CDN statt self-hosted

**Completed:** 2026-04-14
**Reason:** DB (Deutsche Bahn) ist Kunde — CDN-Abhängigkeit für DB UX ist akzeptiert, kein Self-Hosting nötig.
**Tasks:** 3/3
**Files modified:** 3

## Accomplishments

### Task 1: 02-CONTEXT.md aktualisiert (commit 09bf43a)

**D-10 revidiert:**
- Alt: `Alle DB UX Komponenten werden self-hosted aus vendor/db-ux/ geladen — kein CDN`
- Neu: `DB UX Komponenten werden von jsDelivr CDN geladen — kein Self-Hosting nötig, da DB unser Kunde ist`

**CDN-URLs eingetragen:**
- CSS: `https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css`
- JS: `https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js`

**`<specifics>` bereinigt:** Kein Verweis mehr auf "keine Requests an cdn.jsdelivr.net"; Datenschutz-Scope klargestellt (gilt für viewer/, nicht für Demo-Seiten)

**`<canonical_refs>` aktualisiert:** vendor/db-ux/ Eintrag ersetzt durch CDN-URL

### Task 2: 02-01-PLAN.md Task 1 vereinfacht (commit a8cf437)

**Alt (Task 1):** 30+ curl-Downloads nach vendor/db-ux/ (~775 KB, komplex)
**Neu (Task 1):** 2 HTML-Zeilen `<link>` und `<script>` im `<head>` von docs/index.html

**must_haves aktualisiert:**
- Entfernt: "vendor/db-ux/ existiert mit CSS, Fonts, JS"
- Hinzugefügt: "docs/index.html lädt DB UX CSS und JS von cdn.jsdelivr.net"

**Threat Model aktualisiert:**
- CDN-Abhängigkeit von "mitigate" auf "accept" geändert (bewusste Entscheidung)

### Task 3: 02-RESEARCH.md Update-Note (commit b442ac6)

Update-Hinweis am Anfang eingefügt:
> UPDATE 2026-04-14: DB UX wird per CDN (jsDelivr) eingebunden — kein Self-Hosting. DB ist Kunde, CDN-Abhängigkeit akzeptiert.

## Impact

Phase 2 Ausführung wird deutlich vereinfacht:
- **Kein** `vendor/db-ux/` Verzeichnis anlegen
- **Kein** Download von ~775 KB DB UX Dateien
- Plan 02-01 Task 1 ist jetzt trivial (2 HTML-Zeilen)
