import { useEffect, useState } from 'react'

/* Lecture à voix haute : titre dans sa langue, texte en français */
export function useLecture() {
  const dispo = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [enCours, setEnCours] = useState(null)

  useEffect(() => () => dispo && window.speechSynthesis.cancel(), [dispo])

  const lire = (article, simple) => {
    if (!dispo) return
    const synth = window.speechSynthesis
    synth.cancel()
    if (enCours === article.id) {
      setEnCours(null)
      return
    }
    const titre = new SpeechSynthesisUtterance(article.titre)
    titre.lang = article.langueTitre === 'en' ? 'en-US' : 'fr-FR'
    const corps = new SpeechSynthesisUtterance(simple && article.simple ? article.simple : article.resume)
    corps.lang = 'fr-FR'
    corps.onend = () => setEnCours((id) => (id === article.id ? null : id))
    corps.onerror = corps.onend
    setEnCours(article.id)
    synth.speak(titre)
    synth.speak(corps)
  }

  return { dispo, enCours, lire }
}
