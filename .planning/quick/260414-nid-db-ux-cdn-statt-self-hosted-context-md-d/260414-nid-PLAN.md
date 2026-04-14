---
phase: quick
plan: 260414-nid
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/02-dokumentation-demo/02-CONTEXT.md
  - .planning/phases/02-dokumentation-demo/02-01-PLAN.md
  - .planning/phases/02-dokumentation-demo/02-RESEARCH.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "02-CONTEXT.md D-10 lautet: DB UX von jsDelivr CDN — kein Self-Hosting nötig"
    - "02-CONTEXT.md <specifics> enthält keinen Hinweis mehr auf vendor/db-ux/ oder gesperrte CDN-Requests"
    - "02-01-PLAN.md Task 1 lautet: CDN-Links in docs/index.html einbinden (2 HTML-Zeilen)"
    - "02-01-PLAN.md frontmatter files_modified enthält keine vendor/db-ux/-Einträge mehr"
    - "02-01-PLAN.md must_haves truths enthält 'docs/index.html lädt DB UX von CDN'"
    - "02-RESEARCH.md enthält Update-Hinweis 2026-04-14 am Anfang"
  artifacts:
    - path: ".planning/phases/02-dokumentation-demo/02-CONTEXT.md"
      provides: "Revidiertes D-10 (CDN statt self-hosted)"
    - path: ".planning/phases/02-dokumentation-demo/02-01-PLAN.md"
      provides: "Vereinfachtes Task 1 (2 HTML-Zeilen statt ~30 curl-Downloads)"
    - path: ".planning/phases/02-dokumentation-demo/02-RESEARCH.md"
      provides: "Update-Note zur CDN-Entscheidung"
  key_links:
    - from: "02-01-PLAN.md Task 2 action"
      to: "cdn.jsdelivr.net"
      via: "<link> und <script> im docs/index.html Head"
      pattern: "cdn.jsdelivr.net/npm/@db-ux"
---

<objective>
Planning-Artefakte für Phase 2 aktualisieren: DB UX Design System wird per jsDelivr CDN
eingebunden statt self-hosted, da DB der Kunde ist (CDN-Abhängigkeit akzeptiert).

Purpose: D-10 in CONTEXT.md war falsch — der Self-Hosting-Constraint gilt für den Viewer selbst
(viewer/index.html), nicht für Kunden-Demo-Seiten. DB ist Kunde, jsDelivr CDN ist akzeptiert.
Das eliminiert Task 1 (30+ curl-Downloads) komplett und ersetzt ihn durch 2 HTML-Zeilen.

Output:
- 02-CONTEXT.md mit revidiertem D-10 und bereinigtem <specifics>-Block
- 02-01-PLAN.md mit vereinfachtem Task 1, angepasstem frontmatter und must_haves
- 02-RESEARCH.md mit Update-Note
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-dokumentation-demo/02-CONTEXT.md
@.planning/phases/02-dokumentation-demo/02-01-PLAN.md
@.planning/phases/02-dokumentation-demo/02-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: 02-CONTEXT.md — D-10 und specifics-Block aktualisieren</name>
  <files>.planning/phases/02-dokumentation-demo/02-CONTEXT.md</files>
  <action>
    Zwei Stellen in der Datei anpassen:

    **1. D-10 in `<decisions>` (Zeile ~32):**
    Ersetze:
    ```
    - **D-10:** Alle DB UX Komponenten werden self-hosted aus `vendor/db-ux/` geladen — kein CDN
    ```
    Mit:
    ```
    - **D-10:** DB UX Komponenten werden von jsDelivr CDN geladen — kein Self-Hosting nötig, da DB unser Kunde ist
      - CSS: `https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css`
      - JS: `https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js`
    ```

    **2. `<specifics>`-Block (Zeilen ~61–69):**
    Ersetze den gesamten Absatz-Inhalt. Aktueller Text:
    ```
    - DB UX Design System wird self-hosted unter `vendor/db-ux/` ausgeliefert — keine Requests an `cdn.jsdelivr.net` oder andere externe Server (Datenschutz-Constraint aus PROJECT.md)
    - Die bestehende `host-example/index.html` lädt DB UX aktuell vom CDN — diese Abhängigkeit muss für die GitHub-Pages-Demo eliminiert werden
    - DB UX Pakete: `@db-ux/wc-core-components` + `@db-ux/core-foundations`, Apache-2.0, selbst gehostet
    ```
    Ersetzen mit:
    ```
    - DB UX Design System wird per jsDelivr CDN eingebunden — kein Self-Hosting, da DB unser Kunde ist (CDN-Abhängigkeit akzeptiert per D-10)
    - Der Datenschutz-Constraint (kein CDN) gilt für den Viewer selbst (`viewer/index.html`), nicht für Demo-Seiten
    - DB UX Pakete: `@db-ux/wc-core-components@4.5.0` + `@db-ux/core-foundations@4.5.0`, Apache-2.0, CDN-gebunden
    - CDN-URLs: CSS `https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css`, JS `https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js`
    ```

    Die dritte Zeile im `<specifics>`-Block (über `assets/ae86.glb`) und die vierte Zeile (über Demo-postMessage-Commands) bleiben unverändert erhalten.

    Den `<canonical_refs>`-Block ebenfalls bereinigen: Entferne oder ersetze den Eintrag:
    ```
    - `vendor/db-ux/` — Ziel-Verzeichnis für self-hosted DB UX Assets (noch nicht vorhanden — researcher soll ermitteln welche Pakete und welche Dateien dort landen)
    ```
    Mit:
    ```
    - DB UX CDN: `https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/` + `@db-ux/wc-core-components@4.5.0/` — kein lokaler Vendor-Baum nötig
    ```
  </action>
  <verify>
    <automated>grep -n "cdn.jsdelivr.net/npm/@db-ux" .planning/phases/02-dokumentation-demo/02-CONTEXT.md | head -5</automated>
  </verify>
  <done>
    02-CONTEXT.md enthält in D-10 die CDN-URLs für rollup.css und db-ux.js.
    `<specifics>` enthält keinen Hinweis mehr auf "keine Requests an cdn.jsdelivr.net" oder "self-hosted".
    `<canonical_refs>` referenziert vendor/db-ux/ nicht mehr als Zielverzeichnis.
  </done>
