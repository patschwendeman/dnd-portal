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
| `dark` | `#020409` | `#000000` |
| `border` | `#3d444db3` | `#956F01` |
| `background` | `#0e1117` | `#140701` |
| `overlay` | `rgba(0, 0, 0, 0.850)` | `rgba(0, 0, 0, 0.850)` |
| `text.color` | `#f0f6fc` | `#CBAB96` |
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

## Kontrastmessung

Gemessen mit den Werten oben, Regel und Ziel in [2.6](../../DESIGN.md#26-kontrast). `border` ist halbtransparent bzw.
auf der jeweiligen Fläche gemessen. Fett = verfehlt das Ziel.

| Paar | Verwendung | Ziel | Dark | Tavern | Ergebnis |
|---|---|---|---|---|---|
| `text.color` auf `background` | Notizen, Wall-Panel, inaktive Panel-Einträge (Admin, ohne eigene Fläche) | 4,5 | 17,4 | 9,2 | ✓ beide |
| `text.color` auf `secondary` | Karten, Dashboard-Panels, Dialog, inaktive Buttons, Panel-Einträge bei Hover (Admin) | 4,5 | 15,9 | 6,5 | ✓ beide |
| `text.color` auf `dark` | Steuerleiste | 4,5 | 18,8 | 9,8 | ✓ beide |
| `onPrimary` auf `primary` | aktive Buttons (auch in der Steuerleiste von Wall und Ground) und Navigation, Confirm (14px) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `onPrimary` auf `primary` | Fokus-Outline des gewählten Eintrags der Auswahlliste | 3,0 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `background` | Links in den Notizen (16px) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `background` | Fokus-Outline nicht gewählter Einträge der Auswahlliste | 3,0 | 6,1 | 4,7 | ✓ beide |
| `border` auf `background` | Rand der Notizseiten | 3,0 | **1,5** | 4,3 | bewusst ✗ Dark |
| `border` auf `secondary` | Trennlinien in Karten | 3,0 | **1,5** | 3,0 | bewusst ✗ Dark |
| `secondary` auf `background` | Linie unter der Top-Bar, Linien rechts an Navigationsleiste und Panel (Admin) | 3,0 | **1,1** | **1,4** | bewusst ✗ beide |
| `secondary` auf `background` | Hover-Fläche der Menüpunkte der Navigationsleiste und der Panel-Einträge (Admin) | 3,0 | **1,1** | **1,4** | bewusst ✗ beide, siehe Anmerkung |
| `text.color` auf `background` | Icon des inaktiven Menüpunkts der Navigationsleiste (ohne eigene Fläche) | 3,0 | 17,4 | 9,2 | ✓ beide |
| `text.color` auf `secondary` | Icon des inaktiven Menüpunkts der Navigationsleiste bei Hover | 3,0 | 15,9 | 6,5 | ✓ beide |
| `onPrimary` auf `primary` | Icon des aktiven Menüpunkts der Navigationsleiste | 3,0 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `background` | Fokus-Outline der Menüpunkte der Navigationsleiste und der Panel-Einträge (Notizen, Szenen) | 3,0 | 6,1 | 4,7 | ✓ beide |
| `text.color` auf `background` | Icons auf Flächen in Dashboard-Panels (Play-Button ohne Musik, „In neuem Fenster öffnen“), Text des Buttons „QR-Code“ | 4,5 | 17,4 | 9,2 | ✓ beide |
| `primary` auf `secondary` | Status-Punkt „verbunden“ im Panel „Screens“ | 3,0 | 5,6 | 3,3 | ✓ beide |
| `text.color` auf `secondary` | Ring des Status-Punkts „nicht verbunden“ | 3,0 | 15,9 | 6,5 | ✓ beide |
| `background` auf `secondary` | Flächen in Dashboard-Panels (Buttons, Slider-Schiene, leere Bildfläche) | 3,0 | **1,1** | **1,4** | bewusst ✗ beide, siehe Anmerkung |
| `onError` auf `error` | Text der Hinweisleiste (14px) | 4,5 | 9,0 | 9,0 | ✓ |
| `qr.foreground` auf `qr.background` | QR-Code im Dialog „Spieler verbinden“ | 3,0 | 21,0 | 21,0 | ✓ |
| `onError` auf `error` | Icon-Button und Fokus-Outline der Hinweisleiste | 3,0 | 9,0 | 9,0 | ✓ |
| `text.color` auf `resource.*.muted` | Zahl im Ressourcen-Button (24px, groß) | 3,0 | 14,2–17,6 | 7,2–9,0 | ✓ beide |
| `resource.*.strong` auf `resource.*.muted` | Rahmen, verfügbare Icons und Plätze | 3,0 | 3,8–11,7 | 3,8–11,7 | ✓ beide |
| `resource.*.strong` auf `secondary` | Rahmen gegen die Karte | 3,0 | 4,0–13,0 | 3,2–10,5 | ✓ beide |
| `resource.empty` auf `resource.*.muted` | verbrauchte Icons und Plätze | 3,0 | 3,1–3,9 | 3,1–3,9 | ✓ beide |

**Anmerkungen**

- **Tavern-Rot** (`primary` in Tavern): liegt mit 4,7:1 sicher über der Grenze; `#BD5A5A` erreichte nur genau 4,50:1.
- **`border` im Dark-Theme:** Ausnahme und Begründung in [2.6](../../DESIGN.md#26-kontrast).
- **Navigationsleiste (Admin):** Leiste und Panel haben die Fläche `background`. Inaktive Menüpunkte und
  Panel-Einträge haben keine eigene Fläche; ihre Hover-Fläche `secondary` hebt sich davon nur schwach ab (Dark 1,1,
  Tavern 1,4) und ist nur ein Zusatzsignal. Erkennbar sind sie über Icon bzw. Text, die das Ziel auf `background` und
  auf `secondary` erreichen. Die Linien in `secondary` sind
  Gestaltung wie die Linie unter der Top-Bar (Ausnahme in [2.6](../../DESIGN.md#26-kontrast)).
- **Ressourcen (Player):** Die Spannen reichen über alle fünf Ressourcen.
- **Flächen in Dashboard-Panels (Admin):** Buttons und Slider-Schiene haben die Fläche `background` auf dem Panel in
  `secondary` (wie Decline im Dialog); die Fläche hebt sich nur schwach ab und ist nur ein Zusatzsignal, erkennbar sind
  die Bedienelemente an Icon, Text bzw. Griff, die das Ziel erreichen. Der Status-Punkt trägt den Zustand zusätzlich über
  die Form (gefüllt bzw. Ring) und den Text daneben.
