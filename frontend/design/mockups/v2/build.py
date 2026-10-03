"""Erzeugt die Layout-Mockups v2 (Admin, Wall, Ground) als HTML.

v2: Konsistenz-Abgleich K1–K4 (siehe frontend/design/*-mapping.md).

Nur nicht-farbliche Werte sind neu (Abstände, Größen, Schrift, Radien, Positionen).
Alle Farben stammen 1:1 aus frontend/src/style/darkTheme.ts.
Bilder werden direkt aus frontend/public/assets geladen.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ICONS = ROOT / 'frontend/public/assets/icons'
OUT = Path(__file__).resolve().parent
ASSET = (ROOT / 'frontend/public/assets').as_uri()


def icon(name: str) -> str:
    svg = (ICONS / f'{name}.svg').read_text()
    svg = svg[svg.index('<svg'):]
    return svg.replace('width="800px"', '').replace('height="800px"', '')


BASE_CSS = """
:root {
  /* Farben: unverändert aus darkTheme.ts */
  --primary: #4493F8; --secondary: #161b23; --dark: #000000;
  --border: #3d444db3; --background: #0e1117; --text: #f0f6fc; --on-primary: #0e1117;

  /* Abstände: 4px-Raster */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Schrift */
  --font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-xs: 12px; --font-sm: 14px; --font-md: 16px; --font-lg: 20px;
  --font-xl: 24px; --font-2xl: 32px;

  /* Radien */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px; --radius-pill: 999px;

  /* Größen */
  --control-sm: 32px; --control-md: 40px; --icon: 20px;
  --bar-h: 56px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1920px; height: 1080px; overflow: hidden; }
body { font-family: var(--font); font-size: var(--font-md); line-height: 24px;
  background: var(--background); color: var(--text); -webkit-font-smoothing: antialiased; }
