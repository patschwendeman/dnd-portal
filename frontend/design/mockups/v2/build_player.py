"""Erzeugt das Layout-Mockup des Player Screens (Smartphone, Querformat) als HTML.

Nur nicht-farbliche Werte sind neu (Abstände, Größen, Schrift, Radien, Positionen).
Theme-Farben stammen aus darkTheme.ts, die Ressourcenfarben 1:1 aus ResourceBarPlayer.tsx.
Tokens nach frontend/DESIGN.md.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ICONS = ROOT / 'frontend/public/assets/icons'
OUT = Path(__file__).resolve().parent


def icon(name: str) -> str:
    svg = (ICONS / f'{name}.svg').read_text()
    svg = svg[svg.index('<svg'):]
    return svg.replace('width="800px"', '').replace('height="800px"', '')

CSS = """
:root {
  /* Theme-Farben: unverändert aus darkTheme.ts */
  --secondary: #161b23; --background: #0e1117; --text: #f0f6fc;
  /* Ressourcenfarben: unverändert aus ResourceBarPlayer.tsx */
  --action: #077600; --action-muted: #072900;
  --bonus: #b23700; --bonus-muted: #290e00;
  --movement: #fae100; --movement-muted: #292500;
  --spell: #2487ff; --spell-muted: #001229;
  --special: #ff2424; --special-muted: #290000;
  --empty: #232321; --value: #9e998a;

  /* Tokens aus DESIGN.md */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
  --font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-pill: 999px;
  --border-thick: 2px; --control-md: 40px; --icon: 20px;

  /* neu für den Player (Vorschlag) */
  --control-lg: 64px;   /* Ressourcen-Button: große Tippfläche */
  --slot-w: 8px; --slot-h: 24px;
  /* Abstand zum Rand: max(space.5, Safe Area). Im Mockup ohne Notch = 24px */
  --edge: max(var(--space-5), env(safe-area-inset-left));
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { font-family: var(--font); font-size: 16px; line-height: 24px; background: var(--background); color: var(--text);
  -webkit-font-smoothing: antialiased; user-select: none; }
svg { width: 100%; height: 100%; fill: var(--text); }

.screen { height: 100%; display: grid; grid-template-columns: var(--control-md) 1fr; gap: var(--space-4);
  padding: var(--space-4) var(--edge); align-items: center; }
.rail { align-self: start; }
.icon-btn { width: var(--control-md); height: var(--control-md); display: grid; place-items: center; border: none;
  border-radius: var(--radius-md); background: var(--secondary); color: var(--text); }
.icon-btn svg { width: var(--icon); height: var(--icon); }

.card { background: var(--secondary); border-radius: var(--radius-lg); padding: var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-4); }
.row { display: grid; grid-template-columns: repeat(4, 1fr); column-gap: var(--space-3); row-gap: var(--space-2); }
.cell { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.label { font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.row .label.span { grid-column: 1 / -1; }

.res { height: var(--control-lg); display: flex; align-items: center; justify-content: center; gap: var(--space-3);
  border: var(--border-thick) solid; border-radius: var(--radius-lg); color: var(--value);
  font-size: 24px; line-height: 32px; font-weight: 600; font-variant-numeric: tabular-nums; }
.res.static { cursor: default; }
.action { border-color: var(--action); background: var(--action-muted); }
.bonus { border-color: var(--bonus); background: var(--bonus-muted); }
.movement { border-color: var(--movement); background: var(--movement-muted); }
.spell { border-color: var(--spell); background: var(--spell-muted); }
.special { border-color: var(--special); background: var(--special-muted); }

.ico { width: var(--icon); height: var(--icon); display: grid; place-items: center; }
.dot { width: var(--icon); height: var(--icon); border-radius: 50%; }
.tri { width: 0; height: 0; border-style: solid; border-width: 0 10px 18px 10px; border-color: transparent; }
.dots { display: flex; gap: var(--space-1); }
.dots i { width: var(--space-2); height: var(--space-2); border-radius: 50%; background: var(--movement); }
.slots { display: flex; gap: var(--space-1); }
.slots i { width: var(--slot-w); height: var(--slot-h); border-radius: 2px; background: var(--empty); }
.res.spell { justify-content: space-between; padding: 0 var(--space-4); }
.numeral { font-size: 20px; line-height: 28px; font-weight: 600; }

/* Hinweis im Hochformat */
.rotate { position: fixed; inset: 0; display: none; place-content: center; justify-items: center; gap: var(--space-4);
  padding: var(--space-5); background: var(--background); text-align: center; }
.rotate .phone { width: 96px; height: 96px; }
.rotate p { font-size: 16px; line-height: 24px; font-weight: 500; }
@media (max-width: 649px) { .rotate { display: grid; } }
"""


def slots(color: str, current: int, total: int) -> str:
    return '<span class="slots">' + ''.join(
        f'<i style="background: var(--{color})"></i>' if i < current else '<i></i>' for i in range(total)) + '</span>'


spells = [('I', 3, 4), ('II', 3, 3), ('III', 1, 3), ('IV', 0, 2)]
spell_cells = ''.join(
    f'<div class="res spell"><span class="numeral">{n}</span>{slots("spell", c, t)}</div>' for n, c, t in spells)

html = f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><title>Player Mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<div class="screen">
  <div class="rail"><button class="icon-btn">{icon('settings')}</button></div>
  <div class="card">
    <div class="row">
      <div class="cell"><span class="label">Aktion</span>
        <div class="res action"><span class="ico"><span class="dot" style="background: var(--action)"></span></span>1</div></div>
      <div class="cell"><span class="label">Bonusaktion</span>
        <div class="res bonus"><span class="ico"><span class="tri" style="border-bottom-color: var(--empty)"></span></span>0</div></div>
      <div class="cell"><span class="label">Bewegung</span>
        <div class="res movement static"><span class="ico"><span class="dots"><i></i><i></i></span></span>9.5</div></div>
      <div class="cell"><span class="label">Spezial</span>
        <div class="res special">{slots("special", 1, 3)}</div></div>
    </div>
    <div class="row">
      <span class="label span">Zauberplätze</span>
      {spell_cells}
    </div>
  </div>
</div>
<div class="rotate"><span class="phone">{icon('phone')}</span><p>Bitte das Handy quer halten</p></div>
</body></html>"""

(OUT / 'player.html').write_text(html)
# Hochformat-Variante: headless Chrome rendert nicht schmaler als 500px. Ein iframe mit 390px Breite
# liefert den echten Hochformat-Viewport, der Screenshot wird danach auf 390px beschnitten.
(OUT / 'player-portrait.html').write_text(
    '<!doctype html><html><body style="margin:0;background:#0e1117">'
    '<iframe src="player.html" style="border:0;width:390px;height:844px;display:block;margin:0 auto"></iframe></body></html>')
print('ok')