</task>

<task type="auto">
  <name>Task 2: 02-01-PLAN.md — Task 1 ersetzen, frontmatter und must_haves aktualisieren</name>
  <files>.planning/phases/02-dokumentation-demo/02-01-PLAN.md</files>
  <action>
    Vier Bereiche der Datei anpassen:

    **1. Frontmatter `files_modified` (Zeilen 7–13):**
    Ersetze den gesamten files_modified-Block:
    ```yaml
    files_modified:
      - vendor/db-ux/foundations/build/styles/relative.css
      - vendor/db-ux/foundations/assets/fonts/ (6x woff2)
      - vendor/db-ux/foundations/assets/icons/fonts/default/db-ux.woff2
      - vendor/db-ux/foundations/assets/icons/fonts/fallback/icon-font-fallback.woff2
      - vendor/db-ux/wc/esm/ (full dist/esm/ directory, ~30+ files)
      - docs/index.html
    ```
    Mit:
    ```yaml
    files_modified:
      - docs/index.html
    ```

    **2. `must_haves.truths` — erste Truth ersetzen:**
    Ersetze:
    ```
    - "docs/index.html lädt ohne externe Requests (kein cdn.jsdelivr.net, kein Google Fonts)"
    ```
    Mit:
    ```
    - "docs/index.html lädt DB UX von CDN (cdn.jsdelivr.net/npm/@db-ux) — kein self-hosted vendor/db-ux/"
    ```

    **3. `must_haves.artifacts` — vendor-Einträge entfernen:**
    Entferne die drei vendor-Einträge komplett:
    ```yaml
    - path: "vendor/db-ux/foundations/build/styles/relative.css"
      provides: "DB UX Design Tokens, @font-face Deklarationen mit relativen Pfaden"
    - path: "vendor/db-ux/foundations/assets/fonts/OpenSans-Regular-EU.woff2"
      provides: "Open Sans Webfont (repräsentativ für alle 6 Gewichte)"
    - path: "vendor/db-ux/wc/esm/db-ux.js"
      provides: "Stencil bootstrap loader — registriert alle DB UX Custom Elements"
    ```
    Der einzige verbleibende Artifact-Eintrag ist:
    ```yaml
    - path: "docs/index.html"
      provides: "Demo-Seite mit Hero-Layout (Viewer oben, Tabs + Accordion darunter), DB UX Komponenten"
    ```

    **4. `must_haves.key_links` — vendor-Links durch CDN ersetzen:**
    Ersetze die zwei vendor/db-ux/-Links:
    ```yaml
    - from: "docs/index.html"
      to: "vendor/db-ux/foundations/build/styles/relative.css"
      via: "<link rel=stylesheet href=../vendor/db-ux/foundations/build/styles/relative.css>"
      pattern: "vendor/db-ux/foundations"
    - from: "docs/index.html"
      to: "vendor/db-ux/wc/esm/db-ux.js"
      via: "<script type=module src=../vendor/db-ux/wc/esm/db-ux.js>"
      pattern: "vendor/db-ux/wc/esm"
    ```
    Mit:
    ```yaml
    - from: "docs/index.html"
      to: "cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0"
      via: "<link rel=stylesheet href=https://cdn.jsdelivr.net/.../rollup.css>"
      pattern: "cdn.jsdelivr.net/npm/@db-ux/core-foundations"
    - from: "docs/index.html"
      to: "cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0"
      via: "<script type=module src=https://cdn.jsdelivr.net/.../db-ux.js>"
      pattern: "cdn.jsdelivr.net/npm/@db-ux/wc-core-components"
    ```

    **5. `<objective>` anpassen:**
    Ersetze den `<objective>`-Block:
    ```
    DB UX Design System v4.5.0 self-hosten unter vendor/db-ux/ und die GitHub Pages Demo-Seite
    docs/index.html bauen: Hero-Layout mit Viewer-iframe oben und Kamera-Preset-Tabs mit Accordion darunter.

    Purpose: DOC-02 erfüllen — Live-Demo auf designhaus-berlin.github.io/3d-viewer/docs/index.html,
    alle Assets self-hosted (Datenschutz-Constraint), kein CDN-Request.

    Output:
    - vendor/db-ux/ mit foundations (CSS + Fonts + Icons) und wc/esm/ (Web Components JS)
    - docs/index.html — vollständige Demo-Seite mit DB UX Komponenten und AE86-Viewer
    ```
    Mit:
    ```
    Die GitHub Pages Demo-Seite docs/index.html bauen: Hero-Layout mit Viewer-iframe oben und
    Kamera-Preset-Tabs mit Accordion darunter. DB UX v4.5.0 wird per jsDelivr CDN eingebunden
    (kein Self-Hosting — DB ist Kunde, CDN-Abhängigkeit akzeptiert per D-10).

    Purpose: DOC-02 erfüllen — Live-Demo auf designhaus-berlin.github.io/3d-viewer/docs/index.html.

    Output:
    - docs/index.html — vollständige Demo-Seite mit DB UX Komponenten (CDN) und AE86-Viewer
    ```

    **6. `<interfaces>`-Block — vendor/db-ux-Kommentare durch CDN-URLs ersetzen:**
    Die zwei Kommentarzeilen im interfaces-Block:
    ```
    <!-- CSS: <link rel="stylesheet" href="../vendor/db-ux/foundations/build/styles/relative.css"> -->
    <!-- JS:  <script type="module" src="../vendor/db-ux/wc/esm/db-ux.js"></script> -->
    ```
    Ersetzen mit:
    ```
    <!-- CSS: <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css"> -->
    <!-- JS:  <script type="module" src="https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js"></script> -->
    ```

    **7. Task 1 komplett ersetzen:**
    Ersetze den gesamten ersten `<task type="auto">`-Block (Task 1: DB UX v4.5.0 self-hosten
    unter vendor/db-ux/) mit dem folgenden neuen Task 1:

    ```xml
    <task type="auto">
      <name>Task 1: CDN-Links für DB UX v4.5.0 in docs/index.html Head einbinden</name>
      <files>docs/index.html</files>
      <action>
        Stelle sicher, dass docs/index.html im `<head>` folgende zwei Zeilen enthält
        (per D-10: DB UX von jsDelivr CDN, kein Self-Hosting):

        ```html
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css">
        <script type="module" src="https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js"></script>
        ```

        Falls docs/index.html noch nicht existiert: Task 2 erstellt sie vollständig —
        diese beiden Zeilen müssen dort bereits enthalten sein.

        Falls docs/index.html aus einem früheren Stand noch `vendor/db-ux/`-Pfade enthält:
        Diese durch die CDN-URLs oben ersetzen.

        KRITISCH: `rollup.css` verwenden (nicht `relative.css`). `rollup.css` ist die
        CDN-taugliche Variante — sie hat absolute Asset-Pfade, die der Browser direkt
        von CDN laden kann.

        Kein vendor/db-ux/-Verzeichnis erstellen. Kein curl. Nur die zwei HTML-Zeilen.
      </action>
      <verify>
        <automated>grep -c "cdn.jsdelivr.net/npm/@db-ux" docs/index.html 2>/dev/null || echo "0"</automated>
      </verify>
      <done>
        docs/index.html enthält im Head mindestens 2 Treffer für cdn.jsdelivr.net/npm/@db-ux
        (eine für core-foundations CSS, eine für wc-core-components JS).
        Kein vendor/db-ux/-Pfad in docs/index.html.
      </done>
    </task>
    ```

    **8. Task 2 action — vendor/db-ux-Pfade durch CDN-URLs ersetzen:**
    Im bestehenden Task 2 action-Block:
    - Die HTML-Vorlage enthält `<link rel="stylesheet" href="../vendor/db-ux/foundations/build/styles/relative.css">` → ersetzen mit `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@4.5.0/build/styles/rollup.css">`
    - `<script type="module" src="../vendor/db-ux/wc/esm/db-ux.js">` → ersetzen mit `<script type="module" src="https://cdn.jsdelivr.net/npm/@db-ux/wc-core-components@4.5.0/dist/esm/db-ux.js">`
    - Den Verweis auf `DB UX Komponenten kommen aus vendor/db-ux/ (D-10)` ersetzen mit `DB UX Komponenten kommen vom jsDelivr CDN (D-10)`

    **9. Task 2 verify — cdn-Prüfung statt vendor-Prüfung:**
    Den verify-Befehl anpassen:
    ```
    curl -s http://localhost/3d-viewer/docs/index.html | grep -c "cdn.jsdelivr.net/npm/@db-ux"
    ```
    statt `| grep -c "vendor/db-ux"`

    **10. Task 2 done — letzten Punkt anpassen:**
    Ersetze:
    ```
    - KEINE Referenz auf cdn.jsdelivr.net oder andere externe URLs
    ```
    Mit:
    ```
    - CDN-Referenzen auf cdn.jsdelivr.net/npm/@db-ux/ für CSS und JS vorhanden
    - KEINE Referenz auf vendor/db-ux/ (kein Self-Hosting)
    ```

    **11. Checkpoint verify — Step 2 anpassen:**
    Im `<task type="checkpoint:human-verify">` how-to-verify, Schritt 2 ersetzen:
    ```
    2. DevTools → Network → Alle Requests: prüfen, dass KEIN Request an cdn.jsdelivr.net,
       unpkg, fonts.googleapis.com oder andere externe Domains geht
    ```
    Mit:
    ```
    2. DevTools → Network → Requests: cdn.jsdelivr.net/npm/@db-ux/ Requests für CSS und JS
       sichtbar (erwartet — CDN ist per D-10 akzeptiert). Kein fonts.googleapis.com, kein unpkg.
    ```

    **12. `<verification>`-Block anpassen:**
    Ersetze Schritte 1 und 2:
    ```
    1. `ls vendor/db-ux/foundations/build/styles/relative.css` → Datei existiert
    2. `ls vendor/db-ux/wc/esm/db-ux.js` → Datei existiert
    3. `curl -s http://localhost/3d-viewer/docs/index.html | grep "cdn.jsdelivr.net"` → leere Ausgabe (kein CDN-Link)
    ```
    Mit:
    ```
    1. `curl -s http://localhost/3d-viewer/docs/index.html | grep "cdn.jsdelivr.net/npm/@db-ux"` → mindestens 2 Treffer (CSS + JS)
    2. `curl -s http://localhost/3d-viewer/docs/index.html | grep "vendor/db-ux"` → leere Ausgabe (kein Self-Hosted-Pfad)
    ```

    **13. `<success_criteria>` anpassen:**
    Ersetze:
    ```
    - vendor/db-ux/ existiert mit foundations/ und wc/esm/ Teilbäumen (ca. 775 KB)
    - docs/index.html rendert im Browser ohne externe Netzwerk-Requests
    ```
    Mit:
    ```
    - docs/index.html lädt DB UX CSS und JS von cdn.jsdelivr.net/npm/@db-ux/ (CDN per D-10 akzeptiert)
    - docs/index.html rendert im Browser mit DB UX Custom Elements korrekt
    ```

    **14. `<threat_model>` — T-02-02 anpassen:**
    Ersetze die Disposition für T-02-02:
    ```
    | T-02-02 | Information Disclosure | CDN-Download von DB UX Assets | mitigate | Assets werden einmalig von jsdelivr heruntergeladen und dann self-hosted. Kein laufender CDN-Request von Nutzern. Download in Task 1 durch Executor kontrolliert. |
    ```
    Mit:
    ```
    | T-02-02 | Information Disclosure | CDN-Abhängigkeit jsDelivr für DB UX | accept | DB ist Kunde — CDN-Abhängigkeit per D-10 akzeptiert. Demo-Seite ist nicht für vertrauliche Daten. jsDelivr ist etablierter, stabiler CDN-Anbieter. |
    ```
  </action>
  <verify>
    <automated>grep -c "cdn.jsdelivr.net/npm/@db-ux" .planning/phases/02-dokumentation-demo/02-01-PLAN.md</automated>
  </verify>
  <done>
    02-01-PLAN.md frontmatter files_modified enthält nur noch docs/index.html.
    must_haves.truths enthält "lädt DB UX von CDN" statt "ohne externe Requests".
    must_haves.artifacts enthält keine vendor/db-ux/-Einträge mehr.
    Task 1 beschreibt 2 HTML-Zeilen im Head, nicht 30+ curl-Downloads.
    Task 2 action-HTML enthält cdn.jsdelivr.net-URLs, keine vendor/db-ux/-Pfade.
    Checkpoint verify beschreibt CDN-Requests als erwartet (nicht als Fehler).
  </done>
</task>

<task type="auto">
  <name>Task 3: 02-RESEARCH.md — Update-Note am Anfang einfügen</name>
  <files>.planning/phases/02-dokumentation-demo/02-RESEARCH.md</files>
  <action>
    Nach dem YAML-Frontmatter (falls vorhanden) bzw. nach dem Haupttitel der Datei,
    aber VOR dem ersten inhaltlichen Abschnitt, folgende Sektion einfügen:

    ```markdown
    ## Update Note

    **UPDATE 2026-04-14:** DB UX wird per CDN eingebunden (kein Self-Hosting) — Task 1 des
    ursprünglichen Plans entfällt. DB ist Kunde, CDN-Abhängigkeit akzeptiert. D-10 in
    CONTEXT.md wurde entsprechend revidiert. `02-01-PLAN.md` Task 1 ist jetzt: "2 HTML-Zeilen
    im Head einbinden" statt "30+ curl-Downloads nach vendor/db-ux/".

    ---

    ```

    Die Datei hat keinen YAML-Frontmatter-Block. Der Titel lautet
    `# Phase 2: Dokumentation & Demo — Research` auf Zeile 1.
    Die Update-Note kommt nach dem Metadaten-Block (Zeilen 1–5) und vor dem ersten
    inhaltlichen Abschnitt (`<user_constraints>` auf Zeile ~9).

    Konkret: Einfügen zwischen der Leerzeile nach `**Confidence:** HIGH (...)` und
    dem `<user_constraints>`-Tag.
  </action>
  <verify>
    <automated>grep -n "UPDATE 2026-04-14" .planning/phases/02-dokumentation-demo/02-RESEARCH.md</automated>
  </verify>
  <done>
    02-RESEARCH.md enthält am Anfang (vor user_constraints) den Update-Hinweis
    mit Datum 2026-04-14 und Erklärung der CDN-Entscheidung.
  </done>
