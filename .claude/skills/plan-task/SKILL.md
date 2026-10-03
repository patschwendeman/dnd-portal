---
name: plan-task
description: Plant einen Task (Feature, Fix oder Refactor) im Dialog mit dem User und legt den Plan versioniert unter docs/tasks/ an. Verwenden, wenn der User ein Feature, einen Fehler, einen Umbau oder eine größere Änderung planen will oder /plan-task aufruft.
---

# Task planen

Ziel: aus einer Idee, einem Fehler oder einem Umbauwunsch einen freigegebenen, umsetzbaren Plan machen. Der Plan
ist die einzige Quelle der Wahrheit für die Umsetzung (Subagent `implementer`) und das Review (Subagent `reviewer`).

## Ablauf

1. **Anliegen aufnehmen.** Zusammenfassen, was verstanden wurde.
2. **Kurzweg prüfen.** Erfüllt die Änderung alle Kriterien des Kurzwegs (siehe CONTRIBUTING.md, „Tasks & Planung“),
   keinen Plan anlegen, sondern den User darauf hinweisen. Im Zweifel: Plan.
3. **Typ klären.** Einer der Commit-Typen aus CONTRIBUTING.md: `feat`, `fix`, `chore`, `docs`, `refactor`,
   `test`, `style`, `setup`. Typ vorschlagen und vom User bestätigen lassen.
4. **Im Dialog planen.** Rückfragen stellen, bis alles für den Typ Nötige klar ist – nichts auf Spekulation
   aufbauen:
   - `feat`: Ziel, Nutzergruppe, betroffene Screens, Scope, Akzeptanzkriterien (Given/When/Then).
   - `fix`: Reproduktion, Ist- und Soll-Verhalten, Ursache (bekannt oder zu ermitteln).
   - `refactor`, `style`, `chore`: Motivation, Ziel, Invarianten (was sich nicht ändern darf).
   - `test`: welches Verhalten abgedeckt werden soll.
   - `docs`: welche Doku fehlt oder falsch ist.
   - `setup`: welche Konfiguration sich ändert, wie die Wirksamkeit nachgewiesen wird, Invarianten.

   Bei Bedarf den Code untersuchen (z. B. per Explore-Subagent) und `docs/` lesen – insbesondere
   `docs/screens.md` (Soll/Ist) und `docs/known-issues.md`.
5. **Plan anlegen.**
   - Nächste freie Nummer aus `docs/tasks/README.md` ermitteln (`DND-<n>`, fortlaufend ab 1, gemeinsam für alle Typen).
   - Datei `docs/tasks/DND-<n>-<slug>.md` aus [template.md](template.md) erstellen (`<slug>` kurz, kebab-case,
     englisch). Nicht zutreffende typspezifische Abschnitte entfernen.
   - Eintrag in `docs/tasks/README.md` ergänzen (Datei anlegen, falls nicht vorhanden: Tabelle mit
     Key, Typ, Titel, Status, Datei).
   - Status: `Entwurf`.
6. **Freigabe.** Plan dem User zur Durchsicht geben. Erst nach ausdrücklicher Freigabe Status auf `Freigegeben`
   setzen (im Plan und in der Übersicht).
7. **Übergabe.** Hinweis, dass Umsetzung und Review mit `/deliver-task DND-<n>` gestartet werden.

## Regeln

- In diesem Skill wird **kein Produktivcode** geändert – nur `docs/tasks/`.
- Plan-Dateien committen mit `docs(DND-<n>): …`, ohne KI-Signatur.
- Offene Fragen gehören in den Abschnitt „Offene Fragen“ des Plans; ein Plan mit offenen Fragen wird nicht freigegeben.
