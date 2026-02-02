// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// Importujeme BrowserRouter, který poskytuje kontext
import { BrowserRouter } from 'react-router-dom'; 
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Tady obalíme celou aplikaci. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);