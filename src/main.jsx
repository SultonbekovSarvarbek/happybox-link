import React from 'react'
import ReactDOM from 'react-dom/client'
import { analytics } from './lib/analytics'
import App from './App.jsx'
import AppV2 from './v2/AppV2.jsx'
import './index.css'

analytics.init()

const useV2 = new URLSearchParams(window.location.search).get('v') === '2'
const Root = useV2 ? AppV2 : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
