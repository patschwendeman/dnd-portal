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
| `badge.background` | `#5a5a5a` | `#5a5a5a` |
| `badge.text` | `#ffffff` | `#ffffff` |
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
| `text.color` auf `background` | Notizen, Wall-Panel | 4,5 | 17,4 | 9,2 | ✓ beide |
| `text.color` auf `secondary` | Karten, Dialog, inaktive Buttons | 4,5 | 15,9 | 6,5 | ✓ beide |
| `text.color` auf `dark` | Bottom-Bar, Steuerleiste | 4,5 | 18,8 | 9,8 | ✓ beide |
| `onPrimary` auf `primary` | aktive Buttons (auch in der Steuerleiste von Wall und Ground) und Navigation, Confirm (14px) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `background` | Links in den Notizen (16px) | 4,5 | 6,1 | 4,7 | ✓ beide |
| `primary` auf `secondary` | aktive Kachel im Admin (Outline) | 3,0 | 5,6 | 3,3 | ✓ beide |
| `primary` auf `background` | aktive Kachel auf der Wall (Outline) | 3,0 | 6,1 | 4,7 | ✓ beide |
| `border` auf `background` | Rand der Notizseiten | 3,0 | **1,5** | 4,3 | bewusst ✗ Dark |
| `border` auf `secondary` | Trennlinien in Karten | 3,0 | **1,5** | 3,0 | bewusst ✗ Dark |
| `badge.text` auf `badge.background` | Kachelnummer | 4,5 | 6,9 | 6,9 | ✓ |
| `onError` auf `error` | Text der Hinweisleiste (14px) | 4,5 | 9,0 | 9,0 | ✓ |
| `onError` auf `error` | Icon-Button und Fokus-Outline der Hinweisleiste | 3,0 | 9,0 | 9,0 | ✓ |
| `text.color` auf `resource.*.muted` | Zahl im Ressourcen-Button (24px, groß) | 3,0 | 14,2–17,6 | 7,2–9,0 | ✓ beide |
| `resource.*.strong` auf `resource.*.muted` | Rahmen, verfügbare Icons und Plätze | 3,0 | 3,8–11,7 | 3,8–11,7 | ✓ beide |
| `resource.*.strong` auf `secondary` | Rahmen gegen die Karte | 3,0 | 4,0–13,0 | 3,2–10,5 | ✓ beide |
| `resource.empty` auf `resource.*.muted` | verbrauchte Icons und Plätze | 3,0 | 3,1–3,9 | 3,1–3,9 | ✓ beide |

**Anmerkungen**

- **Tavern-Rot** (`primary` in Tavern): liegt mit 4,7:1 sicher über der Grenze; `#BD5A5A` erreichte nur genau 4,50:1.
- **`border` im Dark-Theme:** Ausnahme und Begründung in [2.6](../../DESIGN.md#26-kontrast).
- **Ressourcen (Player):** Die Spannen reichen über alle fünf Ressourcen.
