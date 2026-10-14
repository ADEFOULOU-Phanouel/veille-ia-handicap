import { useId, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import Icone from './Icones.jsx'
import { CATEGORIES, MATURITES, dateFr } from '../lib/data.js'

export default function Carte({ article: a, une = false, favori, onFavori, lecture, rang = 0 }) {
  const [simple, setSimple] = useState(false)
  const idSimple = useId()
  const lit = lecture.enCours === a.id
  const langue = a.langueTitre && a.langueTitre !== 'fr' ? a.langueTitre : undefined
  const Titre = une ? 'h2' : 'h3'

  return (
    <m.article
      className={`card t-${a.handicap}${une ? ' une' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(rang, 4) * 0.06 }}
    >
      {une && <p className="une-label">À la une · la mieux notée de l’édition</p>}
      <div className="cico" aria-hidden="true"><Icone nom={a.handicap} className="" /></div>

      <p className="tags">
        <span className="tag">{CATEGORIES[a.handicap].label}</span>
        {a.maturite && <span className="tag mat">{MATURITES[a.maturite]}</span>}
      </p>

      <Titre className="titre">
        <a href={a.lien} rel="noopener" lang={langue}>{a.titre}</a>
      </Titre>
      {a.titreOriginal && <p className="orig">Titre original : <span lang="en">{a.titreOriginal}</span></p>}

      <div className="meta">
        <span>{[a.source, dateFr(a.date)].filter(Boolean).join(' · ')}</span>
        {a.note != null && (
          <span className="sw">
            <span className="ring" style={{ '--p': Math.max(0, Math.min(10, a.note)) * 10 }} role="img" aria-label={`Pertinence ${a.note} sur 10`}>
              <span aria-hidden="true">{a.note}</span>
            </span>
            <span aria-hidden="true">pertinence</span>
          </span>
        )}
      </div>

      <p className="txt">{a.resume}</p>

      {/* Aides de lecture, juste sous le texte */}
      <div className="aides">
        {a.simple && (
          <button type="button" className="aide" aria-expanded={simple} aria-controls={idSimple} onClick={() => setSimple((s) => !s)}>
            <Icone nom="simple" />
            {simple ? 'Masquer la version simplifiée' : 'Pas clair ? Version simplifiée'}
          </button>
        )}
        {lecture.dispo && (
          <button type="button" className={`aide${lit ? ' actif' : ''}`} onClick={() => lecture.lire(a, simple)}>
            <Icone nom={lit ? 'stop' : 'ecouter'} />
            {lit ? 'Arrêter la lecture' : 'Écouter'}
          </button>
        )}
      </div>
      <div id={idSimple} className="simple-zone">
        <AnimatePresence initial={false}>
          {simple && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <p className="txt simple">{a.simple}</p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {a.enjeu && (
        <div className="why">
          <Icone nom="idee" />
          <div>
            <b>Pourquoi c’est important</b>
            <span>{a.enjeu}</span>
          </div>
        </div>
      )}

      {a.justification && (
        <details className="note">
          <summary>Pourquoi {a.note != null ? `${a.note}/10` : 'cette note'} ?</summary>
          <p>{a.justification}</p>
        </details>
      )}

      <div className="act">
        <a className="btn primaire" href={a.lien} rel="noopener">
          Lire l’article{a.source ? ` sur ${a.source}` : ''}
          <Icone nom="externe" />
          {langue === 'en' && <span className="sr"> (en anglais)</span>}
        </a>
        <button type="button" className="btn" aria-pressed={favori} onClick={() => onFavori(a.id)}>
          <Icone nom="favori" plein={favori} />
          Favori
        </button>
      </div>
    </m.article>
  )
}