</task>

</tasks>

<verification>
Nach Abschluss aller drei Tasks:

1. `grep "cdn.jsdelivr.net/npm/@db-ux" .planning/phases/02-dokumentation-demo/02-CONTEXT.md` → mindestens 2 Treffer (rollup.css + db-ux.js URLs)
2. `grep "vendor/db-ux/" .planning/phases/02-dokumentation-demo/02-CONTEXT.md` → keine Treffer mehr (kein Zielverzeichnis-Verweis)
3. `grep "files_modified" -A 5 .planning/phases/02-dokumentation-demo/02-01-PLAN.md | grep "vendor"` → leere Ausgabe
4. `grep "UPDATE 2026-04-14" .planning/phases/02-dokumentation-demo/02-RESEARCH.md` → 1 Treffer
</verification>

<success_criteria>
- D-10 in 02-CONTEXT.md lautet CDN statt self-hosted, mit konkreten URLs
- 02-CONTEXT.md `<specifics>` enthält keine gesperrten CDN-Requests mehr
- 02-01-PLAN.md frontmatter files_modified: nur docs/index.html
- 02-01-PLAN.md Task 1: 2 HTML-Zeilen, kein curl
- 02-01-PLAN.md must_haves: vendor/db-ux/-Artifacts entfernt, CDN-Truth ergänzt
- 02-RESEARCH.md: Update-Note mit 2026-04-14 am Anfang
</success_criteria>

<output>
Nach Abschluss: `.planning/quick/260414-nid-db-ux-cdn-statt-self-hosted-context-md-d/260414-nid-SUMMARY.md` erstellen mit:
- Welche Stellen in den drei Dateien geändert wurden
- Kurze Bestätigung dass D-10 nun CDN-basiert ist
</output>
