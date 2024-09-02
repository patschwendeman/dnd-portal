import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { AdminScreen } from "../sceens/admin/AdminScreen"
import './App.css'

function App() {
  return (
    <>
      <Router>        
          <div className="app">
          <Routes>
          <Route path="/" element={ <AdminScreen /> } />
          </Routes>
          </div>

      </Router>
    </>
  );
}

export default App
