import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import CrystalViewer from './pages/CrystalViewer.jsx'
import SymmetryDemo from './pages/SymmetryDemo.jsx'
import Quiz from './pages/Quiz.jsx'
import Library from './pages/Library.jsx'
import XRDAnalysis from './pages/XRDAnalysis.jsx'

function App() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <span>💎</span>
          晶体学教学平台
        </div>
        <div className="nav-links">
          <NavLink to="/" className="nav-link" end>
            晶体观察
          </NavLink>
          <NavLink to="/symmetry" className="nav-link">
            对称操作
          </NavLink>
          <NavLink to="/xrd" className="nav-link">
            XRD分析
          </NavLink>
          <NavLink to="/quiz" className="nav-link">
            题库练习
          </NavLink>
          <NavLink to="/library" className="nav-link">
            结构库
          </NavLink>
        </div>
      </nav>
      
      <Routes>
        <Route path="/" element={<CrystalViewer />} />
        <Route path="/symmetry" element={<SymmetryDemo />} />
        <Route path="/xrd" element={<XRDAnalysis />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </div>
  )
}

export default App
