---
name: deliver-task
description: Setzt einen freigegebenen Task-Plan (docs/tasks/DND-<n>-*.md, Typ = einer der Commit-Typen) um und lässt ihn reviewen – steuert die Subagents implementer und reviewer im Wechsel und legt die Review-Berichte im Plan ab. Verwenden bei /deliver-task DND-<n> oder wenn ein freigegebener Task umgesetzt werden soll.
---

# Task umsetzen und abnehmen

Diese Hauptsession steuert den Ablauf; Umsetzung und Review laufen in Subagents. Planung gehört nicht hierher
(dafür `/plan-task`).

## Ablauf

1. **Plan finden.** Key aus dem Aufruf (`DND-<n>`) → `docs/tasks/DND-<n>-*.md`. Status muss `Freigegeben`,
   `In Umsetzung` oder `Im Review` sein; sonst abbrechen und dem User sagen, warum. Typ (einer der Commit-Typen)
   aus dem Plan lesen.
2. **Umsetzung.** Vorher prüfen: Working Tree sauber bis auf Plan-Datei und `docs/tasks/README.md`; sonst
   anhalten und den User fragen. Dann Subagent `implementer` mit Pfad der Plan-Datei und Typ starten (bei Status
   `Im Review` direkt zu Schritt 3). Er legt genau einen Commit für die Runde an.
   - Meldet er offene Fragen oder einen Abbruch (z. B. Checks nach 3 Versuchen rot): **anhalten**, dem User die
     Rückmeldung vorlegen und auf Entscheidung warten. Nicht selbst weiterraten.
3. **Review.** Subagent `reviewer` mit Pfad der Plan-Datei und Typ starten.
4. **Bericht ablegen.** Den Bericht als neue Runde im Abschnitt `## Review` der Plan-Datei eintragen
   (Struktur siehe Template; ältere Runden bleiben stehen). **Nicht committen** – der Bericht geht im nächsten
   Runden-Commit des Implementers bzw. im Abschluss-Commit mit.
5. **Auswerten.**
   - **Blockierende Befunde:** Status auf `In Umsetzung` setzen (Plan + `docs/tasks/README.md`, uncommittet),
     zurück zu Schritt 2. Nach **3 Review-Runden** ohne Abnahme anhalten und den User entscheiden lassen.
   - **Abnahme empfohlen:** Dem User Bericht und Zusammenfassung vorlegen. Erst nach seiner ausdrücklichen
     Freigabe Status auf `Fertig` setzen (Plan + Übersicht) und zusammen mit dem letzten Review-Bericht
     committen: `docs(DND-<n>): mark task as done`.

## Regeln

- Der User sieht Subagent-Ergebnisse nicht direkt: Rückmeldungen von implementer und reviewer immer
  zusammengefasst weitergeben.
- Status `Fertig` nur nach Freigabe durch den User.
- Branch `development`; nicht pushen ohne Rückfrage; Commits nach Konvention ohne KI-Signatur.
