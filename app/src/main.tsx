import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

// Luce che segue il puntatore sulle card: un solo ascoltatore per tutta l'app, il CSS fa il resto (--mx, --my).
addEventListener('pointermove', (e) => {
  const card = (e.target as Element | null)?.closest?.('.card') as HTMLElement | null
  if (!card) return
  const r = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${e.clientX - r.left}px`)
  card.style.setProperty('--my', `${e.clientY - r.top}px`)
}, { passive: true })

createRoot(document.getElementById('root')!).render(<App />)
