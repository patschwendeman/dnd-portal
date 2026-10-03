# Mitarbeit & Branch-Strategie

## Branches

| Branch | Zweck |
|---|---|
| `development` | Arbeits-Branch. Alle Änderungen – Features, Fixes, Doku, auch dringende Fixes – werden hier committet. |
| `main` | Release-Stand. Erhält Änderungen ausschließlich per Pull Request von `development`. |

- Es gibt **keine** separaten Feature- oder Hotfix-Branches.
- Auf `main` wird **nie direkt** committet oder gepusht.
- Releases werden **nicht** getaggt.

## Ablauf

1. Auf `development` arbeiten und committen.
2. `development` pushen – die CI läuft für den jeweils geänderten Teil (`backend/` bzw. `frontend/`).
3. Für ein Release einen Pull Request `development` → `main` auf GitHub öffnen und mergen, wenn die CI grün ist.

## Tasks & Planung

Größere Änderungen laufen als **Task** mit versioniertem Plan:

1. `/plan-task` – Task im Dialog planen; Plan unter `docs/tasks/DND-<n>-<slug>.md`, Übersicht in
   `docs/tasks/README.md`.
2. Plan freigeben.
3. `/deliver-task DND-<n>` – Umsetzung (Subagent `implementer`) und Review (Subagent `reviewer`) im Wechsel;
   Review-Berichte landen im Plan. Abschluss („Fertig“) nach Freigabe.

| Typ (= Commit-Typ) | Wann | Besonderheit im Plan |
|---|---|---|
| `feat` | neues Verhalten | Akzeptanzkriterien als Given/When/Then aus Nutzersicht |
| `fix` | falsches Verhalten korrigieren | Fehlerbild (Reproduktion, Ist, Soll), Ursache, Regressionstest (vor dem Fix rot, danach grün) |
| `refactor`, `style`, `chore` | Struktur, Formatierung oder Wartung – Verhalten bleibt gleich | Motivation, Invarianten, Nachweis „keine Verhaltensänderung“ |
| `test` | Tests ergänzen | abgedecktes Verhalten; Produktivcode unverändert; Tests nicht trivial grün |
| `docs` | Dokumentation | Inhalt stimmt mit Code überein; kein Code geändert |
| `setup` | Build-, CI-, Tooling- oder Projektkonfiguration | Invarianten, Nachweis der Wirksamkeit (z. B. CI-Lauf) |

Keys `DND-<n>` werden fortlaufend vergeben, gemeinsam für alle Typen.

### Kurzweg (ohne Plan)

Kleine Änderungen gehen direkt auf `development` – Commit mit passendem Typ, **ohne** Ticket-Scope
(z. B. `fix: remove unused variable in TopBar`). Nur wenn **alle** Punkte zutreffen:

- kleiner, lokal begrenzter Eingriff (ein Bereich, wenige Zeilen)
- keine Änderung an API, Datenmodell oder sichtbarem Verhalten – außer der Korrektur eines offensichtlichen,
  eindeutigen Fehlers
- keine Entscheidung nötig

Beispiele: Tippfehler, ungenutzte Variable, Doku-Korrektur. **Im Zweifel: Plan.**

## Commit-Nachrichten

Jede Commit-Nachricht muss diesem Schema entsprechen:

```
^(feat|fix|chore|docs|refactor|test|style|setup)(\([A-Z]+-[0-9]+\))?: .+
```

| Typ | Verwendung |
|---|---|
| `feat` | neues Feature |
| `fix` | Fehlerbehebung |
| `chore` | Wartung, Abhängigkeiten, Aufräumen |
| `docs` | Dokumentation |
| `refactor` | Umbau ohne Verhaltensänderung |
| `test` | Tests |
| `style` | Formatierung, Code-Stil |
| `setup` | Projekt-, Build-, CI- oder Tooling-Konfiguration |

- Der Scope in Klammern ist optional und enthält einen Ticket-Key, z. B. `(DND-12)`.
- Eine prägnante Zeile; Fließtext im Body vermeiden.
- Keine Signaturen von KI-Tools: keine `Co-Authored-By`-Zeile für Claude/Anthropic, kein „Generated with Claude Code“.

Beispiele:

```
feat: add grid toggle to ground screen
fix(DND-12): return 404 for unknown scene
docs: document branch strategy
```

Durchgesetzt wird das Schema durch den Hook `.githooks/commit-msg`. Nach dem Klonen einmalig aktivieren:

```bash
git config core.hooksPath .githooks
```

Merge-, Revert- und `fixup!`/`squash!`-Nachrichten lässt der Hook durch. Die Attribution von Claude Code ist in
`.claude/settings.json` abgeschaltet.

## CI

`.github/workflows/backend.yml` und `.github/workflows/frontend.yml` laufen bei Pushes auf `main` und `development`,
jeweils nur bei Änderungen im zugehörigen Ordner (bzw. an der Workflow-Datei selbst). Die Jobs laufen direkt
auf dem Runner (`ubuntu-latest`):

- **Frontend** (in `frontend/`): vier Jobs – Node 18 über `actions/setup-node` mit npm-Cache, `npm ci`. Zuerst läuft
  `build` (`npx vite build`), danach parallel `typecheck` (`npm run typecheck`, also `tsc -b`), `lint`
  (`npm run lint`) und `test` (`npm run test:unit`), alle mit `needs: build`; bricht der Build, laufen sie nicht.
- **Backend** (in `backend/`): zwei parallele Jobs `lint` und `test` – Python 3.11 über `actions/setup-python` mit pip-Cache,
  `pip install -r requirements.txt`, dann `pylint src/` bzw. `python -m unittest discover -s __tests__ -p "*.py"`.

Schlägt ein Job fehl (Build, Typecheck, Lint oder Test), ist der Workflow rot. E2E-Tests laufen
nicht in CI.

## Archiv

Die Branches `test` und `v1-roguelike` der früheren Einzel-Repos liegen als Tags
`archive/{backend,frontend}-{test,v1-roguelike}` vor. Sie werden nicht weiterentwickelt.
