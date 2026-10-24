# DND-35: Wall-Overlay vom Admin steuern

**Typ:** feat
**Status:** Entwurf

## Kontext & Ziel

Ob die Wall die Weltkarte zeigt (WORLD) oder kein Overlay (OFF), stellt man heute nur an der Wall selbst ein: über
die Steuerleiste, die beim Hover am unteren Rand erscheint (`worldMapVisibility` in `WallScreen.tsx`, je Wall
lokal). Der Spielleiter sitzt aber am Admin. Dieser Task legt den Overlay-Zustand auf den Server (Spieltisch) und
ergänzt das Dashboard aus DND-33 um ein Panel „Wall-Overlay“. Am Spieltisch blendet der Spielleiter die Weltkarte vom
Admin aus ein und aus, alle Walls folgen.

## Scope / Non-Goals

**Im Scope**
- Overlay-Zustand (`world` / `off`) als Teil des Spieltisch-Zustands, Push an alle Screens.
- Panel „Wall-Overlay“ im Admin-Dashboard zum Umschalten.
- Steuerleiste der Wall (WORLD / OFF) schreibt ebenfalls über den Server.

**Nicht im Scope**
- Neue Overlays (szenen- oder gebietsspezifische Übersichtskarte, Kampf-Ansichten).
- Änderungen am Button AUDIO der Wall.
- Overlays auf dem Ground.

## Entscheidungen

### E1: Overlay im Spieltisch-Zustand
- **Entscheidung:** Neues Feld `wall_overlay` (`"world" | "off"`, Default `"off"`) in `GameTableState` und
  `GameTableUpdate`; geändert per `PATCH /table {"wall_overlay": …}`, danach wie gewohnt `state`-Push an alle. Die Wall
  zeigt nur, was der Server schickt (keine lokale Vorwegnahme), auch ihre eigene Steuerleiste schreibt per PATCH.
- **Begründung:** Gleiches Muster wie Theme und aktive Szene.

### E2: Szenenwechsel schließt die Weltkarte
- **Entscheidung:** Ändert sich die aktive Szene (oder das Abenteuer), setzt der Server `wall_overlay` auf `"off"`,
  im selben Schreibzugriff, sodass nur ein `state`-Push folgt. Die bisherige lokale Logik in der Wall entfällt.
- **Begründung:** Bisheriges Verhalten bleibt, aber für alle Walls einheitlich.

### E3: Panel „Wall-Overlay“
- **Entscheidung:** Panel mit Label „Wall-Overlay“ und zwei Umschalt-Buttons „Weltkarte“ und „Aus“; der aktive Zustand
  ist hervorgehoben (`aria-pressed`). Fehler beim Speichern zeigen die Speicherfehler-Leiste.

## Subtasks

### Vertrag
- [ ] `wall_overlay` in `GameTableState`/`GameTableUpdate` (E1); `openapi.json` und `schema.d.ts` neu erzeugen.

### Backend
- [ ] Spalte `game_table.wall_overlay` mit Migration (Default `off`) – oder flüchtig im Speicher, siehe offene Fragen.
- [ ] `PATCH /table` nimmt `wall_overlay` an; Szenen-/Abenteuerwechsel setzt `off` (E2).
- [ ] Tests: PATCH und Push; Reset beim Szenen- und Abenteuerwechsel; ungültiger Wert → 422.

### Frontend
- [ ] `GameTableProvider`/Context: `wall_overlay` bereitstellen.
- [ ] Wall: Overlay aus dem Spieltisch-Zustand, Steuerleiste schreibt per PATCH; lokalen Zustand entfernen.
- [ ] Admin: Panel „Wall-Overlay“ (E3).
- [ ] E2E: Weltkarte im Admin einblenden → Wall zeigt sie; Szenenwechsel blendet sie aus.

### Doku
- [ ] `docs/screens.md` (Admin, Wall), `docs/architecture.md` (Spieltisch-Zustand), `docs/domain.md`,
      `frontend/docs/design/` (Panel, Raster).

## Akzeptanzkriterien

### AK1: Weltkarte vom Admin
- **Given** Admin und zwei Walls sind geöffnet, kein Overlay ist sichtbar
- **When** der Spielleiter im Panel „Wall-Overlay“ auf „Weltkarte“ klickt
- **Then** zeigen beide Walls die Weltkarte, das Panel hebt „Weltkarte“ hervor
- **When** er auf „Aus“ klickt
- **Then** blenden beide Walls die Weltkarte aus

### AK2: Steuerleiste der Wall
- **Given** eine Wall zeigt kein Overlay
- **When** jemand an der Wall auf WORLD klickt
- **Then** zeigen alle Walls die Weltkarte, und das Admin-Panel hebt „Weltkarte“ hervor

### AK3: Szenenwechsel
- **Given** die Weltkarte ist sichtbar
- **When** der Spielleiter die Szene oder das Abenteuer wechselt
- **Then** ist die Weltkarte auf allen Walls ausgeblendet

### AK4: Fehler und Neustart
- **Given** das Speichern schlägt fehl
- **Then** ändert sich auf keiner Wall etwas, die Speicherfehler-Leiste erscheint
- **And** eine neu geöffnete Wall zeigt sofort den aktuellen Overlay-Zustand

## Teststrategie / Verifikation

**Automatisch**
- Backend: Tests wie in den Subtasks, ggf. Migrationstest; `ruff`, `mypy`, `pytest` grün.
- Frontend: BDD wie in den Subtasks; Lint, Typecheck, Build grün.

**Manuell**
1. Admin und zwei Walls (eine in einem anderen Browser) öffnen, Overlay vom Admin und von einer Wall umschalten
   (AK1, AK2).
2. Szene wechseln (AK3); Backend stoppen und umschalten; neue Wall öffnen (AK4).

## Offene Fragen
- Wird der Overlay-Zustand gespeichert (DB, übersteht API-Neustart) oder ist er flüchtig wie die Musik
  (nach Neustart `off`)?
- Größe und Position des Panels im Raster (z. B. 2x1 neben „Musik“ oder unter „Screens“).

## Review
