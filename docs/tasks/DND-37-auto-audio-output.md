# DND-37: Admin wird beim ersten Klick automatisch Audioausgabe

**Typ:** feat
**Status:** Fertig

## Kontext & Ziel

Seit DND-36 spielt ein Admin-Fenster Musik und Sounds, aber erst nach einem Klick auf „Hier abspielen“ im Panel
„Musik“ – auch nach jedem Reload. Der Klick ist nötig, weil Browser Ton erst nach einer Nutzerinteraktion im Fenster
abspielen; ein eigener Button dafür ist aber überflüssig, denn der Spielleiter klickt im Admin ohnehin. Künftig wird
ein Admin-Fenster beim ersten beliebigen Klick oder Tastendruck Audioausgabe, wenn gerade keines Ausgabe ist. Am
Spieltisch muss der Spielleiter an die Audioausgabe nicht mehr denken.

## Scope / Non-Goals

**Im Scope**
- Automatisch Ausgabe werden bei der ersten Nutzerinteraktion im Admin, solange kein Admin Ausgabe ist.
- Button „Hier abspielen“ entfernen.

**Nicht im Scope**
- Serverlogik der Audioausgabe (`audio_ready`, `audio_output`, Übernahme durch die zuletzt gemeldete Verbindung)
  bleibt unverändert.
- Autoplay ohne Interaktion (Browser-Einstellung) und Wahl des Lautsprechers in der App.
- Bewusstes Übernehmen der Ausgabe durch ein zweites Admin-Fenster (dafür gibt es keinen Bedienweg mehr).

## Entscheidungen

### E1: Erste Interaktion macht zur Ausgabe
- **Entscheidung:** Der Admin hört auf Ereignisse, die im Browser die Wiedergabe freigeben (Zeigerdruck bzw. Klick und
  Tastendruck, im ganzen Fenster, in der Capture-Phase, damit kein Element sie abfängt). Ist laut Server keine
  Ausgabe bereit (`AudioState.output_ready === false`) und dieses Fenster nicht Ausgabe, meldet es sich per
  `audio_ready` (bestehendes `requestAudioOutput`). Das gilt bei jeder Interaktion erneut, solange keine Ausgabe da
  ist; ist bereits ein Admin Ausgabe, passiert nichts. Vor dem ersten `audio`-Stand des Servers wird nichts gesendet.
  Der Klick, der die Ausgabe auslöst, wirkt zusätzlich wie gewohnt (z. B. Play startet die Musik).
- **Verworfene Alternativen:** Button „Hier abspielen“ behalten; Autoplay per Browser-Einstellung.
- **Begründung:** Wunsch des Spielleiters; keine zusätzliche Bedienung.

### E2: Mehrere Admin-Fenster
- **Entscheidung:** Es bleibt das Fenster Ausgabe, in dem zuerst interagiert wurde; ein anderes übernimmt nicht durch
  Klicks. Wird die Ausgabe geschlossen oder getrennt, wird das nächste Admin-Fenster mit einer Interaktion Ausgabe.
  Nach einem Verbindungsabbruch meldet sich die bisherige Ausgabe wie bisher ohne Klick wieder.
- **Begründung:** Kein doppelter Ton; kein Hin- und Herspringen zwischen Fenstern.

### E3: Anzeige im Panel „Musik“
- **Entscheidung:** Der Button „Hier abspielen“ entfällt. Der Hinweis „Keine Audioausgabe bereit“ bleibt, bis ein
  Admin Ausgabe ist.
- **Begründung:** Der Hinweis erklärt weiter, warum (noch) nichts zu hören ist.

## Subtasks

### Frontend
- [x] Interaktions-Listener im Admin nach E1/E2 (z. B. Hook im `GameTableProvider` bzw. `AdminScreen`, nur für
      `screen=admin`), Aufräumen beim Unmount.
- [x] `MusicControl`: Button „Hier abspielen“ und zugehörige Props entfernen (E3); ungenutzte Teile im Context
      (z. B. `isAudioOutput`, falls nur dafür) entfernen.
- [x] Unit: Entscheidungslogik „melden oder nicht“ als reine Funktion (keine Ausgabe → melden; Ausgabe vorhanden,
      dieses Fenster Ausgabe, kein Stand → nicht melden).
- [x] E2E: Musik-Szenarien ohne „Hier abspielen“ – erster Klick (z. B. Play) macht den Admin zur Ausgabe.

### Doku
- [x] `CLAUDE.md` (Setup am Spieltisch), `docs/screens.md` (Admin Ist: Musik), `docs/architecture.md` (Audio),
      `docs/domain.md` (Audioausgabe), `frontend/docs/design/components.md` falls der Button dort beschrieben ist.

## Akzeptanzkriterien

