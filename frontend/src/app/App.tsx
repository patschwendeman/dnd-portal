import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { ActiveSceneContext } from '../context/context'
import { AdminScreen } from '../sceens/AdminScreen'
import { GroundScreen } from '../sceens/GroundScreen'
import { WallScreen } from '../sceens/WallScreen'

function App() {
  const [activeSceneId, setActiveSceneId] = useState<number>(() => {
    const savedScene = localStorage.getItem('activeSceneId')
    return savedScene ? parseInt(savedScene, 10) : 1 
  })

  useEffect(() => {
    localStorage.setItem('activeSceneId', activeSceneId.toString())
  }, [activeSceneId])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'activeSceneId') {
        const newactiveSceneId = event.newValue ? parseInt(event.newValue, 10) : 1
        setActiveSceneId(newactiveSceneId)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <ActiveSceneContext.Provider value={{ activeSceneId, setActiveSceneId }}>
      <Router>      
        <div className='app'>
          <Routes>
            <Route path='/' element={ <AdminScreen /> } />
            <Route path='/wall' element={ <WallScreen /> } />
            <Route path='/ground' element={ <GroundScreen /> } />
          </Routes>
        </div>
      </Router>
    </ActiveSceneContext.Provider>
  )
}

export default App
