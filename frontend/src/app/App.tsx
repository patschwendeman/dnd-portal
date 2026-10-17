import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { ActiveAdventureContext, ActiveSceneContext } from '../context/context'
import { AdminScreen } from '../screens/AdminScreen'
import { GroundScreen } from '../screens/GroundScreen'
import { PlayerScreen } from '../screens/PlayerScreen'
import { WallScreen } from '../screens/WallScreen'
import { darkTheme } from '../style/darkTheme'
import { tavernTheme } from '../style/tavernTheme'
import { tokens } from '../style/tokens'
import { parseStoredId } from '../utils/storedId'

const ACTIVE_ADVENTURE_KEY = 'activeAdventureId'
const ACTIVE_SCENE_KEY = 'activeSceneId'

// null removes the key, so other windows receive it as "nothing selected"
const storeId = (key: string, id: number | null) => {
  if (id === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, id.toString())
  }
}

function App() {
  const [activeAdventureId, setActiveAdventureId] = useState<number | null>(
    () => parseStoredId(localStorage.getItem(ACTIVE_ADVENTURE_KEY))
  )
  const [activeSceneId, setActiveSceneId] = useState<number | null>(
    () => parseStoredId(localStorage.getItem(ACTIVE_SCENE_KEY))
  )
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('isDarkTheme')
    return savedTheme === null ? true : JSON.parse(savedTheme)
  })

  useEffect(() => {
    storeId(ACTIVE_ADVENTURE_KEY, activeAdventureId)
  }, [activeAdventureId])

  useEffect(() => {
    storeId(ACTIVE_SCENE_KEY, activeSceneId)
  }, [activeSceneId])

  useEffect(() => {
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme))
  }, [isDarkTheme])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ACTIVE_ADVENTURE_KEY) {
        setActiveAdventureId(parseStoredId(event.newValue))
      }
      if (event.key === ACTIVE_SCENE_KEY) {
        setActiveSceneId(parseStoredId(event.newValue))
      }
      if (event.key === 'isDarkTheme') {
        const newTheme = event.newValue ? JSON.parse(event.newValue) : true
        setIsDarkTheme(newTheme)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <ThemeProvider theme={{ ...tokens, colors: (isDarkTheme ? darkTheme : tavernTheme).colors }}>
      <ActiveAdventureContext.Provider value={{ activeAdventureId, setActiveAdventureId }}>
        <ActiveSceneContext.Provider value={{ activeSceneId, setActiveSceneId }}>
          <Router>
            <div className='app'>
              <Routes>
                <Route path='/' element={ <PlayerScreen toggleTheme={toggleTheme} /> } />
                <Route path='/wall' element={ <WallScreen /> } />
                <Route path='/ground' element={ <GroundScreen /> } />
                <Route path='/admin'  element={ <AdminScreen toggleTheme={toggleTheme} /> } />
              </Routes>
            </div>
          </Router>
        </ActiveSceneContext.Provider>
      </ActiveAdventureContext.Provider>
    </ThemeProvider>
  )
}

export default App
