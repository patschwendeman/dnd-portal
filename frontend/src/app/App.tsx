import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { GameTableProvider } from '../realtime/GameTableProvider'
import { AdminScreen } from '../screens/AdminScreen'
import { GroundScreen } from '../screens/GroundScreen'
import { PlayerScreen } from '../screens/PlayerScreen'
import { WallScreen } from '../screens/WallScreen'
import { appTheme } from '../style/appTheme'

// The Player Screen is not connected to the game table yet: its theme only applies to this device
const PLAYER_THEME_KEY = 'isDarkTheme'

function App() {
  const [isDarkPlayerTheme, setIsDarkPlayerTheme] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem(PLAYER_THEME_KEY)
    return savedTheme === null ? true : JSON.parse(savedTheme)
  })

  useEffect(() => {
    localStorage.setItem(PLAYER_THEME_KEY, JSON.stringify(isDarkPlayerTheme))
  }, [isDarkPlayerTheme])

  const togglePlayerTheme = () => {
    setIsDarkPlayerTheme(!isDarkPlayerTheme)
  }

  return (
    <Router>
      <div className='app'>
        <Routes>
          <Route path='/' element={
            <ThemeProvider theme={appTheme(isDarkPlayerTheme ? 'dark' : 'tavern')}>
              <PlayerScreen toggleTheme={togglePlayerTheme} />
            </ThemeProvider>
          } />
          <Route path='/wall' element={ <GameTableProvider screen='wall'><WallScreen /></GameTableProvider> } />
          <Route path='/ground' element={ <GameTableProvider screen='ground'><GroundScreen /></GameTableProvider> } />
          <Route path='/admin' element={ <GameTableProvider screen='admin'><AdminScreen /></GameTableProvider> } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
