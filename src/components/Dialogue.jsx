import { useEffect, useRef } from 'react'
import Icone from './Icones.jsx'

/*
 * Fenêtre par-dessus la page, basée sur <dialog> :
 * le navigateur gère le piège du focus, la touche Échap et le fond inactif.
 * variante "fenetre" = au centre ; variante "volet" = barre latérale à droite.
 */
export default function Dialogue({ ouvert, onFermer, titre, variante = 'fenetre', children }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      className={`dialogue ${variante}`}
      aria-labelledby="dialogue-titre"
      onClose={onFermer}
      onClick={(e) => e.target === ref.current && onFermer()} /* clic sur le fond */
    >
      <div className="dialogue-corps">
        <div className="dialogue-tete">
          <h2 id="dialogue-titre">{titre}</h2>
          <button type="button" className="dialogue-fermer" aria-label="Fermer" onClick={onFermer}>
            <Icone nom="fermer" />
          </button>
        </div>
        {ouvert && children}
      </div>
    </dialog>
  )
}