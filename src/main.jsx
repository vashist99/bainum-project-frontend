import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ViewAsProvider } from './contexts/ViewAsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ViewAsProvider>
          <App />
          <Toaster />
        </ViewAsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
