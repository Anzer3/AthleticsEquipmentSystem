// src/App.jsx

import { useState } from 'react'
import { Routes, Route } from 'react-router-dom' 
import './App.css'

import Navbar from "./components/Navbar";

// moje podstránky
import Homepage from './pages/Homepage'
import DataLoadPage from './pages/DataLoadPage';
import Login from './pages/Login';

// ochrana route
import RequireAuth from './components/RequireAuth.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/dataload" element={<DataLoadPage />} />
        <Route path="/" element={<RequireAuth><Homepage /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}

export default App
