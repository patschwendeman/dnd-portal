# DND-8: Style Guide kürzen und Details auslagern

**Typ:** docs
**Status:** Fertig

## Kontext & Ziel

`frontend/DESIGN.md` ist mit 598 Zeilen schwer zu überblicken. Viele Regeln stehen mehrfach im Dokument (z. B. Icons,
Laufweite, Aktiv-Zustand, Radien, Innenabstände). Die Token- und Farbwerte stehen auch in `tokens.ts` und den
Theme-Dateien. Viel Text ist Historie (Entfallen-Listen, „Vor dem Umbau“, „seit DND-x“, „früher …“) und nennt Namen,
die es im Code nicht mehr gibt. Ziel: ein knapper Guide mit allen Regeln. Die Details stehen in eigenen Dateien unter
`frontend/design/`.

## Invarianten

- **Keine Regel geht verloren.** Jede verbindliche Regel aus dem heutigen `DESIGN.md` steht danach genau einmal in
  `DESIGN.md` oder in einer der neuen Dateien.
- **Die Abschnittsnummern bleiben gleich** (Architektur, 1.1–1.6, 2.1–2.6, 3). Darauf verweisen Code-Kommentare
  (`GlobalStyle.ts:5`, `PlayerScreen.tsx:11`, `ResourceBarPlayer.tsx:33`, `TextButton.tsx:7`, `Label.tsx:5`,
  `WallScreen.tsx:15`, `ScreenControlBar.tsx:11`), die Mappings und `mockups/v2/build.py:320`. Ausgelagerte
  Abschnitte behalten in `DESIGN.md` ihre Überschrift mit einer kurzen Zusammenfassung und einem Link.
- Abschnitt 4 „Offen“ darf wegfallen. Kein aktueller Verweis zeigt darauf, nur abgeschlossene Pläne.
- Die Bezeichner der Entscheidungen (K1–K4, O1–O6, P1–P7, DND-5 E2) bleiben gültig und auffindbar.
- Kein Produktivcode wird geändert, auch keine Kommentare.

## Scope / Non-Goals

**Im Scope**
- `frontend/DESIGN.md` kürzen und umbauen
- neue Dateien `frontend/design/components.md`, `contrast.md`, `decisions.md`, `screen-layouts.md`
- Verweise anpassen, wo ein Inhalt umzieht: `frontend/CLAUDE.md`, Root-`CLAUDE.md` (Doku-Liste), Mappings in
  `frontend/design/*-mapping.md`, aber nur wenn ein Verweis sonst ins Leere geht

**Nicht im Scope**
- Regeln inhaltlich ändern, neue Regeln einführen
- abgeschlossene Pläne `docs/tasks/DND-1` … `DND-7` (historisch, bleiben unverändert)
- `frontend/design/audit.md`, Mockups
- Code oder Code-Kommentare

## Entscheidungen

### E1: Zielordner `frontend/design/`
- **Entscheidung:** Die Detaildateien liegen unter `frontend/design/`, neben Mappings, Audit und Mockups.
- **Verworfene Alternativen:** neuer Ordner `docs/design/`
- **Begründung:** Die Design-Arbeitsdokumente liegen schon in `frontend/design/`.

### E2: Token-Werte nur in `tokens.ts`
- **Entscheidung:** 1.2 nennt Token-Namen und Zweck, aber keine Werte. `space.*`, `radius.*`, `borderWidth.*`,
  `fontWeight.*` und die `text.*`-Stufen werden je in einer Zeile mit Verweis auf `tokens.ts` genannt. Bei `size.*`
  und `layer.*` bleibt die Spalte „Wofür“. Gestrichen werden auch Wertangaben in Klammern im Fließtext, z. B. `(4)`
  oder `(20px)`. Die Regel „Body-Schrift Inter, lokal über `@fontsource/inter`“ bleibt.
- **Verworfene Alternativen:** Wertetabellen behalten
- **Begründung:** Die Werte stehen schon in `tokens.ts`. Zwei Quellen laufen auseinander.

