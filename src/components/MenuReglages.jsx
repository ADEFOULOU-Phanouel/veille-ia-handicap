import { useState } from 'react'
import Dialogue from './Dialogue.jsx'
import Icone from './Icones.jsx'

/* Interrupteur à glisser (rôle ARIA « switch ») */
function Interrupteur({ id, icone, libelle, aide, actif, onChange }) {
  return (
    <div className="reglage">
      <Icone nom={icone} />
      <span className="reglage-txt">
        <span id={id}>{libelle}</span>
        {aide && <small id={id + '-aide'}>{aide}</small>}
      </span>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={actif}
        aria-labelledby={id}
        aria-describedby={aide ? id + '-aide' : undefined}
        onClick={() => onChange(!actif)}
      >
        <span className="switch-pastille" />
      </button>
    </div>
  )
}

/* Icône de réglage (pied de page) qui ouvre les réglages dans une fenêtre */
export default function MenuReglages({ prefs, changer }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <button type="button" className="btn-reglages" aria-haspopup="dialog" onClick={() => setOuvert(true)}>
        <Icone nom="reglages" />
        Réglages de lecture
      </button>
      <Dialogue ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Réglages de lecture">
        <Interrupteur id="r-sombre" icone="lune" libelle="Mode sombre" actif={prefs.theme === 'dark'} onChange={(v) => changer('theme', v ? 'dark' : 'light')} />
        <Interrupteur id="r-contraste" icone="contraste" libelle="Contraste élevé" actif={prefs.contrast} onChange={(v) => changer('contrast', v)} />
        <Interrupteur id="r-dys" icone="simple" libelle="Espacement renforcé" aide="Lettres et lignes plus espacées (dyslexie)" actif={prefs.dys} onChange={(v) => changer('dys', v)} />
        <Interrupteur id="r-calme" icone="mouvement" libelle="Arrêter les animations" aide="Bandeau défilant et illustration figés" actif={prefs.calme} onChange={(v) => changer('calme', v)} />
      </Dialogue>
    </>
  )
}