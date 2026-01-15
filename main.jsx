import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * We have removed the import for './index.css' because 
 * styling is handled by the Tailwind CDN in your index.html.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
