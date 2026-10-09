import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { ActiveSceneContext } from '../context/context'
import { AdminScreen } from '../screens/AdminScreen'
import { GroundScreen } from '../screens/GroundScreen'
import { PlayerScreen } from '../screens/PlayerScreen'
import { WallScreen } from '../screens/WallScreen'
import { darkTheme } from '../style/darkTheme'
import { tavernTheme } from '../style/tavernTheme'
import { tokens } from '../style/tokens'

function App() {
  const [activeSceneId, setActiveSceneId] = useState<number>(() => {
    const savedScene = localStorage.getItem('activeSceneId')
    return savedScene ? parseInt(savedScene, 10) : 1 
  })
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('isDarkTheme')
    return savedTheme === null ? true : JSON.parse(savedTheme)
  })

  useEffect(() => {
    localStorage.setItem('activeSceneId', activeSceneId.toString())
  }, [activeSceneId])

  useEffect(() => {
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme))
  }, [isDarkTheme])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'activeSceneId') {
        const newActiveSceneId = event.newValue ? parseInt(event.newValue, 10) : 1
        setActiveSceneId(newActiveSceneId)
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
    </ThemeProvider>
  )
}

export default App