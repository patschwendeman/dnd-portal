# DND-10: Musik spielt die Playlist der aktiven Szene durchgehend

**Typ:** fix
**Status:** Freigegeben

## Kontext & Ziel

Die Hintergrundmusik im Admin Screen soll zufällige Tracks aus der Playlist der aktiven Szene spielen
(`docs/screens.md`, Admin „Musik“). Tatsächlich spielt sie nach einem Szenenwechsel teils die Musik der alten Szene
weiter, zeigt in der Bottom-Bar oft einen anderen Titel an als den, der läuft, und bleibt nach einem Trackende stehen –
bei Szenen mit nur einem Track immer. Das stört die Atmosphäre am Spieltisch und zwingt den Spielleiter, die Musik
von Hand neu zu starten. Ziel: Die Musik läuft ohne Unterbrechung, passt zur aktiven Szene, und der angezeigte Titel
ist der gespielte.

## Fehlerbild

**Reproduktion**
1. Admin Screen öffnen, Musik mit Play starten.
2. a) Eine andere Szene wählen und bestätigen. b) Den Titel in der Bottom-Bar mit dem hörbaren Track vergleichen.
   c) Szene mit nur einem Track wählen (Seed: eine Szene mit 1 Track) und den Track zu Ende laufen lassen.

**Ist:**
- a) Der neue Track wird aus der Playlist der *vorherigen* Szene gezogen. Ist er gleich dem laufenden, läuft die alte
  Musik weiter.
- b) Angezeigt wird ein anderer Titel als der gespielte (bei Playlists mit mehr als einem Track).
- c) Nach dem Ende ist Stille, der Button steht weiter auf „Pause“. Bei längeren Playlists passiert das gelegentlich
  (≈ 1/(n−1)).

**Soll:** siehe E1–E3 und AK1–AK4.

## Ursache

- [AdminScreen.tsx](../../frontend/src/screens/AdminScreen.tsx) `handleActiveScene`: `getRandomTrack(musicPlaylist, …)`
  mit der alten Playlist, `setMusicPlaylist(currentPlayList)` erst danach. Gleicher Track → kein State-Wechsel →
  Effect auf `activeMusicSRC` läuft nicht.
- [utils.ts](../../frontend/src/utils/utils.ts) `handleAudio`: würfelt beim Aufruf selbst einen neuen Track, statt
  `activeMusicSRC` zu spielen → angezeigt ≠ gespielt.
- `handleAudio` → `onended`: Closure mit Playlist und `lastTrack` vom Startzeitpunkt; das Ende setzt nur
  `activeMusicSRC`. Ist der gezogene Track gleich dem aktuellen (bei einem Track immer), ändert sich der State nicht
  und nichts wird mehr abgespielt. `lastTrack` wird außerdem nur hier gesetzt.
- Der Ablauf hängt an einer Kette aus State-Updates und einem Effect mit unvollständigen Abhängigkeiten; ein eigenes
  Objekt, das den Player-Zustand hält, beseitigt die Ursache statt einzelner Symptome.

## Scope / Non-Goals

**Im Scope**
- Musik-Logik des Admin Screens: Szenenwechsel, Trackende, Play/Pause, angezeigter Titel.
- Ein testbarer Player (reine TS-Klasse ohne React) plus dünner Hook für den Admin Screen.
- Regressionstests (vitest) für die drei Fehlerbilder.
- Doku: `docs/screens.md` (Admin „Musik“), `docs/known-issues.md`, `frontend/CLAUDE.md` (Struktur `src/utils`).

**Nicht im Scope**
- Soundeffekte (`playAtmoSounds`, `TopBar`).
- Lautstärke (bleibt 0.1), Optik der Bottom-Bar, Überblenden.
- Backend, Seed (Musiknamen-Known-Issue bleibt).
- Fehlerbehandlung allgemein (eigener Task); hier nur: Fehler von `audio.play()` werden nicht mehr als unhandled
  rejection geworfen, sondern Play-Zustand bleibt „pausiert“ (siehe E4).
- `eslint-plugin-react-hooks` aktivieren.

## Entscheidungen

### E1: Szenenwechsel startet immer einen neuen Track
- **Entscheidung:** Nach dem Laden der aktiven Szene wird ihre Playlist übernommen und sofort ein zufälliger Track
  daraus gewählt, der nicht der gerade geladene ist (sofern die Playlist mehr als einen Track hat). Lief die Musik,
  spielt der neue Track direkt; war sie pausiert, bleibt sie pausiert und der neue Titel wird angezeigt.
- **Verworfene Alternative:** Laufenden Track behalten, wenn er auch in der neuen Playlist ist.
- **Begründung:** Szenenwechsel soll hörbar sein; einfache, vorhersehbare Regel.

### E2: Trackende – nächster Track, bei einem Track Wiederholung
- **Entscheidung:** Nach dem Ende eines Tracks startet automatisch ein zufälliger anderer Track derselben (aktuellen)
  Playlist. Hat die Playlist genau einen Track, startet dieser von vorne. Die Musik läuft, bis der Spielleiter
  pausiert.
- **Verworfene Alternative:** Bei einem Track nach dem Ende stoppen.

### E3: Angezeigter Titel = gespielter Track
- **Entscheidung:** Es gibt genau eine Quelle für den aktuellen Track (im Player); die Bottom-Bar zeigt diesen an.
  Zufallsauswahl passiert an genau einer Stelle.

