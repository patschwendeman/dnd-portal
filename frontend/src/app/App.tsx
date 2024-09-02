import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AdminScreen } from "../sceens/admin/AdminScreen"
import './App.css'
import { WallScreen } from '../sceens/wall/WallScreen';
import { GroundScreen } from '../sceens/ground/GroundScreen';

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
