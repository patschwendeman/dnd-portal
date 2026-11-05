import { ReactElement, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { Theme } from '../models/models'
import GameTableProvider from '../realtime/GameTableProvider'
import AdminScreen from '../screens/AdminScreen'
import GroundScreen from '../screens/GroundScreen'
import { PlayerLayout } from '../screens/PlayerLayout'
import PlayerScreen from '../screens/PlayerScreen'
import PlayerSelectScreen from '../screens/PlayerSelectScreen'
import WallScreen from '../screens/WallScreen'
import {
  discardLegacyPlayerTheme, readThemeOverride, writeThemeOverride,
} from '../utils/playerTheme'

// The selection and the Player Screen follow the theme of the game table unless the player chose
// another one on this device. They share one connection, so switching between them does not
// reconnect.
function PlayerRoute(): ReactElement {
  const [themeOverride, setThemeOverride] = useState<Theme | null>(
    () => readThemeOverride(localStorage),
  )

  const changeThemeOverride = (override: Theme | null) => {
    writeThemeOverride(localStorage, override)
    setThemeOverride(override)
  }

  return (
    <GameTableProvider screen="player" themeOverride={themeOverride}>
      <PlayerLayout themeOverride={themeOverride} onChangeThemeOverride={changeThemeOverride} />
    </GameTableProvider>
  )
}

function App() {
  useEffect(() => {
    discardLegacyPlayerTheme(localStorage)
  }, [])

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route element={<PlayerRoute />}>
            <Route path="/" element={<PlayerSelectScreen />} />
            <Route path="/player/:id" element={<PlayerScreen />} />
          </Route>
          <Route
            path="/wall"
            element={<GameTableProvider screen="wall"><WallScreen /></GameTableProvider>}
          />
          <Route
            path="/ground"
            element={<GameTableProvider screen="ground"><GroundScreen /></GameTableProvider>}
          />
          <Route
            path="/admin"
            element={<GameTableProvider screen="admin"><AdminScreen /></GameTableProvider>}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