svg { width: 100%; height: 100%; fill: var(--text); }
button { color: var(--text); font-family: var(--font); }
.label { font-size: var(--font-xs); line-height: 16px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
"""

HEAD = """<!doctype html><html lang="de"><head><meta charset="utf-8"><title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{css}</style></head><body>"""


def tiles(n: int, numbered: bool, active=None) -> str:
    out = []
    for i in range(1, n + 1):
        cls = 'tile active' if i == active else 'tile'
        badge = f'<span class="badge">{i}</span>' if numbered else ''
        out.append(f'<div class="{cls}"><img src="{ASSET}/images/ground_screen/battle_{i}.jpg" alt="">{badge}</div>')
    return ''.join(out)


TILE_CSS = """
.tile { position: relative; aspect-ratio: 16 / 9; border-radius: var(--radius-sm);
  outline: 1px solid var(--border); overflow: hidden; cursor: pointer; }
.tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tile.active { outline: 2px solid var(--primary); outline-offset: 2px; }
"""

# ---------------------------------------------------------------- Admin
sound_groups = [['heart', 'bottle'], ['buff', 'music', 'music_2'], ['bold', 'star_2'], ['eye', 'ghost'], ['lock']]
topbar = '<span class="divider"></span>'.join(
    '<div class="group">' + ''.join(f'<button class="icon-btn">{icon(i)}</button>' for i in g) + '</div>'
    for g in sound_groups)
nav = ''.join(f'<button class="nav-item{" active" if i == 0 else ""}">{n}</button>'
              for i, n in enumerate(['Main', 'Fight', 'Side', 'Leveling', 'Mechaniken']))
side = ['forest', 'shop', 'tavern', 'levelUp']
sidemaps = ''.join(f'<div class="tile side{" active" if i == 0 else ""}"><img src="{ASSET}/images/wall_screen/{s}.jpg" alt=""></div>'
                   for i, s in enumerate(side))

admin_css = BASE_CSS + TILE_CSS + """
.app { display: grid; grid-template-rows: var(--bar-h) 1fr 80px; height: 1080px; }

/* Top-Bar: Sounds zentriert, gruppiert */
.topbar { display: grid; grid-template-columns: 240px 1fr 240px; align-items: center;
  padding: 0 var(--space-5); background: var(--background); border-bottom: 1px solid var(--secondary); }
.brand { font-size: var(--font-md); font-weight: 700; }
.sounds { display: flex; align-items: center; justify-content: center; gap: var(--space-4); }
.group { display: flex; gap: var(--space-1); }
.divider { width: 1px; height: var(--icon); background: var(--border); }
.icon-btn { width: var(--control-md); height: var(--control-md); display: grid; place-items: center;
  border: none; border-radius: var(--radius-md); background: transparent; cursor: pointer; }
.icon-btn svg { width: var(--icon); height: var(--icon); }
.topbar .settings { justify-self: end; }

/* Hauptbereich: 3 Spalten mit festem Rhythmus */
.main { display: grid; grid-template-columns: 200px 1fr 400px; gap: var(--space-5);
  padding: var(--space-5); min-height: 0; }

.nav { display: flex; flex-direction: column; gap: var(--space-1); }
.nav .label { padding: 0 var(--space-3) var(--space-2); }
.nav-item { height: var(--control-md); padding: 0 var(--space-3); text-align: left; border: none;
  border-radius: var(--radius-md); background: var(--secondary); color: var(--text);
  font: 500 var(--font-sm)/20px var(--font); cursor: pointer; }
.nav-item.active { background: var(--primary); color: var(--on-primary); }

.reader { overflow: hidden; display: flex; flex-direction: column; align-items: center; gap: var(--space-5); position: relative; }
.page { width: 100%; max-width: 880px; padding: var(--space-7) var(--space-8);
  border: 1px solid var(--border); border-radius: var(--radius-lg); }
.page h1 { font-size: var(--font-2xl); line-height: 40px; font-weight: 700;
  padding-bottom: var(--space-3); margin-bottom: var(--space-5); border-bottom: 1px solid var(--border); }
.page h2 { font-size: var(--font-xl); line-height: 32px; font-weight: 600; margin: var(--space-6) 0 var(--space-3); }
.page p { font-size: var(--font-md); line-height: 26px; margin-bottom: var(--space-4); max-width: 68ch; }
.page ol { padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
.page ol ol { margin-top: var(--space-2); }
.page li { line-height: 24px; }
.page a { color: var(--primary); text-decoration: none; }
.to-top { position: absolute; right: var(--space-4); bottom: var(--space-4); width: var(--control-md); height: var(--control-md);
  border-radius: var(--radius-md); background: var(--secondary); border: none; display: grid; place-items: center; }
.to-top svg { width: var(--icon); height: var(--icon); }

.sidebar { display: flex; flex-direction: column; gap: var(--space-5); min-height: 0; }
.card { background: var(--secondary); border-radius: var(--radius-lg); padding: var(--space-5); }
.card h3 { font-size: var(--font-lg); line-height: 28px; font-weight: 600; }
.card .desc { font-size: var(--font-sm); line-height: 20px; margin-top: var(--space-1); }
.facts { margin-top: var(--space-5); display: flex; flex-direction: column; }
.fact { display: grid; grid-template-columns: 96px 1fr; gap: var(--space-3); padding: var(--space-3) 0;
  border-top: 1px solid var(--border); font-size: var(--font-sm); line-height: 20px; align-items: baseline; }
.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-3); }
.grid5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2); }

/* Bottom-Bar: Musik links, Szenen zentriert, gleiche Höhe */
.bottombar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  padding: 0 var(--space-5); background: var(--dark); }
.music { display: flex; align-items: center; gap: var(--space-3); }
.play { width: var(--control-md); height: var(--control-md); border-radius: var(--radius-md); border: none;
  background: var(--secondary); display: grid; place-items: center; }
.play svg { width: var(--icon); height: var(--icon); }
.track { display: flex; flex-direction: column; }
.track .name { font-size: var(--font-sm); line-height: 20px; font-weight: 500; }
.sides { display: flex; gap: var(--space-2); align-items: center; }
.sides .label { margin-right: var(--space-2); }
.tile.side { width: 96px; }

/* Bestätigungsdialog */
.dlg-layer { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0, 0, 0, 0.850); z-index: 100; }
.dlg { width: 600px; display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-5);
  background: var(--secondary); border-radius: var(--radius-lg); overflow: hidden; }
.dlg img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.dlg-body { padding: 0 var(--space-5); display: flex; flex-direction: column; gap: var(--space-1); }
.dlg-body h3 { font-size: var(--font-lg); line-height: 28px; font-weight: 600; }
.dlg-body p { font-size: var(--font-sm); line-height: 20px; }
.dlg-actions { display: flex; justify-content: flex-end; gap: var(--space-3); padding: 0 var(--space-5); }
.btn { min-width: 112px; height: var(--control-md); padding: 0 var(--space-4); border: none; border-radius: var(--radius-md);
  font: 600 var(--font-sm)/20px var(--font); }
