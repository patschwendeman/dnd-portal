import { ReactElement, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { Theme } from '../models/models'
import GameTableProvider from '../realtime/GameTableProvider'
import AdminScreen from '../screens/AdminScreen'
import GroundScreen from '../screens/GroundScreen'
import PlayerScreen from '../screens/PlayerScreen'
import WallScreen from '../screens/WallScreen'
import {
  discardLegacyPlayerTheme, readThemeOverride, writeThemeOverride,
} from '../utils/playerTheme'

// The Player follows the theme of the game table unless the player chose another one on this device
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
      <PlayerScreen themeOverride={themeOverride} onChangeThemeOverride={changeThemeOverride} />
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
          <Route path="/" element={<PlayerRoute />} />
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
