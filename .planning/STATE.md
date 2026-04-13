# 3D Viewer — Project State

**Last updated:** 2026-04-13
**Milestone:** v1.0 — Produktionsreife & öffentliche Veröffentlichung

---

## Project Reference

**Core value:** Der Viewer muss zuverlässig embedden und auf alle API-Commands reagieren — ohne Build-Step, ohne externe Abhängigkeiten, überall lauffähig.

**Current focus:** Phase 2 — Dokumentation & Demo

---

## Current Position

| Field | Value |
|-------|-------|
| Phase | 2 — Dokumentation & Demo |
| Plan | None started |
| Status | Not started |
| Blocking | Nothing |

**Progress:** Phase 1/4 complete

```
[████░░░░░░░░░░░░░░░░] 25%
 Ph1  Ph2  Ph3  Ph4
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 4 |
| Phases complete | 1 |
| Requirements total (v1) | 15 |
| Requirements complete | 2 (SEC-01, SEC-02) |
| Plans written | 1 |
| Plans complete | 1 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Docs before Modularisierung | Monolith läuft stabil; Demo-Seite braucht keine Module; Modularisierung ist höchster Aufwand und Prereq für npm | Roadmap |
| Performance nach Docs | VRAM-Leak fix landet in hover.js, das erst in Phase 4 existiert als Modul; Pipeline-Doku ist unabhängig | Roadmap |
| Modularisierung als letztes v1-Phase | Prereq für npm (v2); höchste Komplexität; API nach außen ändert sich nicht | Roadmap |

### Todos

- [ ] Phase 2 planning: `/gsd-plan-phase 2`

### Blockers

None.

### Research Flags

- Phase 3 (Performance): Profiling-Session auf dem 294-MB Dresden-GLB erforderlich — Bottleneck (Decode-Zeit, Geometrie-Count, Texture-VRAM, Draw-Calls) vor Task-Breakdown messen

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260413-pfh | CONCERNS.md triage + quick-fixes: onPick filter, legacy warns, modelReady, host-example ORIGIN | 2026-04-13 | e8b7e2c | [260413-pfh-concerns-md-triage-und-quick-fixes-onpic](./quick/260413-pfh-concerns-md-triage-und-quick-fixes-onpic/) |

---

## Session Continuity

**To resume:** Run `/gsd-plan-phase 2` to start planning Phase 2 (Dokumentation & Demo).

**Last activity:** 2026-04-13 - Completed quick task 260413-pfh: CONCERNS.md triage & quick-fixes

**Phase order:** 1 Security → 2 Docs & Demo → 3 Performance → 4 Modularisierung

**Constraint reminders:**
- Zero-build: kein Transpiler, kein Bundler
- Self-hosted: alle Libs unter `vendor/`, kein CDN
- Backwards compatibility: Legacy postMessage-Aliases bleiben während Migrationsfrist erhalten
