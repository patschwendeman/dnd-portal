---
name: quick-task
description: Setzt eine kleine, eindeutige Änderung per Kurzweg direkt auf development um – ohne Plan, ohne Review-Subagent, aber mit Kriterien-Prüfung, Checks und Commit nach Konvention. Nur auf ausdrücklichen Aufruf /quick-task <Beschreibung>.
argument-hint: <Beschreibung der Änderung>
disable-model-invocation: true
---

# Quick-Task (Kurzweg)

Auftrag: $ARGUMENTS

Kleine Änderungen ohne Plan, wie in `CONTRIBUTING.md`, Abschnitt „Tasks & Planung“ → „Kurzweg (ohne Plan)“
beschrieben. Größere oder unklare Änderungen gehören in `/plan-task`. Weil auf dem Kurzweg kein Reviewer prüft,
sind die Checks in Schritt 4 Pflicht.

## Ablauf

1. **Verstehen.** Die Änderung in einem Satz zusammenfassen, betroffenen Teil (`frontend/`, `backend/`, Root,
   Doku) und Commit-Typ (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `setup`) nennen. Ist der
   Auftrag mehrdeutig: nachfragen, nicht raten.
2. **Kriterien prüfen** (aus CONTRIBUTING.md, alle müssen zutreffen):
   - kleiner, lokal begrenzter Eingriff (ein Bereich, wenige Zeilen)
   - keine Änderung an API, Datenmodell oder sichtbarem Verhalten – außer der Korrektur eines offensichtlichen,
     eindeutigen Fehlers
   - keine Entscheidung nötig

   Trifft ein Kriterium nicht zu: **anhalten**, das verletzte Kriterium konkret benennen und den User fragen:
   `/plan-task` oder trotzdem Kurzweg? Die Entscheidung trifft der User. Zeigt sich erst während der Umsetzung,
   dass die Änderung größer ist, ebenfalls anhalten und fragen.
3. **Umsetzen.** Direkt in dieser Session, auf Branch `development` (vorher prüfen). Konventionen aus Root-,
   `frontend/`- bzw. `backend/CLAUDE.md` beachten. Nur das Beauftragte ändern – Gefundenes nebenbei nur melden.
4. **Checks des betroffenen Teils** ausführen und Ergebnis festhalten:
   - Frontend (in `frontend/`): `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`
   - Backend (in `backend/`): `pylint src/`, `python -m unittest discover -s __tests__ -p "*.py"`
     (lokal per Docker, da lokal kein Python 3.11: im Root `docker compose run --rm --no-deps --build app <befehl>`)
   - Compose-Dateien geändert: `docker compose config -q` im Root und im betroffenen Teilordner
   - Workflows geändert: Syntax prüfen; Wirksamkeit zeigt erst ein CI-Lauf nach dem Push – im Bericht erwähnen
   - Bei Bedarf Gegenprobe (z. B. Fehler absichtlich einbauen, Check muss rot werden; danach verwerfen)

   Rote Checks durch die eigene Änderung beheben; nach 3 erfolglosen Versuchen anhalten und melden.
   Bereits vorher bestehende Fehler nicht nebenbei reparieren, nur melden.
5. **Doku nachziehen**, falls betroffen (Root-/Teil-`CLAUDE.md`, `CONTRIBUTING.md`, `docs/`). Aufzeichnungen
   in `docs/tasks/` (Review-Berichte, Nachträge) nicht umschreiben – bei Bedarf Nachtrag ergänzen.
6. **Committen.** Ein Commit, Nachricht nach Schema, **ohne Ticket-Scope**, eine Zeile, ohne KI-Signatur –
   z. B. `fix: remove unused variable in TopBar`. Nur die eigenen Dateien stagen (fremde, unversionierte Dateien
   nicht mitnehmen). **Nicht pushen.**
7. **Bericht.** Kurz: was geändert wurde (Dateien), Ergebnis der Checks, Commit-Hash und -Nachricht, ggf.
   Hinweise (bestehende Fehler, „nach Push zu prüfen“). Abschließend fragen, ob gepusht werden soll.
