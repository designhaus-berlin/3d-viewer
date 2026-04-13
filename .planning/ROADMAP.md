# 3D Viewer — Roadmap

<!-- Phases will be added here after project initialization completes. -->

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
- Welche WCAG-Level wird angestrebt?
- Sollen die Layout-Varianten in `host-example/` oder als eigene Demo-Seiten leben?

**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote mit /gsd-review-backlog wenn bereit)