### E3: Theme-Werte nach `contrast.md`
- **Entscheidung:** Die Hex-Tabelle aus 2.3 wandert nach `frontend/design/contrast.md`, als Grundlage der
  Kontrastmessung. 2.3 in `DESIGN.md` nennt nur die beiden Themes und ihre Dateien und hält fest:
  `resource.*` und `badge.*` sind in beiden Themes gleich, weil sie Bedeutung tragen, nicht Stimmung.
- **Verworfene Alternativen:** Tabelle in `DESIGN.md` behalten
- **Begründung:** Gebraucht werden die Werte nur zum Nachrechnen des Kontrasts.

### E4: Historie ersatzlos löschen
- **Entscheidung:** Diese Historie fällt ohne Ersatz weg:
  - die Entfallen-Listen in 1.2
  - die Spalte „Vor dem Umbau“ der `layer`-Tabelle
  - „seit DND-x“, „früher …“ und „(früher `lightTheme`)“
  - die Herkunft der Ressourcenfarben (`#077600` …)
  - die Umbenennungsnotiz `lightTheme`
  - die Kontrast-Spalten „Dark vor DND-4“, „Tavern vor DND-4“ und „Maßnahme“
  - der Stand-Absatz im Kopf
  - Abschnitt 4 „Offen“

  Damit fallen auch die veralteten Namen weg (`ConfirmButton`, `SpellResource`, `MapContainer` in `WallScreen`,
  `size.icon.sm/lg`, `size.control.sm`, `fontSize.*`, Breakpoints 649/650/739px).
- **Verworfene Alternativen:** Historie nach `decisions.md`
- **Begründung:** User-Entscheidung. Die Historie steht in Git und in den Plänen DND-4 bis DND-7.

### E5: Was wohin kommt
- **Entscheidung:**

| Abschnitt heute | Danach |
|---|---|
| Kopf, Quellen, Teil-Tabelle | Kopf mit Geltung und einer Linkliste (Mappings, Mockups, Themes, neue Dateien). Die Teil-Tabelle entfällt. |
| Architektur | 3–5 Anweisungen: Theme = `tokens` + `colors`, Zugriff `props.theme.*` / `textStyle()`, `styled.d.ts`, `GlobalStyle` je Screen, Namensraum `text` ≠ `colors.text`. Kein Code-Block. |
| 1.1 Grundsätze | bleibt (Ort der Regeln zu Grundregeln/`GlobalStyle` und Breakpoints) |
| 1.2 Tokens | nach E2. „Touch-Ziele“ fällt weg (steht bei `size.control.lg`). `layer.*` bekommt die Regel aus 1.4 „Ebenen“. |
| 1.3 Layout-Konstanten | Zusammenfassung und Regel (feste Maße nur als benannte Konstante in der Komponente) bleiben. Die Tabelle wandert nach `screen-layouts.md`. |
| 1.4 Regeln | bleibt. Doppelte Regeln zusammenführen: Laufweite (eine Regel), Gewichte (nur „andere gibt es nicht“), Ebenen → 1.2, Übergangsdauern (eine Zeile, ohne Wertliste), Radien-Rechenbeispiel K3 streichen. Die Tabellen „Radien“ und „Innenabstand“ bleiben **die** Quelle für diese Werte. |
| 1.5 Bausteine | Liste der Bausteine mit Link, Hinweis auf die gemeinsamen Komponenten `TextButton` und `Label`. Alle Tabellen kommen nach `components.md`, **ohne** Zeilen, die nur Radien, Innenabstände, Aktiv-Farben oder `tabular-nums` aus 1.4/2.4 wiederholen. Stattdessen ein Verweis. |
| 1.6 Screen-Layouts | Zusammenfassung mit Link. Die Tabelle wandert nach `screen-layouts.md`. |
| 2.1 Prinzip | bleibt. Der Absatz zum Theme-Wechsel wird ein Satz mit Verweis auf `docs/architecture.md`, dazu die Player-Ausnahme. |
| 2.2 Rollen | bleibt |
| 2.3 Themes | nach E3 |
| 2.4 Zustände | bleibt, einzige Quelle für Aktiv-/Inaktiv-Farben |
| 2.5 Farben außerhalb | ein Satz: einzige Ausnahme `gridColorMap` in `GroundScreen` (Funktionsfarbe) |
| 2.6 Kontrast | Regel (WCAG AA: Text 4,5:1, große Schrift und Grafik 3:1, Ausnahme `border` in Dark nach O6) mit Link. Tabelle und Anmerkungen (ohne Historie) wandern nach `contrast.md`. |
| 3 Entscheidungen | Satz mit Link. Die Tabellen O1–O6 und P1–P7 wandern unverändert (nur ohne Historie) nach `decisions.md`. Dort kommen K1–K4 und DND-5 E2 als Verweis dazu (wo sie definiert sind). |
| 4 Offen | entfällt |

