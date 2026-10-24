# DND-31: Prüfungen auf toten Code, Duplikate und Komplexität

**Typ:** setup
**Status:** Freigegeben

## Kontext & Ziel

Bisher sieht niemand toten Code über Dateigrenzen, ungenutzte oder fehlende Dependencies, Duplikate oder steigende
Komplexität. ESLint, tsc und ruff prüfen nur innerhalb einer Datei bzw. Funktion. Ziel: Tools für diese Prüfungen in
Frontend und Backend, lokal und in den bestehenden Workflows als eigener Job nach dem Linting. Der aktuelle Stand ist
die Baseline: Die Pipelines bleiben grün, neue Verschlechterungen brechen sie. Voraussetzung: DND-30 (Node 24).

## Invarianten

- Kein Anwendungscode entfernt oder umgebaut. Nur Tooling, Konfiguration, Workflows und Doku ändern sich.
- Bestehendes Linting (ESLint, ruff, mypy) bleibt, keine doppelten Regeln.
- Trigger, Path-Filter, Caching und Versionen der Workflows unverändert, kein neuer Workflow.
- Lokal und im CI laufen dieselben Befehle (npm-Scripts bzw. Make-Ziele).

## Scope / Non-Goals

**Im Scope**
- Frontend: knip (ungenutzte Dateien, Exporte, Dependencies), jscpd (Duplikate in `src/`, min. 8 Zeilen).
- Backend: vulture (toter Code), deptry (ungenutzte/fehlende Dependencies), xenon (Komplexitätsgrenzen), pylint nur mit
  `duplicate-code` (Duplikate in `app/`, min. 8 Zeilen), ruff-Regelgruppen `C90`, `PIE`, `RET`.
- Baseline: Funde dokumentieren, Schwellwerte auf den Ist-Stand, bestehende Funde über Ignore-Listen/Whitelist erfasst.
- CI-Job `quality` in `frontend.yml` und `backend.yml`.

**Nicht im Scope**
- Aufräumen der Funde (Folge-Tasks, Reihenfolge unten).
- pylint als Linter (nur `duplicate-code`).
- Pre-commit-Hooks.

## Entscheidungen

### E1: vulture mit `min_confidence = 60` und Whitelist
- **Entscheidung:** 60 statt 80. Indirekt genutzter Code (Routen, Pydantic-Felder, Validatoren, Fixtures,
  ORM-Attribute) steht in `ignore_decorators`/`ignore_names` bzw. `vulture_whitelist.py`. Echter toter Code steht
  getrennt in `vulture_baseline.py`.
- **Verworfene Alternativen:** 80. vulture meldet ungenutzte Funktionen, Klassen und Attribute nur mit 60 %. Bei 80
  blieben nur ungenutzte Imports, Argumente und unerreichbarer Code, und das deckt ruff (F401/F841) schon ab.
- **Begründung:** Nur bei 60 findet vulture toten Code über Modulgrenzen.

### E2: Backend-Duplikate per pylint `duplicate-code`
- **Entscheidung:** pylint mit `disable = all`, `enable = duplicate-code`, `min-similarity-lines = 8`. Die Schwelle ist
  `fail-under` auf dem Ist-Score.
- **Verworfene Alternativen:** jscpd über ein eigenes `backend/package.json` (Node im Backend); jscpd aus dem
  Frontend-Install (Kopplung an das Frontend-Lockfile).
- **Begründung:** Python-nativ, im Backend reicht uv. ruff bleibt der einzige Linter.

### E3: Drei Commits statt einem pro Runde
- **Entscheidung:** Getrennte Commits für Frontend-Tooling, Backend-Tooling und CI. Umsetzung direkt in der Session,
  nicht über `/deliver-task`.
- **Begründung:** Vorgabe des Users.

### E4: Make-Ziele im Backend
- **Entscheidung:** `backend/Makefile` mit `check-deadcode`, `check-deps`, `check-complexity`, `check-dupes` und
  `check-quality`.
- **Begründung:** xenon liest keine Config-Datei. Die Grenzen sollen lokal und im CI an genau einer Stelle stehen.

## Subtasks

### Frontend
- [ ] knip und jscpd exakt gepinnt, Scripts `check:deadcode` und `check:dupes`.
- [ ] `frontend/knip.jsonc`: Falsch-Positive (generiertes `src/api/schema.d.ts`) getrennt von der Baseline.
- [ ] `frontend/.jscpd.json`: `src/`, min. 8 Zeilen, `threshold` = Ist-%.

### Backend
- [ ] vulture, deptry, xenon und pylint exakt gepinnt in `[dependency-groups] dev`.
- [ ] ruff: `C90`, `PIE`, `RET` aktiv, `max-complexity` = Ist.
- [ ] `[tool.vulture]`, `vulture_whitelist.py` (Falsch-Positive), `vulture_baseline.py` (toter Code).
- [ ] `[tool.deptry]` mit kommentierten Ausnahmen.
- [ ] `[tool.pylint]` nur `duplicate-code`, `fail-under` = Ist.
- [ ] `backend/Makefile` mit den Zielen aus E4, xenon-Grenzen = Ist.

### CI
- [ ] `frontend.yml` und `backend.yml`: Job `quality` mit `needs: lint`.

### Doku
- [ ] `frontend/CLAUDE.md`, `backend/CLAUDE.md` (Befehle, Konventionen, CI), `docs/architecture.md`
      („Qualitätssicherung“), `docs/known-issues.md` (Baseline), `.claude/skills/quick-task/SKILL.md` (Checks).

## Akzeptanzkriterien (nur setup)
- [ ] AK1: Alle neuen Checks laufen lokal über `npm run check:*` bzw. `make check-*` und im CI als Job `quality`
      nach `lint`.
- [ ] AK2: Wirksamkeit nachgewiesen: Auf dem Ist-Stand ist jeder Check grün. Eine absichtlich eingebaute
      Verschlechterung lässt ihn scheitern (nicht committet). Nach dem Push ist die CI grün.
- [ ] AK3: Alle Invarianten eingehalten – kein Anwendungscode geändert.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run check:deadcode`, `check:dupes`, `lint`, `typecheck`, `test:unit`, `build`.
- Backend: `make check-quality`, `uv run ruff check`, `ruff format --check`, `mypy app`, `pytest`.

**Manuell**
1. Pro Tool eine Verschlechterung vorübergehend einbauen (ungenutzter Export, 8+ Zeilen doppelt, Funktion mit höherer
   Komplexität, ungenutzte Funktion, ungenutzte Dependency). Der Check scheitert, danach zurücknehmen.

## Baseline

Wird bei der Umsetzung gefüllt: Anzahl und auffälligste Stellen pro Tool, Falsch-Positive getrennt.

## Offene Fragen
- keine