### AK1: Erster Klick
- **Given** ein Admin-Fenster ist frisch geladen, kein Admin ist Ausgabe, das Panel „Musik“ zeigt „Keine
  Audioausgabe bereit“
- **When** der Spielleiter irgendwo im Admin klickt oder eine Taste drückt
- **Then** ist dieses Fenster Ausgabe, der Hinweis verschwindet
- **When** der erste Klick auf Play ist
- **Then** spielt die Musik sofort in diesem Fenster

### AK2: Kein Button
- **Given** der Admin ist geöffnet
- **Then** gibt es im Panel „Musik“ keinen Button „Hier abspielen“

### AK3: Zwei Admin-Fenster
- **Given** zwei Admin-Fenster, das erste ist Ausgabe
- **When** im zweiten geklickt wird
- **Then** bleibt das erste Ausgabe
- **When** das erste geschlossen wird und danach im zweiten geklickt wird
- **Then** ist das zweite Ausgabe und spielt

### AK4: Reload
- **Given** das Admin-Fenster war Ausgabe
- **When** es neu geladen wird
- **Then** zeigt es „Keine Audioausgabe bereit“, bis dort geklickt wird

## Teststrategie / Verifikation

**Automatisch**
- Frontend Unit und BDD wie in den Subtasks; Lint, Typecheck, Build, Qualitäts-Checks grün. Backend unverändert.

**Manuell**
1. Admin laden, Hinweis prüfen, auf Notizen klicken, dann Play: Musik spielt (AK1, AK2).
2. Zweites Admin-Fenster, klicken; erstes schließen, im zweiten klicken (AK3).
3. Reload (AK4).

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-25
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `frontend/src/audio/useAutoAudioOutput.ts:7-25` setzt Listener für `pointerdown`/`keydown` am `window` in der Capture-Phase, solange `shouldRequestAudioOutput` (`frontend/src/audio/audioOutput.ts:5-7`) stimmt; eingebunden nur im Admin (`frontend/src/screens/AdminScreen.tsx:130`). E2E: Klick auf Notizen → Hinweis weg; Play → Hinweis weg, Musik läuft (`frontend/__tests__/bdd/steps/adminDashboard.ts:393-430`). Hörbarer Ton nur per manuellem Test 1. |
| AK2 | erfüllt | Button, `OutputButton`, Props `isAudioOutput`/`onRequestAudioOutput` und Grid-Zeile `output` aus `frontend/src/components/MusicControl.tsx` entfernt; keine Treffer für „Hier abspielen“/`music-output` in `src/`. E2E prüft beide Fenster (`adminDashboard.ts:382-391`). |
| AK3 | erfüllt | Bei `output_ready === true` kein Listener (Unit-Test `frontend/__tests__/unit/audioOutput.spec.ts:15-17`). E2E: Taste im zweiten Fenster übernimmt nicht; nach Schließen des ersten zeigt das zweite den Hinweis, Play macht es zur Ausgabe (`adminDashboard.ts:398-425`). |
| AK4 | erfüllt | `wantsAudioOutput` ist nach Reload `false`, `audio_ready` erst bei der nächsten Interaktion. E2E (`adminDashboard.ts:427-438`). |

**Blockierende Befunde**
- keine

**Hinweise**
- Doku über die Plan-Liste hinaus (`docs/known-issues.md`, `frontend/CLAUDE.md`, `frontend/DESIGN.md`, `frontend/docs/design/contrast.md`) entfernt nur Verweise auf den gestrichenen Button – im Sinn des Doku-Subtasks.
- E2E gegen den laufenden Docker-Stack scheitert im Given, solange ein Admin-Fenster Ausgabe ist (`output_ready: true`); Umgebungsfrage, die Prüfung gab es schon seit DND-36. E2E vom Reviewer nicht ausgeführt (hätte den offenen Spieltisch verändert); grüner Lauf gegen frischen Server nur laut Implementer.
- Vermutung: Da jetzt jeder erste Klick ein Admin zur Ausgabe macht, hängt ein Given mit `output_ready === false` davon ab, dass der Server das `quit()` des vorigen `afterEach` schon verarbeitet hat – mögliche seltene Flakiness, nicht beobachtet.
- Vermutung, Randfall: Interaktion in zwei Fenstern innerhalb weniger Millisekunden → beide senden `audio_ready`, das zuletzt gemeldete gewinnt; praktisch unerheblich.
- Kein eigener Commit `docs(DND-37): approve plan`; Plan und README kamen im Umsetzungs-Commit mit (wie bei DND-36).

**Checks:** Lint, Typecheck, Unit-Tests (23 Dateien, 199 Tests), Build, `check:deadcode`, `check:dupes` grün; E2E nicht ausgeführt (s. o.). Commit `c0f3e5f` nach Konvention, ohne KI-Signatur.