- **Begründung:** Ergebnis der Analyse vom 2026-10-08 (Duplikate, Token-Werte, Erklärtext, Auslagerung).

## Subtasks

### Doku
- [x] Vorab eine Checkliste aller Regeln aus dem heutigen `DESIGN.md` anlegen (nur im Arbeitsverzeichnis, nicht
      committen). Am Ende jede Regel abhaken, mit ihrem neuen Ort.
- [x] `frontend/design/components.md` anlegen (aus 1.5, nach E5)
- [x] `frontend/design/contrast.md` anlegen (Theme-Werte aus 2.3, Tabelle und Anmerkungen aus 2.6, ohne Historie)
- [x] `frontend/design/decisions.md` anlegen (aus 3, ohne Historie)
- [x] `frontend/design/screen-layouts.md` anlegen (Tabellen aus 1.3 und 1.6)
- [x] `frontend/DESIGN.md` nach E2–E5 umbauen. Abschnittsnummern und Überschriften bleiben gleich.
- [x] Jede neue Datei beginnt mit einem Rücklink auf `DESIGN.md` und einem Satz zu ihrem Zweck (wie die Mappings)
- [x] Verweise prüfen und bei Bedarf anpassen:
  - `frontend/CLAUDE.md` (Zeilen 8 und 79)
  - Root-`CLAUDE.md` (Doku-Liste: neue Dateien erwähnen)
  - `frontend/design/*-mapping.md` (Verweise auf 1.2/1.5/2.3/2.5/2.6/O*/P* zeigen weiter auf gültige Abschnitte;
    nur anpassen, wenn ein Verweis ins Leere geht)

## Akzeptanzkriterien (nur docs)
- [x] AK1: `DESIGN.md` hat höchstens 280 Zeilen. Die vier neuen Dateien liegen unter `frontend/design/`.
- [x] AK2: Jede Regel aus dem alten `DESIGN.md` steht in der neuen Struktur genau einmal. Der Reviewer gleicht das
      mit `git show HEAD~:frontend/DESIGN.md` ab. Keine Regel ist inhaltlich verändert.
- [x] AK3: `DESIGN.md` nennt Tokens und Farbrollen nur beim Namen, ohne ihren Wert (erlaubt sind Werte, die selbst
      die Regel sind, z. B. 16:9 oder WCAG-Verhältnisse). Die Hex-Werte in `contrast.md` stimmen mit
      `darkTheme.ts`/`tavernTheme.ts` überein.
- [x] AK4: Keine Historie mehr in `DESIGN.md` und den neuen Dateien. Kein Name, den es im Code nicht gibt
      (Stichprobe per `grep` gegen `frontend/src`).
- [x] AK5: Die Abschnitte Architektur, 1.1–1.6, 2.1–2.6 und 3 gibt es in `DESIGN.md` weiter unter derselben
      Nummer. Alle Verweise in Code-Kommentaren, Mappings und `CLAUDE.md`-Dateien zeigen auf vorhandene Inhalte.
