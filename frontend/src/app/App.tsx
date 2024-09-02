import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AdminScreen } from "../sceens/AdminScreen"
import { WallScreen } from '../sceens/WallScreen';
import { GroundScreen } from '../sceens/GroundScreen';

function App() {
  return (
    <Router>        
          <div className="app">
          <Routes>
          <Route path="/" element={ <AdminScreen /> } />
          <Route path="/wall" element={ <WallScreen /> } />
          <Route path="/ground" element={ <GroundScreen /> } />
          </Routes>
          </div>

      </Router>
  );
}

export default App
