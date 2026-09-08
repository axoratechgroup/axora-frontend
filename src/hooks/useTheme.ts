import { useContext } from 'react'
import { ThemeContext, type Theme, type ThemeContextType } from '../context/themeContext.ts'

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    let currentTheme: Theme = 'dark'
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') {
        currentTheme = saved
      }
    } catch {
      // Ignorar errores en entornos de prueba
    }

    return {
      theme: currentTheme,
      setTheme: (t: Theme) => {
        document.documentElement.setAttribute('data-theme', t)
        try {
          localStorage.setItem('theme', t)
        } catch {
          // Ignorar
        }
      },
      toggleTheme: () => {
        const next: Theme = currentTheme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        try {
          localStorage.setItem('theme', next)
        } catch {
          // Ignorar
        }
      },
    }
  }

  return context
}