### E4: Aufbau – Player-Klasse + Hook
- **Entscheidung:** `src/utils/musicPlayer.ts` (o. ä.) mit einer Klasse ohne React-Abhängigkeit, die ein einziges
  Audio-Element hält. Abhängigkeiten werden injiziert (Audio-Fabrik, Zufallsfunktion), damit vitest ohne Browser
  testen kann. Schnittstelle sinngemäß: `setPlaylist(tracks)`, `play()`, `pause()`, `toggle()`, aktueller Track und
  Play-Zustand plus Change-Listener. Ein Hook (z. B. `useMusicPlayer`) bindet sie an den Admin Screen und räumt beim
  Unmount auf (Audio pausieren, Listener lösen).
  Leere Playlist (im Seed nicht vorhanden): Musik pausiert, kein Titel. Schlägt `audio.play()` fehl (z. B.
  Autoplay-Sperre), bleibt der Zustand „pausiert“ statt einer unhandled rejection.
- **Begründung:** Beseitigt die Closure- und State-Ketten-Ursache; Verhalten wird unit-testbar.
- **Folge:** `handleAudio`, `handleAudioControl`, die States `activeMusicSRC`, `musicPlaylist`, `lastTrack`, `audio`
  im Admin Screen und der Effect auf `activeMusicSRC` entfallen. `getRandomTrack` bleibt (oder geht in der Klasse auf);
  der bestehende Test dazu bleibt inhaltlich erhalten.

## Subtasks

### Frontend
- [ ] Regressionstests zuerst (vitest, `frontend/__tests__/unit/musicPlayer.spec.ts`) mit Fake-Audio
      (Objekt mit `play`/`pause`/`src`/`currentTime`/`loop`/`volume`/`onended`) und deterministischer Zufallsfunktion:
  - Szenenwechsel: nach `setPlaylist(neu)` ist der aktuelle Track aus `neu`, ≠ vorheriger; Audio-Quelle = aktueller
    Track; spielte vorher → spielt weiter, pausiert → bleibt pausiert.
  - Trackende bei mehreren Tracks: nach `onended` spielt ein anderer Track derselben Playlist; aktueller Track =
    Audio-Quelle; bei einer zwischendurch gewechselten Playlist kommt der Track aus der neuen.
  - Trackende bei einem Track: derselbe Track spielt erneut (kein Stillstand).
  - `play()` schlägt fehl → Zustand pausiert, kein Fehler nach außen.
  - Leere Playlist → pausiert, kein Track.
  Vor dem Fix rot (Modul fehlt bzw. altes Verhalten), danach grün.
- [ ] Player-Klasse nach E1–E4 umsetzen (Lautstärke 0.1, `loop = false`, ein Audio-Element).
- [ ] Hook für React (State-Spiegel: aktueller Track, spielt ja/nein; Cleanup beim Unmount).
- [ ] `AdminScreen`: Hook verwenden; beim Laden der aktiven Szene `setPlaylist(scene.music.map(m => m.source))`;
      Play/Pause-Button → `toggle()`; `TrackName` aus dem Hook. Bis die erste Szene geladen ist, ist `defaultMusic`
      die Playlist (wie heute). Alte States, Effect und Aufrufe entfernen.
- [ ] `utils.ts`: `handleAudio` und `handleAudioControl` entfernen; `getRandomTrack` nur behalten, wenn noch genutzt
      (sonst samt Test in die Player-Tests überführen).

### Doku
- [ ] `docs/screens.md` (Admin „Musik“, Ist): Verhalten nach E1–E3.
- [ ] `docs/known-issues.md`: Eintrag „Musik: Zufalls-Track-Auswahl nutzt teils die alte Playlist …“ entfernen.
- [ ] `frontend/CLAUDE.md`: Struktur (`src/utils/utils.ts` Audio-Beschreibung, neues Player-Modul/Hook).

## Akzeptanzkriterien

### AK1: Szenenwechsel
- **Given** Musik läuft im Admin Screen
- **When** der Spielleiter eine andere Szene wählt und bestätigt
- **Then** nach dem Laden spielt ein Track aus der Playlist der neuen Szene, und die Bottom-Bar zeigt genau diesen
  Titel; war die Musik pausiert, bleibt sie pausiert und zeigt den neuen Titel.

### AK2: Angezeigt = gespielt
- **Given** eine Szene mit mehreren Tracks
- **When** ein Track startet (Szenenwechsel, Trackende, Play)
- **Then** der Titel in der Bottom-Bar entspricht immer der Quelle des spielenden Audio-Elements.

### AK3: Durchgehende Wiedergabe
- **Given** Musik läuft
- **When** ein Track endet
- **Then** startet ohne Eingriff ein anderer Track derselben Playlist; bei einer Playlist mit einem Track derselbe
  Track von vorne. Die Musik stoppt nur durch Pause.

### AK4: Play/Pause unverändert
- Play/Pause-Button, Icon, Farbe und Lautstärke verhalten sich wie bisher; es gibt immer höchstens ein spielendes
  Musik-Audio (keine Überlagerung nach mehreren Szenenwechseln).

### AK5: Regressionstest
- Die Tests aus „Frontend“ bilden die drei Fehlerbilder ab, schlagen vor dem Fix fehl und danach nicht.

## Teststrategie / Verifikation

**Automatisch**
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test:unit` (inkl. neuer Tests), `npm run build`.

**Manuell**
1. Stack starten, Admin öffnen, Play.
2. AK1/AK2: mehrere Szenenwechsel (auch zwischen Kampf- und Nicht-Kampfszene), angezeigten Titel mit dem
   Audio-Element vergleichen (DevTools: `src` des Audio bzw. hörbar).
3. AK3: Szene mit einem Track wählen und zum Ende springen (DevTools: `currentTime` nahe `duration` setzen) –
   Track startet erneut; dasselbe bei einer Szene mit mehreren Tracks – anderer Track startet.
4. AK4: Pause während eines Szenenwechsels, danach Play; nur ein Track hörbar.

## Offene Fragen
- keine

## Review
