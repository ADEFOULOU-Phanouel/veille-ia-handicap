import { useEffect, useState } from 'react'

const CLE = 'prefs'
const media = (q) => typeof window !== 'undefined' && window.matchMedia?.(q).matches

function lire() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || {}
  } catch {
    return {}
  }
}

/* Réglages de lecture mémorisés sur l'appareil */
export function usePreferences() {
  const [prefs, setPrefs] = useState(() => {
    const p = lire()
    return {
      theme: p.theme === 'dark' || p.theme === 'light' ? p.theme : media('(prefers-color-scheme: dark)') ? 'dark' : 'light',
      contrast: !!p.contrast,
      dys: !!p.dys,
      calme: p.calme !== undefined ? !!p.calme : !!media('(prefers-reduced-motion: reduce)'),
      fav: p.fav && typeof p.fav === 'object' ? p.fav : {},
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(prefs))
    } catch {
      /* stockage indisponible : les réglages restent valables pour la visite */
    }
    const r = document.documentElement
    r.setAttribute('data-theme', prefs.contrast ? 'contrast' : prefs.theme)
    document.body.classList.toggle('dys', prefs.dys)
    document.body.classList.toggle('calme', prefs.calme)
  }, [prefs])

  const changer = (cle, valeur) => setPrefs((p) => ({ ...p, [cle]: valeur }))
  const basculerFavori = (id) =>
    setPrefs((p) => {
      const fav = { ...p.fav }
      if (fav[id]) delete fav[id]
      else fav[id] = 1
      return { ...p, fav }
    })

  return { prefs, changer, basculerFavori }
}
