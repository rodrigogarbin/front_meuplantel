import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { initTheme } from './lib/theme'
import './index.css'

// Inicializa o tema antes de renderizar
initTheme()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
