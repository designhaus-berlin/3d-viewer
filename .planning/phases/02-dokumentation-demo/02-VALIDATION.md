---
phase: 2
slug: dokumentation-demo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manuell (kein automatisierter Test-Runner — vanilla JS, zero-build) |
| **Config file** | none |
| **Quick run command** | `curl -s http://localhost/3d-viewer/docs/index.html \| grep -c "db-header"` |
| **Full suite command** | Manuelle Browser-Checkliste (DevTools + Network-Tab) |
| **Estimated runtime** | ~5 Minuten manuell |

---

## Sampling Rate

- **After every task commit:** Datei-Inhalt prüfen via curl oder Read-Tool
- **After every plan wave:** Vollständige manuelle Browser-Checkliste
- **Before `/gsd-verify-work`:** Alle manuellen Checks müssen bestehen
- **Max feedback latency:** ~5 Minuten

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 2-01-01 | 01 | 1 | DOC-02 | vendor/db-ux/ enthält CSS, Fonts, JS | manual | `ls vendor/db-ux/` gibt Unterordner zurück | ⬜ pending |
| 2-01-02 | 01 | 1 | DOC-02 | docs/index.html existiert mit DB UX Demo | manual | `curl -s http://localhost/3d-viewer/docs/index.html \| grep -c "db-header"` | ⬜ pending |
| 2-01-03 | 01 | 2 | DOC-01 | README.md Embed-Snippet als erster Code-Block | manual | `curl -s http://localhost/3d-viewer/README.md \| grep -A 5 'iframe'` | ⬜ pending |
| 2-01-04 | 01 | 2 | DOC-03 | docs/api.md enthält alle Commands inkl. modelReady, setDebug | manual | `curl -s http://localhost/3d-viewer/docs/api.md \| grep -E "modelReady\|setDebug\|setOrbitConstraints\|deprecated"` | ⬜ pending |
| 2-01-05 | 01 | 2 | DOC-02 | Kein externer CDN-Request in docs/index.html | manual | DevTools Network-Tab: externe Domains prüfen | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vendor/db-ux/` — Verzeichnis anlegen, DB UX Dateien herunterladen (foundations CSS, wc-core-components JS + Fonts)
- [ ] `docs/index.html` — Demo-Seite erstellen (Hero + Tabs Layout, DB UX Komponenten, iframe → viewer)
- [ ] GitHub Pages Konfiguration — Repo-Root statt /docs (damit `../viewer/index.html` funktioniert)

*Alle drei sind Wave-0-Tasks — ohne sie kann kein späterer Test grün werden.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Kein externer Request beim Laden | DOC-02 | Requires DevTools Network observation | 1. docs/index.html in Browser laden 2. DevTools → Network → "All" 3. Prüfen: kein Request an cdn.jsdelivr.net, unpkg, esm.sh, fonts.googleapis.com 4. Verify: alle Requests gehen an localhost oder designhaus-berlin.github.io |
| AE86-Modell lädt in Live-Demo | DOC-02 | Requires actual 3D rendering | 1. Demo-Seite öffnen 2. Warten auf modelReady-Event (DevTools Console) 3. AE86-Modell muss sichtbar im Viewer erscheinen |
| Kamera-Preset Buttons funktionieren | DOC-02 | Requires user interaction + visual verification | 1. Kamera-Preset Button klicken 2. animateCamera/focus Command wird gesendet 3. Kamera-Animation läuft im Viewer |
| Embed-Snippet ist copy-paste-fähig | DOC-01 | Requires end-to-end test in empty HTML | 1. Snippet aus README kopieren 2. In leere HTML-Datei einfügen 3. Per HTTP-Server öffnen 4. Viewer erscheint und lädt Demo-Modell |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined
- [ ] Sampling continuity: checked after each task
- [ ] Wave 0: DB UX vendor files + docs/index.html + GitHub Pages config
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
