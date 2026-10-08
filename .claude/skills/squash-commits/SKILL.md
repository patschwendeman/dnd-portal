---
name: squash-commits
description: Fasst einen Commit-Bereich auf development zu einem Commit zusammen und schlägt eine Nachricht mit Stichpunkten vor. Nur auf ausdrücklichen Aufruf /squash-commits <von> <bis> [Nachricht].
argument-hint: <von-Commit> <bis-Commit> [Commit-Nachricht]
disable-model-invocation: true
---

# Commits squashen

Auftrag: $ARGUMENTS

- **Erstes und zweites Argument:** Grenzen des Bereichs (Hash, Reihenfolge egal; beide Commits gehören dazu).
- **Rest (optional):** Die Commit-Nachricht. Entweder nur die Kopfzeile oder komplett mit Stichpunkten.
  Fehlt sie, wird sie aus den Commits im Bereich vorgeschlagen.

## Nachrichtenformat

```
<typ>(DND-<n>): <prägnante Zusammenfassung, englisch>

* <Stichpunkt 1>
* <Stichpunkt 2>
* ...
```

- **`<typ>` und `DND-<n>`:** Fehlen sie in der mitgegebenen Nachricht, kommen sie aus den Commits des Bereichs:
  der Task-Key, der dort vorkommt, und der Typ, der überwiegt (bzw. der Typ aus `docs/tasks/DND-<n>-*.md`).
  Bei mehreren Keys oder unklarem Typ nachfragen.
- **Kopfzeile:** Sie muss zum Schema aus [CONTRIBUTING.md](../../../CONTRIBUTING.md#commit-nachrichten) passen.
- **Stichpunkte:** In der Regel einer je zusammengefasstem Commit, in dessen Reihenfolge, knapp und englisch.
- **Keine KI-Signatur:** Weder eine `Co-Authored-By`-Zeile noch „Generated with Claude Code“.

## Ablauf

1. **Prüfen.**
   - Arbeitsverzeichnis sauber, Branch `development`; sonst abbrechen.
   - Älteren Commit `A` und jüngeren Commit `B` bestimmen, `A` muss Vorfahr von `B` sein.
   - Bereich anzeigen: `git log --oneline A^..B`, außerdem alle Commits nach `B` bis `HEAD`.
   - Prüfen, ob der Bereich schon auf `origin/development` liegt (`git branch -r --contains A`). Wenn ja,
     den User darauf hinweisen: Die Änderung bleibt vorerst lokal und braucht später einen Force-Push.
2. **Nachricht festlegen.** Die mitgegebene Nachricht nehmen oder eine nach dem Format oben vorschlagen.
3. **Squashen.**
   ```bash
   git branch backup/pre-squash-<key> HEAD
   git reset --hard B && git reset --soft A^
   git commit -F <nachricht-datei>          # Datei im Scratchpad
   git cherry-pick <Commits nach B, in Reihenfolge>
   ```
   Bei Konflikten im Cherry-Pick: `git cherry-pick --abort`, `git reset --hard backup/pre-squash-<key>`
   und den User fragen.
4. **Verifizieren.** `git diff backup/pre-squash-<key> HEAD` muss leer sein (nur die Historie ändert sich, nicht
   die Dateien). Danach `git log --oneline` zeigen.
5. **Berichten.**
   - Neuer Hash und vollständige Nachricht. Die Nachricht lässt sich bei Bedarf per `git commit --amend`
     anpassen; liegen Commits danach, ist dafür erneut ein Rebase nötig.
   - Nennen, welche Commits danach neue Hashes haben.
   - Hinweis auf den Backup-Branch.
   - Nicht pushen. Liegt der Bereich schon auf dem Remote, fragen, ob per `git push --force-with-lease` veröffentlicht
     werden soll. Erst nach ausdrücklichem Ja ausführen.
     Niemals auf `main`.
