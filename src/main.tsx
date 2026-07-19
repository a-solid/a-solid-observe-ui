import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fonts (bundled via @fontsource) — match the demo's Fira Sans / Fira Code.
import '@fontsource/fira-sans/300.css'
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-sans/700.css'
import '@fontsource-variable/fira-code'

// Global styles
import './styles/tokens.css'
import './styles/base.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