- [x] AK6: Alle relativen Links in `DESIGN.md` und den neuen Dateien sind gültig. Kein Code geändert
      (`git diff --stat` nur `*.md`).

## Teststrategie / Verifikation

**Automatisch**
- Linkcheck: alle relativen Markdown-Links in `frontend/DESIGN.md` und `frontend/design/*.md` per Skript auflösen
  (Datei existiert; Anker existiert, wo einer angegeben ist)
- `git diff --stat`: nur Markdown-Dateien geändert

**Manuell**
1. Die Regel-Checkliste (siehe Subtasks) gegen den alten Stand abgleichen.
2. Stichprobe `grep` auf entfernte Namen (`ConfirmButton`, `SpellResource`, `lightTheme`, `size.icon.sm`,
   `fontSize`, `#AD3131`) in `DESIGN.md` und den neuen Dateien: keine Treffer.

## Offene Fragen
- keine

## Review

### Runde 1 – 2026-10-08
**Empfehlung:** Nacharbeiten (alternativ Klärung von AK2 durch den User, siehe Befund)

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `DESIGN.md` hat 279 Zeilen (≤ 280). `components.md`, `contrast.md`, `decisions.md` und `screen-layouts.md` liegen unter `frontend/design/`. |
| AK2 | nicht erfüllt (Wortlaut „genau einmal“) | Alter Stand (`0361859`) Zeile für Zeile abgeglichen. Keine Regel verloren, keine inhaltlich verändert. Weggefallen ist nur, was E2/E4/E5 erlauben. Aber mehr als 15 Regeln stehen weiter zwei- oder dreimal (siehe Befund). |
| AK3 | erfüllt | In `DESIGN.md` keine Hex-, rgba- oder Token-Werte mehr, nur Werte, die selbst die Regel sind (4px-Raster, WCAG-Schwellen). Hex-Werte in `contrast.md` stimmen 1:1 mit `darkTheme.ts` und `tavernTheme.ts` überein. |
| AK4 | erfüllt | `grep`-Stichprobe auf entfallene Namen und Historie in `DESIGN.md` und den 4 neuen Dateien: 0 Treffer. Alle 18 genannten Konstanten und Komponenten gibt es in `frontend/src`. |
| AK5 | erfüllt | Architektur, 1.1–1.6, 2.1–2.6 und 3 unter derselben Nummer. Code-Kommentare und Mapping-Verweise zeigen auf vorhandene Inhalte. |
| AK6 | erfüllt | Linkcheck (Datei und Anker) über die geänderten und neuen Dateien: 0 defekte Links. `git diff --stat 0361859 HEAD -- . ':!*.md'` ist leer. |

**Blockierende Befunde**
- [x] AK2 / Invariante „genau einmal“: Doppelt stehen weiter Schriftangaben der Bausteine (`components.md`) und die Schrift-Hierarchie (1.1), Flächen- und Vordergrundfarben der Bausteine und 2.2 „Verwendung“, Abstände zwischen Elementen und die Tabelle „Abstände nach Beziehung“ (1.4), Größen (`size.control.md`, `size.button.minWidth`, `size.badge`, `size.bar.*`) in Bausteinen und 1.2, O5 „Tavern-Rot“ in `contrast.md` und `decisions.md`, O6 in `DESIGN.md`, `contrast.md` und `decisions.md`, P1/P5/P7 zusätzlich als Regel in 1.1 bzw. 1.4. Fast alles war schon vorher doppelt. E5 verlangt das Entfernen nur für Radien, Innenabstände, Aktiv-Farben und `tabular-nums` und die Entscheidungstabellen „unverändert“ – der Plan widerspricht sich. Lösung: (a) User legt fest, dass AK2 im Sinne von E5 gilt, oder (b) die Dopplungen durch Verweise ersetzen.

