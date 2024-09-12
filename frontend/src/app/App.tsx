import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { AdminScreen } from '../sceens/AdminScreen'
import { GroundScreen } from '../sceens/GroundScreen'
import { WallScreen } from '../sceens/WallScreen'

function App() {
  const [activeSceneId, setActiveSceneId] = useState<number>(() => {
    const savedScene = localStorage.getItem('activeSceneId')
    return savedScene ? parseInt(savedScene, 10) : 1 
  })
  const [activeMapId, setActiveMapId] = useState<number>(() => {
    const savedMap = localStorage.getItem('activeMapId')
    return savedMap ? parseInt(savedMap, 10) : 0 
  })

  useEffect(() => {
    localStorage.setItem('activeSceneId', activeSceneId.toString())
  }, [activeSceneId])

  useEffect(() => {
    localStorage.setItem('activeMapId', activeMapId.toString())
  }, [activeMapId])

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
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <ActiveSceneContext.Provider value={{ activeSceneId, setActiveSceneId }}>
      <ActiveMapContext.Provider value={{ activeMapId, setActiveMapId }}>
        <Router>      
          <div className='app'>
            <Routes>
              <Route path='/' element={ <AdminScreen /> } />
              <Route path='/wall' element={ <WallScreen /> } />
              <Route path='/ground' element={ <GroundScreen /> } />
            </Routes>
          </div>
        </Router>
      </ActiveMapContext.Provider>
    </ActiveSceneContext.Provider>
  )
}

export default App