import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AdminScreen } from "../sceens/AdminScreen"
import { WallScreen } from '../sceens/WallScreen';
import { GroundScreen } from '../sceens/GroundScreen';
import { ActiveSceneContext } from './context/context';

function App() {
  const [activeScene, setActiveScene] = useState<number>(() => {
    const savedScene = localStorage.getItem('activeScene');
    return savedScene ? parseInt(savedScene, 10) : 1; 
  });

  useEffect(() => {
    localStorage.setItem('activeScene', activeScene.toString());
  }, [activeScene]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'activeScene') {
        const newActiveScene = event.newValue ? parseInt(event.newValue, 10) : 1;
        setActiveScene(newActiveScene);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ActiveSceneContext.Provider value={{ activeScene, setActiveScene }}>
      <Router>      
        <div className="app">
          <Routes>
            <Route path="/" element={ <AdminScreen /> } />
            <Route path="/wall" element={ <WallScreen /> } />
            <Route path="/ground" element={ <GroundScreen /> } />
          </Routes>
        </div>
      </Router>
    </ActiveSceneContext.Provider>
  );
}

export default App;