**Hinweise**
- „Gewichte“ lautet nur noch „nur die aus der Schrift-Hierarchie“; die alte Zuordnung „`medium` für Listen- und Anzeigetext“ ist weg (passte nicht zum Code). Das Gewicht der Listen in der Hierarchie ist weiter nicht eindeutig.
- Dialog: „`space.5` seitlich und unten“ geht nur noch aus 1.4 „Dialog (Textbereich)“ hervor.
- `screen-layouts.md` ergänzt die Konstantennamen (`LEFT_COLUMN_WIDTH` usw.); zusätzliche Information, alle Namen existieren.
- Vorbestehender defekter Anker `player-mapping.md:34` `#entscheidungen` (richtig: `#entscheidungen-2026-10-08`), außerhalb des Scopes.
- `player-mapping.md:28/302` und `mockups/v2/build.py:320` verweisen für die Ressourcen-Palette auf 2.5; dort steht nur noch ein Verweissatz auf 2.2 – gültig, aber dünn.
- `admin-mapping.md:38` „Vollständige Liste: DESIGN.md, 1.2“ ist missverständlich, aber nicht ins Leere.

**Checks:** Linkcheck grün (bis auf vorbestehenden Anker), nur `*.md` geändert, Theme-Werte geprüft, Commits nach Konvention ohne KI-Signatur. Lint/Tests entfallen (kein Code geändert).

**Entscheidung des Users (2026-10-08):** AK2 gilt dem Wortlaut nach („genau einmal“). Die verbleibenden Dopplungen
werden durch Verweise ersetzt; das hat Vorrang vor E5 („Entscheidungstabellen unverändert“).

### Runde 2 – 2026-10-08
**Empfehlung:** Nacharbeiten

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt (an der Grenze) | `DESIGN.md` hat 280 Zeilen (≤ 280). Die Nacharbeit darf keine Zeile hinzufügen. |
| AK2 | nicht erfüllt | Gestrichene Angaben in `components.md` (111bb2f) einzeln mit `0361859` abgeglichen: nichts verloren. Die Spalte „Regel steht in“ in `decisions.md` zeigt auf die richtigen Stellen; Begründungen von O2, O5, O6, P4 und Regel P6 stehen genau einmal. 4 Dopplungen bleiben (siehe Befunde). |
| AK3 | erfüllt | In `DESIGN.md` nur `4px-Raster` und die WCAG-Schwelle. Theme-Werte in `contrast.md` seit Runde 1 unverändert. |
| AK4 | erfüllt | `grep`-Stichprobe auf entfallene Namen und Historie: 0 Treffer. |
| AK5 | erfüllt | Abschnittsnummern unverändert, Code-Kommentare und `build.py:320` zeigen auf vorhandene Abschnitte. K1–K4, O1–O6, P1–P7, DND-5 E2 in `decisions.md` auffindbar. |
| AK6 | erfüllt | Linkcheck 0 defekte Links. Nur `*.md` geändert. |

**Blockierende Befunde**
- [x] AK2: K4 steht zweimal, in `DESIGN.md` Architektur (Z. 28–29) und 1.2 (Z. 63–64).
- [x] AK2: Regel zu Layout-Konstanten mehrfach: `screen-layouts.md` Z. 8 wiederholt `DESIGN.md` 1.3 Z. 101 wörtlich; 1.1 Z. 45–46 überschneidet sich mit 1.3.
- [x] AK2: 2.2 „Verwendung“ nennt bei `primary`, `onPrimary`, `secondary`, `background` die Aktiv-/Inaktiv-/Decline-Zuordnungen, die auch in 2.4 stehen (E5: 2.4 ist einzige Quelle). Ebenso wiederholt 2.4 „Fläche auf Fläche“ Karten/Leiste aus 2.2.
- [x] AK2: Icon-Größen stehen in 1.2 „Größen“ (Z. 77–79) und in 1.4 „Icons“ (Z. 165).

