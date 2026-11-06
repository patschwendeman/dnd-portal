# Kontrast und Theme-Werte

Teil des [Style Guide](../../DESIGN.md), Abschnitte [2.3](../../DESIGN.md#23-themes) und
[2.6](../../DESIGN.md#26-kontrast). Hier stehen die Farbwerte beider Themes und die Kontrastmessung, die auf ihnen
beruht. Die Regel (Ziel WCAG AA) steht im Style Guide.

## Theme-Werte

Werte aus [darkTheme.ts](../../src/style/darkTheme.ts) und [tavernTheme.ts](../../src/style/tavernTheme.ts). Bei Abweichungen
gilt der Code.

| Rolle | Dark (`darkTheme`) | Tavern (`tavernTheme`) |
|---|---|---|
| `primary` | `#4493F8` | `#C05E5E` |
| `secondary` | `#161b23` | `#3D271C` |
| `secondaryTranslucent` | `#161b23bf` (= `secondary`, 75 % deckend) | `#3D271Ceb` (= `secondary`, 92 % deckend) |
| `border` | `#3d444db3` | `#956F01` |
| `background` | `#0e1117` | `#140701` |
| `overlay` | `rgba(0, 0, 0, 0.850)` | `rgba(0, 0, 0, 0.850)` |
| `backdrop` | `rgba(0, 0, 0, 0.5)` | gleich |
| `scrim` | `rgba(0, 0, 0, 0.750)` | gleich |
| `onScrim` | `#ffffff` | gleich |
| `text.color` | `#f0f6fc` | `#CBAB96` |
| `text.muted` | `#f0f6fcb0` (= `text.color`, 69 % deckend) | `#CBAB96b0` (= `text.color`, 69 % deckend) |
| `initials` | `#4493F8` (= `primary`) | `#CBAB96` (= `text.color`) |
| `onPrimary` | `#0e1117` (= `background`) | `#140701` (= `background`) |
| `error` | `#8e1b1b` | `#8e1b1b` |
| `onError` | `#ffffff` | `#ffffff` |
| `qr.foreground` · `qr.background` | `#000000` · `#ffffff` | gleich |
| `resource.action.strong` · `.muted` | `#099000` · `#072900` | gleich |
| `resource.bonus.strong` · `.muted` | `#db4400` · `#290e00` | gleich |
| `resource.movement.strong` · `.muted` | `#fae100` · `#292500` | gleich |
| `resource.spell.strong` · `.muted` | `#2487ff` · `#001229` | gleich |
| `resource.special.strong` · `.muted` | `#ff2424` · `#290000` | gleich |
| `resource.empty` | `#707070` | gleich |
| `negative.text` · `.surface` · `.border` | `#ff6b6b` · `#290000` (= `resource.special.muted`) · `#ff2424` (= `resource.special.strong`) | gleich |
| `positive.text` · `.surface` · `.border` | `#3fd033` · `#072900` (= `resource.action.muted`) · `#099000` (= `resource.action.strong`) | gleich |

## Kontrastmessung

Gemessen mit den Werten oben, Regel und Ziel in [2.6](../../DESIGN.md#26-kontrast). `border` ist halbtransparent bzw.
auf der jeweiligen Fläche gemessen. Fett = verfehlt das Ziel.

| Paar | Verwendung | Ziel | Dark | Tavern | Ergebnis |
|---|---|---|---|---|---|
| `text.color` auf `background` | Wall-Panel, Panel-Einträge bei Hover (Admin) | 4,5 | 17,4 | 9,2 | ✓ beide |
| `text.color` auf `secondary` | Karten, Kacheln im Admin (Notizseiten, Dashboard-Panels, Abenteuername in der Kopfzeile), Dialog, inaktive Buttons, inaktive Panel-Einträge (Admin, ohne eigene Fläche) | 4,5 | 15,9 | 6,5 | ✓ beide |
| `onPrimary` auf `primary` | aktive Buttons (auch der gewählte Button im Segment-Control) und Navigation, Confirm (14px) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `onPrimary` auf `primary` | Fokus-Outline des gewählten Eintrags der Auswahlliste | 3,0 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `secondary` | Links in den Notizen (16px, Inhaltsverzeichnisse) auf den Notizseiten | 4,5 | 5,6 | **3,3** | **✗ Tavern, offen, siehe Anmerkung** |
| `primary` auf `background` | Fokus-Outline nicht gewählter Einträge der Auswahlliste | 3,0 | 6,1 | 4,7 | ✓ beide |
| `border` auf `background` | Rand der Kacheln im Admin gegen den Hintergrund | 3,0 | **1,5** | 4,3 | bewusst ✗ Dark |
| `border` auf `secondary` | Rand und Lichtkante der Kacheln im Admin (innen), Trennlinien in Karten und in den Panels „Audio“ und „Spieltisch“ | 3,0 | **1,5** | 3,0 | bewusst ✗ Dark |
| `background` auf `secondary` | Hover-Fläche der Menüpunkte der Navigationsleiste, der Panel-Einträge und der Buttons der Kopfzeile (Admin) | 3,0 | **1,1** | **1,4** | bewusst ✗ beide, siehe Anmerkung |
| `text.color` auf `secondary` | Icon des inaktiven Menüpunkts der Navigationsleiste und der inaktiven Buttons der Kopfzeile (ohne eigene Fläche) | 3,0 | 15,9 | 6,5 | ✓ beide |
| `text.color` auf `background` | Icon des inaktiven Menüpunkts der Navigationsleiste und der Buttons der Kopfzeile bei Hover | 3,0 | 17,4 | 9,2 | ✓ beide |
| `onPrimary` auf `primary` | Icon des aktiven Menüpunkts der Navigationsleiste und der aktiven Icon-Buttons „Dashboard“ und „Vollbild“ | 3,0 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `secondary` | Fokus-Outline der Menüpunkte der Navigationsleiste, der Panel-Einträge (Notizen, Szenen), der Buttons „Vollbild“ und „Dashboard“ (auf ihrer Kachel) und der Auswahllisten im Panel „Einstellungen“ (auf der Panel-Kachel) | 3,0 | 5,6 | 3,3 | ✓ beide |
| `text.color` auf `background` | Icons auf Flächen in Dashboard-Panels (Play-Button ohne Musik, „In neuem Fenster öffnen“) | 4,5 | 17,4 | 9,2 | ✓ beide |
| `primary` auf `secondary` | Status-Punkt „verbunden“ im Panel „Spieltisch“ | 3,0 | 5,6 | 3,3 | ✓ beide |
| `text.color` auf `secondary` | Ring des Status-Punkts „nicht verbunden“ | 3,0 | 15,9 | 6,5 | ✓ beide |
| `background` auf `secondary` | Flächen in Dashboard-Panels (Buttons, Segment-Control, Sound-Gruppen, Spielerzeilen, Slider-Schiene) | 3,0 | **1,1** | **1,4** | bewusst ✗ beide, siehe Anmerkung |
| `onScrim` auf `scrim` | Label, Szenenname und Beschreibung auf der Bühne (14px), Labels „Wall“ und „Ground“ (12px); ungünstigster Fall `scrim` über weißem Bild, über schwarzem 21,0 | 4,5 | 10,4 | 10,4 | ✓ beide |
| `text.color` auf `background` | Charaktername der Spielerzeile, Text nicht gewählter Buttons im Segment-Control (14px) | 4,5 | 17,4 | 9,2 | ✓ beide |
| `text.muted` auf `background` | Volk · Klasse · Spieler der Spielerzeile (14px) | 4,5 | 8,6 | 4,8 | ✓ beide |
| `initials` auf `secondary` | Initialen im Avatar der Spielerzeile (14px) | 4,5 | 5,6 | 6,5 | ✓ beide |
| `border` auf `background` | Rand des Avatars gegen die Spielerzeile | 3,0 | **1,5** | 4,3 | bewusst ✗ Dark, siehe Anmerkung |
| `text.muted` auf `secondary` | Lautsprecher-Icon im Panel „Audio“ | 3,0 | 8,1 | 3,9 | ✓ beide |
| `text.muted` auf `secondary` | nicht verwendet für Text (14px): Statustexte, Zustand der Musik und Label „Level“ stehen deshalb in `text.color` | 4,5 | 8,1 | **3,9** | nicht verwendet |
| `text.color` auf `background` | Zeichen „−“/„+“ der Buttons im Level-Stepper (20px) | 4,5 | 17,4 | 9,2 | ✓ beide |
| `text.color` auf `secondary` | Level im Level-Stepper (20px), Statustexte und Zustand der Musik (14px) | 4,5 | 15,9 | 6,5 | ✓ beide |
| `text.color` auf `background` | Charaktername der Hero-Karte (32px, derzeit nicht verwendet) | 3,0 | 17,4 | 9,2 | ✓ beide |
| `text.muted` auf `background` | Spielername der Hero-Karte (12px, derzeit nicht verwendet) | 4,5 | 8,6 | 4,8 | ✓ beide |
| `text.color` auf `secondary` | Chips der Hero-Karte (14px, derzeit nicht verwendet) | 4,5 | 15,9 | 6,5 | ✓ beide |
| `onPrimary` auf `primary` | Zahl im Level-Badge der Hero-Karte (14px, derzeit nicht verwendet) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `background` | Level-Badge gegen die Hero-Karte (derzeit nicht verwendet) | 3,0 | 6,1 | 4,7 | ✓ beide |
| `border` auf `background` | Rand von Avatar und Chips gegen die Hero-Karte (derzeit nicht verwendet) | 3,0 | **1,5** | 4,3 | bewusst ✗ Dark, siehe Anmerkung |
| `onError` auf `error` | Text der Hinweisleiste in der Kopfzeile (14px) | 4,5 | 9,0 | 9,0 | ✓ |
| `text.color` auf `secondaryTranslucent` | Text und Icons auf durchscheinenden Kacheln (Notizseiten, Dashboard-Panels, Abenteuername, Panel-Einträge); ungünstigster Fall über weißem Bild, über schwarzem Dark 16,9, Tavern 6,8 | 4,5 | 11,5 | 5,9 | ✓ beide |
| `primary` auf `secondaryTranslucent` | Status-Punkt „verbunden“ und Fokus-Outlines auf durchscheinenden Kacheln; ungünstigster Fall über weißem Bild, über schwarzem Dark 5,9, Tavern 3,5 | 3,0 | 4,0 | 3,0 | ✓ beide |
| `primary` auf `secondaryTranslucent` | Links in den Notizen (16px) auf durchscheinenden Notizseiten; ungünstigster Fall über weißem Bild, über schwarzem Dark 5,9, Tavern 3,5 | 4,5 | **4,0** | **3,0** | **✗ beide, offen wie in Tavern auf `secondary`** |
| `text.muted` auf `secondaryTranslucent` | Lautsprecher-Icon im Panel „Audio“; ungünstigster Fall über weißem Bild, über schwarzem Dark 8,4, Tavern 4,1 | 3,0 | 6,4 | 3,7 | ✓ beide |
| `border` auf `secondaryTranslucent` | Rand und Lichtkante durchscheinender Kacheln, Trennlinien darin; ungünstigster Fall über weißem Bild, über schwarzem Dark 1,5, Tavern 3,2 | 3,0 | **1,2** | **2,8** | bewusst ✗ beide |
| `background` auf `secondaryTranslucent` | Hover-Flächen und Flächen in Dashboard-Panels auf durchscheinenden Kacheln; über weißem Bild, über schwarzem Dark 1,0, Tavern 1,4 | 3,0 | **1,5** | **1,6** | bewusst ✗ beide, siehe Anmerkung |
| `text.color` auf `secondaryTranslucent` ohne `backdrop` | Wall-Kacheln (Party, Initiative): Name, Volk · Klasse (ab 14px), Labels „Runde N“, „Runde“ und „weitere“ (12px), Zahl im Rundentrenner und in „+N weitere“; ungünstigster Fall über weißem Szenenbild, über schwarzem Dark 16,9, Tavern 6,8 | 4,5 | 7,0 | 5,1 | ✓ beide |
| `onPrimary` auf `primary` | Badge „Am Zug“ auf der Wall-Kachel am Zug (12px); deckende Fläche, unabhängig vom Szenenbild | 4,5 | 6,1 | 4,7 | ✓ beide |
| `initials` auf `background` | Initialen im Avatar eines Spielers auf den Wall-Kacheln (`text.xl` bzw. `text.2xl`, groß); deckende Fläche | 3,0 | 6,1 | 9,2 | ✓ beide |
| `primary` auf `secondaryTranslucent` ohne `backdrop` | Rahmen der Wall-Kachel am Zug; über weißem Szenenbild, über schwarzem Dark 5,9, Tavern 3,5 | 3,0 | **2,5** | **2,6** | **✗ beide, Zusatzsignal, siehe Anmerkung** |
| `text.color` mit `DEAD_OPACITY` auf `secondaryTranslucent` ohne `backdrop` | Name und „Tot“ eines toten Spielers auf der Wall (ausgegraut); über weißem Szenenbild, über schwarzem Dark 4,3, Tavern 2,5 | 4,5 | **2,8** | **2,2** | bewusst ✗ beide, siehe Anmerkung |
| `negative.text` auf `negative.surface` mit `DEAD_OPACITY` ohne `backdrop` | Icon des Totenkopf-Badges eines toten Spielers auf der Wall (ausgegraut); über weißem Szenenbild | 3,0 | **2,59** | **2,60** | bewusst ✗ beide, siehe Anmerkung |
| `text.muted` · `primary` auf `secondaryTranslucent` ohne `backdrop` | nicht verwendet für Text auf den Wall-Kacheln: über weißem Szenenbild `text.muted` Dark 4,3, Tavern 3,3, `primary` Dark 2,5, Tavern 2,6 (über schwarzem 8,4 · 4,1 bzw. 5,9 · 3,5) | 4,5 | **4,3** · **2,5** | **3,3** · **2,6** | nicht verwendet |
| `text.color` auf `secondaryTranslucent` über `overlay` | Icon und Text im Vollbild-Overlay (Wall, Ground), Überschrift „Weltkarte“ bzw. „Spieler verbinden“, URL und Hinweis im Wall-Panel; ungünstigster Fall über weißem Bild, über schwarzem Dark 16,9, Tavern 6,8 | 4,5 | 15,4 | 6,6 | ✓ beide |
| `qr.foreground` auf `qr.background` | QR-Code im Panel „Spieler verbinden“ (Wall) | 3,0 | 21,0 | 21,0 | ✓ |
| `onError` auf `error` | Icon-Button und Fokus-Outline der Hinweisleiste | 3,0 | 9,0 | 9,0 | ✓ |
| `border` auf `error` | Rand und Lichtkante der Hinweisleiste | 3,0 | **1,2** | **2,0** | bewusst ✗ beide |
| `text.color` auf `resource.*.muted` | Zahl im Ressourcen-Button (24px, groß) | 3,0 | 14,2–17,6 | 7,2–9,0 | ✓ beide |
| `resource.*.strong` auf `resource.*.muted` | Rahmen, verfügbare Icons und Plätze | 3,0 | 3,8–11,7 | 3,8–11,7 | ✓ beide |
| `resource.*.strong` auf `secondary` | Rahmen gegen die Karte | 3,0 | 4,0–13,0 | 3,2–10,5 | ✓ beide |
| `resource.empty` auf `resource.*.muted` | verbrauchte Icons und Plätze | 3,0 | 3,1–3,9 | 3,1–3,9 | ✓ beide |
| `negative.text` · `positive.text` auf ihrer Fläche | Nummer im Avatar eines Gegners bzw. Verbündeten (Kampf), markierter Totenkopf (`negative`) | 4,5 | 6,9 (`negative`) · 7,8 (`positive`) | gleich | ✓ beide |
| `negative.text` auf `secondary` | Fehlermeldung beim Hinzufügen im Panel „Kampf“ (ohne Hintergrundbild) | 4,5 | 6,2 | 5,0 | ✓ beide |
| `positive.text` auf `secondary` | derzeit nicht verwendet (spätere Effekt-Chips) | 4,5 | 8,5 | 6,8 | ✓ beide |
| `negative.text` auf `secondaryTranslucent` | Fehlermeldung beim Hinzufügen im Panel „Kampf“ auf der durchscheinenden Kachel; ungünstigster Fall über weißem Bild, über schwarzem Dark 6,6, Tavern 5,3 | 4,5 | 4,5 (knapp, siehe Anmerkung) | 4,6 | ✓ beide |
| `positive.text` auf `secondaryTranslucent` | derzeit nicht verwendet (spätere Effekt-Chips); ungünstigster Fall über weißem Bild, über schwarzem Dark 9,0, Tavern 7,2 | 4,5 | 6,1 | 6,2 | ✓ beide |
| `negative.text` auf `background` | Schloss im Hinweis „Kampf läuft“ (Panel „Szenen“) | 3,0 | 6,8 | 7,1 | ✓ beide |
| `negative.border` · `positive.border` auf `background` | Rand des Avatars eines Gegners bzw. Verbündeten in den Zeilen (Panel „Kampf“, Initiative) | 3,0 | 5,0 (`negative`) · 4,5 (`positive`) | 5,2 · 4,7 | ✓ beide |
| `negative.border` auf `secondary` | Punkt am Menüpunkt „Kampf“ (laufender Kampf) | 3,0 | 4,6 | 3,7 | ✓ beide |
| `initials` auf `background` | Initialen im Avatar eines Spielers direkt auf der Kachel (Hero-Karte in „Am Zug“, „Als Nächstes“) | 3,0 (Hero, groß) · 4,5 (`sm`) | 6,1 | 9,2 | ✓ beide |

**Anmerkungen**

- **Tavern-Rot** (`primary` in Tavern): liegt mit 4,7:1 sicher über der Grenze; `#BD5A5A` erreichte nur genau 4,50:1.
- **`border` im Dark-Theme:** Ausnahme und Begründung in [2.6](../../DESIGN.md#26-kontrast).
- **Kacheln (Admin):** Navigationsleiste, Panel und die Kacheln der Kopfzeile haben die Fläche `secondary`. Inaktive
  Menüpunkte, Panel-Einträge und Buttons der Kopfzeile haben keine eigene Fläche; ihre Hover-Fläche `background` hebt
  sich davon nur schwach ab (Dark 1,1, Tavern 1,4) und ist nur ein Zusatzsignal. Erkennbar sind sie über Icon bzw. Text,
  die das Ziel auf `secondary` und auf `background` erreichen. Rand und Lichtkante der Kacheln (auch der Hinweisleiste)
  in `border` sind Gestaltung wie die Trennlinien (Ausnahme in [2.6](../../DESIGN.md#26-kontrast)).
- **Links in den Notizen:** Seit die Notizseiten Kacheln in `secondary` sind, verfehlt `primary` als Textfarbe in
  Tavern 4,5:1 (3,3:1); auf durchscheinenden Notizseiten über einem hellen Hintergrundbild auch in Dark (4,0:1). Betroffen sind die Text-Links der Inhaltsverzeichnisse (z. B. `public/story/fight`); eine
  Lösung ist offen ([known-issues.md](../../../docs/known-issues.md)).
- **Spielerzeile und Hero-Karte (Admin):** Avatar und Chips sind keine Bedienelemente; ihr Rand in `border` ist
  Gestaltung wie die Trennlinien (Ausnahme in [2.6](../../DESIGN.md#26-kontrast)). Erkennbar sind sie an Initialen bzw.
  Text, die das Ziel erreichen. Deaktivierte Buttons „−“/„+“ (Zeichen in `text.muted`) sind nach WCAG vom Kontrastziel ausgenommen
  (Dark 8,6, Tavern 4,8 auf `background`).
- **Bühne (Admin):** Der Verlauf unter dem Text ist nach `space.7` voll deckend, der Text beginnt erst darunter. Gemessen
  ist deshalb `onScrim` auf `scrim` über dem hellsten möglichen Bild (Weiß): `scrim` ergibt dort etwa `#404040`.
  `scrim` und `onScrim` sind in beiden Themes gleich.
- **Vollbild-Overlay, Weltkarte und QR-Code (Wall, Ground):** `overlay` dunkelt nur ab und trägt keinen Text. Icon
  und Text des Vollbild-Overlays bzw. Überschrift, URL und Hinweis der Wall-Panels (`text.color`) stehen auf einer durchscheinenden
  Kachel über `overlay`: über einem weißen Bild ergibt `overlay` etwa `#262626`, die Kachel darüber etwa `#1a1e24`
  (Dark) bzw. `#3b271d` (Tavern).
- **Wall-Kacheln (Party, Initiative):** Sie liegen ohne Abdunklung direkt auf dem Szenenbild. Über einem weißen Bild
  ergibt die Kachel etwa `#50545a` (Dark) bzw. `#4c382e` (Tavern), über einem schwarzen etwa `#10141a` bzw.
  `#38241a`. Text steht darauf deshalb in `text.color`, nicht in `text.muted`; der Akzent „Am Zug“ ist ein Badge mit
  eigener Fläche `primary` und Text `onPrimary`, weil `primary` als Textfarbe dort vom Bild abhinge. Der Rahmen der
  Kachel am Zug in `primary` ist ein Zusatzsignal wie die Hover-Flächen: Wer am Zug ist, zeigen das Badge „Am Zug“,
  Größe und Position der Kachel. Bewusste Ausnahme (vom User entschieden, DND-45): Avatar, Text und Totenkopf
  toter Spieler sind mit `DEAD_OPACITY` ausgegraut. Name und „Tot“ erreichen über einem weißen Bild Dark 2,78:1,
  Tavern 2,24:1 (über einem schwarzen 4,25 bzw. 2,54; Ziel 4,5:1), das Icon auf seinem Badge Dark 2,59:1, Tavern 2,60:1
  (Ziel 3:1). WCAG nimmt nur inaktive Bedienelemente aus; das Ausgrauen ist hier selbst das Signal „tot“
  ([2.6](../../DESIGN.md#26-kontrast)).
- **Durchscheinende Kacheln (Admin):** Die Fläche ist `secondaryTranslucent` (Dark 75 %, Tavern 92 % deckend) über dem
  Hintergrundbild des Abenteuers unter `backdrop`. Gemessen sind die beiden Extreme, nicht nur die gewählten Bilder:
  über einem weißen Bild ergibt `backdrop` etwa `#808080`, die Kachel darüber etwa `#30343a` (Dark) bzw. `#422e24`
  (Tavern); über einem schwarzen Bild etwa `#10141a` bzw. `#38241a`. In der Tabelle steht der
  ungünstigere Wert, der andere in der Spalte „Verwendung“. Die Unschärfe ändert den Mittelwert nicht und bleibt ohne
  Einfluss auf die Messung. Ohne Hintergrundbild sind die Kacheln deckend `secondary`, es gelten die Werte oben.
  `border` und die Flächen in `background` sind Gestaltung bzw. Zusatzsignal wie auf `secondary` (Ausnahmen in
  [2.6](../../DESIGN.md#26-kontrast)).
- **Fokus-Outline der Auswahllisten:** Sie liegen im Panel „Einstellungen“ mit dessen Innenabstand; die Outline
  außen um den Button liegt so auf der Panel-Kachel, nicht auf dem Hintergrundbild (dort erreichte `primary` über einem
  weißen Bild in Tavern nur 1,1:1, Dark 1,3:1; auf der durchscheinenden Kachel 3,0:1, Dark 4,0:1).
- **Ressourcen (Player):** Die Spannen reichen über alle fünf Ressourcen.
- **Durchscheinende Karten (Player):** Karten und Settings-Button im Player haben dieselbe Fläche wie die Kacheln im
  Admin, es gelten die Werte für `secondaryTranslucent`. Offen (DND-46): Der Kopf der
  Charakterauswahl (Abenteuername als Label, „Charakter wählen“) steht wie im Mockup direkt auf dem abgedunkelten
  Hintergrundbild, nicht auf einer Karte; über sehr hellen Bildern kann `text.color` dort unter 4,5:1 fallen
  (über einem weißen Bild unter `backdrop`, etwa `#808080`: Dark 3,6:1, Tavern 1,8:1;
  über einem schwarzen deutlich darüber).
- **`negative.text` auf durchscheinender Kachel (Dark):** Über einem rein weißen Bild liegt der Wert genau an der
  Grenze; je nach Rundung der Zwischenfarbe 4,48–4,51:1. Über realen, nicht rein weißen Bildern liegt er darüber.
- **Avatar von Spielern (Admin):** Die Fläche richtet sich nach dem Untergrund, damit sich der Avatar abhebt: direkt auf
  der Kachel (Hero-Karte in „Am Zug“, „Als Nächstes“) `background`, auf Zeilen mit Fläche `background` (Spielerzeile,
  Initiative, Panel „Kampf“) `secondary`.
- **Flächen in Dashboard-Panels (Admin):** Buttons und Slider-Schiene haben die Fläche `background` auf dem Panel in
  `secondary` (wie Decline im Dialog); die Fläche hebt sich nur schwach ab und ist nur ein Zusatzsignal, erkennbar sind
  die Bedienelemente an Icon, Text bzw. Griff, die das Ziel erreichen. Der Status-Punkt trägt den Zustand zusätzlich über
  die Form (gefüllt bzw. Ring) und den Text daneben.