.btn.decline { background: var(--background); }
.btn.confirm { background: var(--primary); color: var(--on-primary); }
"""

admin_html = HEAD.format(title='Admin Mockup', css=admin_css) + f"""
<div class="app">
  <header class="topbar">
    <div class="brand">DnD Portal</div>
    <div class="sounds">{topbar}</div>
    <button class="icon-btn settings">{icon('settings')}</button>
  </header>
  <div class="main">
    <nav class="nav"><span class="label">Notizen</span>{nav}</nav>
    <section class="reader">
      <article class="page">
        <h1>Inhaltsverzeichnis</h1>
        <ol>
          <li><a href="#">Intro</a></li>
          <li><a href="#">Taverne</a><ol><li><a href="#">Aric Dunkelwind</a></li><li><a href="#">Die Gruppe in der Taverne</a></li></ol></li>
          <li><a href="#">Shop</a><ol><li><a href="#">Elyndra Moonglade</a></li></ol></li>
        </ol>
      </article>
      <article class="page">
        <h1>Intro</h1>
        <p>Ihr seid eine Gruppe von Abenteurern, die die wilden Grenzlande von Baldur's Gate und seine weiten Ländereien
        durchstreifen – auf der Suche nach Aufträgen, Gold und vor allem einer anständigen Mahlzeit. Seit Tagen habt ihr
        nichts weiter als dürftige Rationen zu euch genommen, und der Hunger wird unerbittlich.</p>
        <p>Vor euch liegt ein kleines Dorf, kaum mehr als ein paar Gebäude: drei schlichte Häuser und ein düsterer
        Höhleneingang, der euch misstrauisch mustert.</p>
        <h2>Steckbrief</h2>
        <p>Seid gegrüßt, tapfere Abenteurer! Willkommen im Dorf Sternenblick. Seit geraumer Zeit leiden wir unter den
        Machenschaften einer blutrünstigen Bande, die sich in der Höhle südlich des Dorfes eingenistet hat.</p>
      </article>
      <button class="to-top">{icon('arrowUp')}</button>
    </section>
    <aside class="sidebar">
      <div class="card">
        <span class="label">Aktive Szene</span>
        <h3>Default</h3>
        <p class="desc">A silent little Village</p>
        <div class="facts">
          <div class="fact"><span class="label">Enemies</span><span>–</span></div>
          <div class="fact"><span class="label">Loot</span><span>–</span></div>
        </div>
      </div>
      <div class="card">
        <div class="section-head"><span class="label">Kampfszenen</span><span class="label">25</span></div>
        <div class="grid5">{tiles(25, numbered=False)}</div>
      </div>
    </aside>
  </div>
  <footer class="bottombar">
    <div class="music">
      <button class="play">{icon('play')}</button>
      <div class="track"><span class="label">Musik</span><span class="name">From Past To Present</span></div>
    </div>
    <div class="sides"><span class="label">Szenen</span>{sidemaps}</div>
    <div></div>
  </footer>
</div></body></html>"""

# ---------------------------------------------------------------- Control-Bar (Wall + Ground)
CONTROL_CSS = """
.controls { position: fixed; left: 50%; bottom: var(--space-5); transform: translateX(-50%);
  display: flex; align-items: center; gap: var(--space-5); padding: var(--space-2);
  background: var(--dark); border-radius: var(--radius-xl); z-index: 10; }
.segmented { display: flex; gap: var(--space-1); }
.seg { min-width: 112px; height: var(--control-md); padding: 0 var(--space-4); border: none;
  border-radius: var(--radius-md); background: var(--secondary); color: var(--text);
  font: 600 var(--font-sm)/20px var(--font); letter-spacing: .08em; }
.seg.active { background: var(--primary); color: var(--on-primary); }
.ctl-label { padding-left: var(--space-3); }
.slider { display: flex; align-items: center; gap: var(--space-3); padding-right: var(--space-3); }
.rail { position: relative; width: 200px; height: 4px; border-radius: var(--radius-pill); background: var(--secondary); }
.rail .fill { position: absolute; inset: 0 auto 0 0; width: 40%; border-radius: inherit; background: var(--primary); }
.rail .thumb { position: absolute; left: 40%; top: 50%; width: 16px; height: 16px; transform: translate(-50%, -50%);
  border-radius: 50%; background: var(--text); }