**Hinweise**
- `borderWidth.thick` „nur für Aktiv-Markierungen“ (1.4) widerspricht dem Ressourcen-Button mit `borderWidth.thick`. Vorbestehend, inhaltliche Regeländerung außerhalb des Scopes; Kandidat für `known-issues.md` oder eigenen Task.
- Ankerkorrektur in `player-mapping.md:34` in Ordnung.
- Grenzfälle: `screen-layouts.md` Admin-Zeile wiederholt `200px 1fr 400px`, `size.bar.*` und `gap` `space.5`; `components.md` Ressourcen-Button nennt „Zahl in `text.color`“ zweimal.
- Klarstellungen aus e952b96 (Listen `regular`, Dialog `space.5` seitlich und unten) stimmen mit dem Code überein.

**Checks:** Linkcheck 0 defekte Links, nur `*.md` geändert, `grep`-Stichprobe 0 Treffer, Commits nach Konvention ohne KI-Signatur. Lint/Tests entfallen.

### Runde 3 – 2026-10-08
**Empfehlung:** Abnahme

| AK | Ergebnis | Beleg |
|---|---|---|
| AK1 | erfüllt | `DESIGN.md` hat 277 Zeilen (≤ 280). Die vier Dateien liegen unter `frontend/design/`. |
| AK2 | erfüllt | K4 nur in 1.2, `text.reading` „nur Fließtext“ nur in 1.4, Layout-Konstanten-Regel nur in 1.3 (1.1, P1 und `screen-layouts.md` verweisen), Zustandsfarben nur in 2.4 (Spalte „Beispiele“; jede alte Zuordnung aus 2.2 wiederzufinden, gegen `AdminScreen.tsx:91`, `Dialogue.tsx:105–106`, `MapElement.tsx:25` geprüft), Icon-Button-Größen nur in 1.2, „Notizen“ → Navigation nur in 1.4, 16:9 nur in 1.4, Ressourcen-Zahl `text.color` einmal. Grenzfälle aus Runde 2 behoben. Nichts verloren oder inhaltlich verändert. |
| AK3 | erfüllt | In `DESIGN.md` nur „4px-Raster“ und die WCAG-Schwelle. Hex-Werte in `contrast.md` stimmen mit den Theme-Dateien überein. |
| AK4 | erfüllt | `grep`-Stichprobe auf entfallene Namen und Historie: 0 Treffer. |
| AK5 | erfüllt | Abschnittsnummern unverändert; Code-Kommentare treffen (u. a. `TextButton.tsx:7` → 2.4 mit default/active/cancel). Bezeichner K1–K4, O1–O6, P1–P7, DND-5 E2 in `decisions.md` auffindbar. |
| AK6 | erfüllt | Linkcheck 0 defekte Links. Seit `0361859` nur `*.md` geändert. |

**Blockierende Befunde**
- keine

**Hinweise**
- Spalte „Verwendung“ in `contrast.md` ist Messkontext, keine Regel; enthält zusätzlich „auch in der Steuerleiste von Wall und Ground“.
- `frontend/CLAUDE.md` Z. 78–80 ist eine vorbestehende Kurzfassung mit Verweis, außerhalb von AK2.
- Widerspruch `borderWidth.thick` „nur für Aktiv-Markierungen“ (1.4) vs. Ressourcen-Button: vorbestehend, außerhalb des Scopes; Kandidat für `known-issues.md` oder eigenen Task.
- `components.md` „Zentrierung des Icons“ beschreibt die Umsetzung von K1, keine zweite Regel.
- 1.4: `space.6`–`space.8` für den Bildschirmrand, im Player `space.4`/`space.5` – vorbestehend, als Player-Sonderfall gekennzeichnet.

**Checks:** Linkcheck 0 defekte Links, nur `*.md` geändert, `grep`-Stichprobe 0 Treffer, Theme-Werte geprüft, Commits nach Konvention ohne KI-Signatur. Lint/Tests entfallen.
