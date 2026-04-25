import React from 'react'
import ReactDOM from 'react-dom/client'
import { analytics } from './lib/analytics'
import App from './App.jsx'
import './index.css'

analytics.init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
