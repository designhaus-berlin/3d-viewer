# 3D Viewer — Project State

**Last updated:** 2026-04-13
**Milestone:** v1.0 — Produktionsreife & öffentliche Veröffentlichung

---

## Project Reference

**Core value:** Der Viewer muss zuverlässig embedden und auf alle API-Commands reagieren — ohne Build-Step, ohne externe Abhängigkeiten, überall lauffähig.

**Current focus:** Phase 1 — Security Hardening

---

## Current Position

| Field | Value |
|-------|-------|
| Phase | 1 — Security Hardening |
| Plan | None started |
| Status | Not started |
| Blocking | Nothing |

**Progress:** Phase 0/4 complete

```
[░░░░░░░░░░░░░░░░░░░░] 0%
 Ph1  Ph2  Ph3  Ph4
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 4 |
| Phases complete | 0 |
| Requirements total (v1) | 15 |
| Requirements complete | 0 |
| Plans written | 0 |
| Plans complete | 0 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Docs before Modularisierung | Monolith läuft stabil; Demo-Seite braucht keine Module; Modularisierung ist höchster Aufwand und Prereq für npm | Roadmap |
| Performance nach Docs | VRAM-Leak fix landet in hover.js, das erst in Phase 4 existiert als Modul; Pipeline-Doku ist unabhängig | Roadmap |
| Modularisierung als letztes v1-Phase | Prereq für npm (v2); höchste Komplexität; API nach außen ändert sich nicht | Roadmap |

### Todos

- [ ] Phase 1 planning: `/gsd-plan-phase 1`

### Blockers

None.

### Research Flags

- Phase 3 (Performance): Profiling-Session auf dem 294-MB Dresden-GLB erforderlich — Bottleneck (Decode-Zeit, Geometrie-Count, Texture-VRAM, Draw-Calls) vor Task-Breakdown messen

---

## Session Continuity

**To resume:** Run `/gsd-plan-phase 1` to start planning Phase 1 (Security Hardening).

**Phase order:** 1 Security → 2 Docs & Demo → 3 Performance → 4 Modularisierung

**Constraint reminders:**
- Zero-build: kein Transpiler, kein Bundler
- Self-hosted: alle Libs unter `vendor/`, kein CDN
- Backwards compatibility: Legacy postMessage-Aliases bleiben während Migrationsfrist erhalten
