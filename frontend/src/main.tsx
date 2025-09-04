import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { Home } from './pages/Home'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
)
