# DND-<n>: <Titel>

**Typ:** feat | fix | chore | docs | refactor | test | style | setup
**Status:** Entwurf | Freigegeben | In Umsetzung | Im Review | Fertig

<!--
Typ = Commit-Typ (siehe CONTRIBUTING.md). Abschnitte mit Zusatz in Klammern, z. B. "(nur fix)" oder
"(refactor, style, chore)", entfernen, wenn sie nicht zum Typ passen. Beim Behalten den Zusatz entfernen.
-->

## Kontext & Ziel
<!--
feat: Welches Problem wird gelöst? Für wen (Spielleiter / Spieler)? Welche Screens (Admin, Player, Wall, Ground)?
      Woran merkt man am Spieltisch, dass es funktioniert?
fix: Welcher Fehler, wen betrifft er, wie schwer wiegt er?
refactor / style / chore: Motivation – warum, was wird dadurch besser (Lesbarkeit, Wartbarkeit, Aktualität …)?
test: Welche Lücke in der Testabdeckung wird geschlossen?
docs: Welche Doku fehlt oder ist falsch/veraltet?
setup: Welche Konfiguration (Build, CI, Tooling, Projekt) wird geändert und warum?
2–4 Sätze.
-->

## Fehlerbild (nur fix)

**Reproduktion**
1. …

**Ist:** …
**Soll:** …

## Ursache (nur fix)
<!-- Bekannte Ursache mit Beleg (Datei:Zeile) – oder "unbekannt, wird in Subtask 1 ermittelt". -->

## Invarianten (refactor, style, chore, setup)
<!-- Was sich nicht ändern darf, z. B. sichtbares Verhalten, API-Endpoints und Response-Form, Routen. -->
- Sichtbares Verhalten bleibt unverändert.
- …

## Scope / Non-Goals
<!-- Non-Goals verhindern, dass mehr gebaut wird als geplant. -->

**Im Scope**
- …

**Nicht im Scope**
- …

## Entscheidungen
<!--
Nur Entscheidungen, die im Dialog getroffen wurden – keine Selbstverständlichkeiten.
Eine geklärte offene Frage wird hier (oder als Akzeptanzkriterium) festgehalten.
-->

### E1: <Kurztitel>
- **Entscheidung:** …
- **Verworfene Alternativen:** …
- **Begründung:** …

## Subtasks
<!--
Gruppen in Umsetzungsreihenfolge. Nicht betroffene Gruppen weglassen.
Subtasks bekommen keine eigenen Keys und keine eigenen Commits – ein Commit je Umsetzungsrunde auf DND-<n>.
Große Tasks: in vertikale Schritte schneiden ("### Schritt 1: …"), jeder Schritt durchgehend
lauffähig (Backend bis UI); darin dieselben Gruppen als "####".
fix: erster Subtask ist die Ursachenermittlung (falls unbekannt), danach der Regressionstest.
-->

### Vertrag (nur wenn API/Datenmodell betroffen)
- [ ] Endpoint / Response-Form festlegen

### Backend
- [ ] …

### Frontend
- [ ] `frontend/src/models/models.ts` an geänderte Response anpassen (falls Vertrag geändert)
- [ ] …

### Doku
- [ ] `docs/screens.md` (Ist-Stand), `docs/known-issues.md` und ggf. weitere `docs/` aktualisieren

## Akzeptanzkriterien (nur feat)
<!--
Szenarien im Given/When/Then-Format (Gherkin), einzeln prüfbar, aus Sicht der Nutzer formuliert.
Können als Vorlage für frontend/__tests__/bdd/features/*.feature dienen.
-->

### AK1: <Kurztitel>
- **Given** …
- **When** …
- **Then** …

## Akzeptanzkriterien (nur fix)

### AK1: Korrigiertes Verhalten
- **Given** … (Ausgangslage der Reproduktion)
- **When** …
- **Then** … (Soll-Verhalten)

### AK2: Regressionstest
- Ein automatischer Test bildet die Reproduktion ab, schlägt vor dem Fix fehl und danach nicht.
  (Falls kein automatischer Test möglich: Begründung und manuelle Prüfschritte.)

## Akzeptanzkriterien (refactor, style, chore)
- [ ] AK1: <Ziel, z. B. "Ordner src/sceens heißt src/screens, alle Importe angepasst" oder
      "Abhängigkeit X auf Version Y aktualisiert">
- [ ] AK2: Alle Invarianten eingehalten – keine Verhaltensänderung.
- [ ] AK3: Lint, Tests und Build sind so grün wie vorher (bekannte Altfehler ausgenommen).
- [ ] AK4: Bestehende Tests inhaltlich unverändert (nur Pfad-/Import-Anpassungen).

## Akzeptanzkriterien (nur test)
- [ ] AK1: <welches Verhalten jetzt durch Tests abgedeckt ist>
- [ ] AK2: Neue Tests sind grün und schlagen fehl, wenn das geprüfte Verhalten kaputt ist (nicht trivial grün).
- [ ] AK3: Produktivcode unverändert.

## Akzeptanzkriterien (nur docs)
- [ ] AK1: <welche Doku neu/korrigiert ist>
- [ ] AK2: Inhalt stimmt mit dem aktuellen Code überein (Belege: Datei:Zeile).
- [ ] AK3: Links und Pfade gültig; kein Code geändert.

## Akzeptanzkriterien (nur setup)
- [ ] AK1: <Ziel, z. B. "CI baut das Frontend auch mit tsc">
- [ ] AK2: Wirksamkeit nachgewiesen (z. B. CI-Lauf grün, Hook greift, Build läuft lokal).
- [ ] AK3: Alle Invarianten eingehalten – App-Verhalten unverändert.

## Teststrategie / Verifikation
<!-- Automatisch: welche Tests neu/angepasst. Manuell: konkrete Schritte am laufenden System. -->

**Automatisch**
- Backend: …
- Frontend (Unit / BDD): …

**Manuell**
1. …

## Offene Fragen
<!-- Muss vor der Freigabe leer sein. -->
- …

## Review
<!--
Wird von der Hauptsession im Skill /deliver-task gepflegt – nicht beim Planen ausfüllen.
Pro Review-Runde ein Eintrag; ältere Runden bleiben stehen.
-->

### Runde 1 – <JJJJ-MM-TT>
**Empfehlung:** Abnahme | Nacharbeiten

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt / nicht erfüllt / nicht prüfbar | Datei:Zeile, Testausgabe |

**Blockierende Befunde**
- [ ] …

**Hinweise**
- …

**Checks:** Lint …, Tests …, Build …