.value { min-width: 3ch; font-size: var(--font-sm); line-height: 20px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
"""


def segmented(labels, active):
    return '<div class="segmented">' + ''.join(
        f'<button class="seg{" active" if i == active else ""}">{l}</button>' for i, l in enumerate(labels)) + '</div>'


# ---------------------------------------------------------------- Wall
wall_css = BASE_CSS + TILE_CSS + CONTROL_CSS + """
body { background: var(--secondary); }
.bg { position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: fixed; left: 50%; top: var(--space-7); transform: translateX(-50%);
  width: min(1440px, 100vw - 2 * var(--space-8), (100vh - var(--space-7) - 104px - 2 * var(--space-6) - 32px - var(--space-5) - 4 * var(--space-3)) * 16 / 9 + 4 * var(--space-3) + 2 * var(--space-6)); padding: var(--space-6); background: var(--background); border-radius: var(--radius-lg); }
.overlay-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--space-5); }
.overlay-head h2 { font-size: var(--font-xl); line-height: 32px; font-weight: 600; }
.wall-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3); }
.wall-grid .tile { border-radius: var(--radius-md); }
.badge { position: absolute; top: var(--space-2); left: var(--space-2); min-width: 32px; height: 32px; padding: 0 var(--space-2);
  display: grid; place-items: center; border-radius: var(--radius-pill); background: #5a5a5a; color: white;
  font-size: var(--font-md); font-weight: 700; font-variant-numeric: tabular-nums; }
"""

wall_html = HEAD.format(title='Wall Mockup', css=wall_css) + f"""
<img class="bg" src="{ASSET}/images/wall_screen/fight.jpg" alt="">
<div class="overlay">
  <div class="overlay-head"><h2>Kampfschauplätze</h2><span class="label">25 Räume</span></div>
  <div class="wall-grid">{tiles(25, numbered=True, active=7)}</div>
</div>
<div class="controls">{segmented(['BATTLE', 'WORLD', 'OFF'], 0)}</div>
</body></html>"""

# ---------------------------------------------------------------- Ground
ground_css = BASE_CSS + CONTROL_CSS + """
body { background: var(--background); }
.bg { position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.grid { position: fixed; inset: 0; pointer-events: none;
  background-image: linear-gradient(to right, black 2px, transparent 2px), linear-gradient(to bottom, black 2px, transparent 2px);
  background-size: 140px 140px; background-position: -1px -1px; }
"""

ground_html = HEAD.format(title='Ground Mockup', css=ground_css) + f"""
<img class="bg" src="{ASSET}/images/ground_screen/battle_7.jpg" alt="">
<div class="grid"></div>
<div class="controls">
  <span class="label ctl-label">Raster</span>
  {segmented(['BLACK', 'WHITE', 'OFF'], 0)}
  <div class="slider"><span class="label">Zelle</span><div class="rail"><div class="fill"></div><div class="thumb"></div></div><span class="value">140</span></div>
</div>
</body></html>"""

dialog_html = admin_html.replace('</body>', f'''<div class="dlg-layer"><div class="dlg">
  <img src="{ASSET}/images/wall_screen/tavern.jpg" alt="">
  <div class="dlg-body"><span class="label">Szene wechseln</span><h3>Tavern</h3><p>Zum Verzauberten Krug</p></div>
  <div class="dlg-actions"><button class="btn decline">Decline</button><button class="btn confirm">Confirm</button></div>
</div></div></body>''')

wall_world_html = HEAD.format(title='Wall World Mockup', css=wall_css + """
.world { width: 100%; aspect-ratio: 16 / 9; object-fit: contain; display: block; border-radius: var(--radius-md); }
""") + f"""
<img class="bg" src="{ASSET}/images/wall_screen/fight.jpg" alt="">
<div class="overlay">
  <div class="overlay-head"><h2>Weltkarte</h2></div>
  <img class="world" src="{ASSET}/images/ground_screen/mapOverview.jpg" alt="">
</div>
<div class="controls">{segmented(['BATTLE', 'WORLD', 'OFF'], 1)}</div>
</body></html>"""

for name, html in [('admin', admin_html), ('admin-dialog', dialog_html), ('wall', wall_html), ('wall-world', wall_world_html), ('ground', ground_html)]:
    (OUT / f'{name}.html').write_text(html)
print('ok')
