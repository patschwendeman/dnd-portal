import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { AdminScreen } from '../screens/AdminScreen'
import { GroundScreen } from '../screens/GroundScreen'
import { PlayerScreen } from '../screens/PlayerScreen'
import { WallScreen } from '../screens/WallScreen'
import { darkTheme } from '../style/darkTheme'
import { lightTheme } from '../style/lightTheme'

function App() {
  const [activeSceneId, setActiveSceneId] = useState<number>(() => {
    const savedScene = localStorage.getItem('activeSceneId')
    return savedScene ? parseInt(savedScene, 10) : 1 
  })
  const [activeMapId, setActiveMapId] = useState<number>(() => {
    const savedMap = localStorage.getItem('activeMapId')
    return savedMap ? parseInt(savedMap, 10) : 0 
  })
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('isDarkTheme')
    return savedTheme === null ? true : JSON.parse(savedTheme)
  })

  useEffect(() => {
    localStorage.setItem('activeSceneId', activeSceneId.toString())
  }, [activeSceneId])

  useEffect(() => {
    localStorage.setItem('activeMapId', activeMapId.toString())
  }, [activeMapId])

  useEffect(() => {
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme))
  }, [isDarkTheme])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'activeSceneId') {
        const newActiveSceneId = event.newValue ? parseInt(event.newValue, 10) : 1
        setActiveSceneId(newActiveSceneId)
      }
      if (event.key === 'activeMapId') {
        const newActiveMapId = event.newValue ? parseInt(event.newValue, 10) : 0
        setActiveMapId(newActiveMapId)
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
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <ActiveSceneContext.Provider value={{ activeSceneId, setActiveSceneId }}>
        <ActiveMapContext.Provider value={{ activeMapId, setActiveMapId }}>
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
        </ActiveMapContext.Provider>
      </ActiveSceneContext.Provider>
    </ThemeProvider>
  )
}

export default App