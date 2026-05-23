import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

// ─── Palette : mode sombre (actuel) ──────────────────────────────────────────
const DARK = {
  bg:       '#0A0A0F',
  bg2:      '#0F0F1A',
  surface:  'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.06)',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.12)',
  text:     'rgba(255,255,255,0.92)',
  text2:    'rgba(255,255,255,0.50)',
  text3:    'rgba(255,255,255,0.28)',
  accent:   '#FF2D20',
  shadow:   '0 8px 32px rgba(0,0,0,0.4)',
}

// ─── Palette : mode clair ────────────────────────────────────────────────────
const LIGHT = {
  bg:       '#FAFAFA',
  bg2:      '#FFFFFF',
  surface:  'rgba(0,0,0,0.025)',
  surface2: 'rgba(0,0,0,0.05)',
  border:   'rgba(0,0,0,0.08)',
  border2:  'rgba(0,0,0,0.12)',
  text:     '#18181B',
  text2:    '#52525B',
  text3:    '#A1A1AA',
  accent:   '#FF2D20',
  shadow:   '0 8px 32px rgba(0,0,0,0.08)',
}

export function ThemeProvider({ children }) {
  // Initial : localStorage > préférence OS > dark par défaut
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    if (typeof window !== 'undefined'
        && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
    return 'dark'
  })

  // Applique sur <html> + persiste
  useEffect(() => {
    document.documentElement.dataset.theme = mode
    localStorage.setItem('theme', mode)
  }, [mode])

  const toggle = () => setMode(m => (m === 'dark' ? 'light' : 'dark'))
  const theme  = mode === 'dark' ? DARK : LIGHT

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
