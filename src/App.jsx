import { useEffect, useId, useMemo, useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import Carte from './components/Carte.jsx'
import AnimationHero from './components/AnimationHero.jsx'
import MenuReglages from './components/MenuReglages.jsx'
import Dialogue from './components/Dialogue.jsx'
import Icone from './components/Icones.jsx'
import { CATEGORIES, ORDRE_CATEGORIES, MATURITES, normaliser, parDate, parNote, dateFr, simplifier, texteRecherche } from './lib/data.js'
import { usePreferences } from './lib/preferences.js'
import { useLecture } from './lib/lecture.js'

const PAS = 6

/* Vrai quand l'écran correspond à la requête média (ex. mobile) */
function useMedia(requete) {
  const [ok, setOk] = useState(() => window.matchMedia(requete).matches)
  useEffect(() => {
    const m = window.matchMedia(requete)
    const f = () => setOk(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [requete])
  return ok
}

function useVue() {
  const lireVue = () => (window.location.hash === '#favoris' ? 'favoris' : 'accueil')
  const [vue, setVue] = useState(lireVue)
  useEffect(() => {
    const f = () => {
      setVue(lireVue())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  useEffect(() => {
    document.title = vue === 'favoris' ? 'Mes favoris · Veille IA et handicap' : 'Veille IA et handicap · le journal du matin'
  }, [vue])
  return vue
}

function Bandeau({ articles }) {
  if (!articles.length) return null
  const titres = [...articles].sort(parDate).map((a) => a.titre)
  let suite = titres
  while (suite.length < 8) suite = suite.concat(titres) // évite un trou dans la boucle
  const ligne = suite.join('  ◆  ') + '  ◆  '
  return (
    <div className="ticker" aria-hidden="true">
      <div className="track"><span>{ligne}</span><span>{ligne}</span></div>
    </div>
  )
}

function Puces({ libelle, valeurs, actif, onChoix, tous }) {
  const id = useId()
  return (
    <div>
      <p className="fl" id={id}>{libelle}</p>
      <div className="row" role="group" aria-labelledby={id}>
        {valeurs.map((v) => (
          <button
            key={v.cle || 'tous'}
            type="button"
            className={'pill' + (v.cat ? ` t t-${v.cle}` : '')}
            aria-pressed={actif === v.cle}
            onClick={() => onChoix(v.cle)}
          >
            {v.cle ? v.label : tous} <span className="n">{v.n}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { prefs, changer, basculerFavori } = usePreferences()
  const lecture = useLecture()
  const vue = useVue()
  const [etat, setEtat] = useState({ statut: 'chargement', articles: [], majour: '' })
  const [filtre, setFiltre] = useState({ h: '', m: '', q: '', tri: 'date' })
  const [nombre, setNombre] = useState(PAS + 1)
  const mobile = useMedia('(max-width: 48rem)')
  const [volet, setVolet] = useState(false)

  useEffect(() => {
    fetch('/data.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(r.status)
        return r.json()
      })
      .then((d) => {
        const articles = normaliser(d)
        const majour = (!Array.isArray(d) && d?.mis_a_jour) || articles.map((a) => a.date).sort().pop() || ''
        setEtat({ statut: 'ok', articles, majour, dateExplicite: !Array.isArray(d) && !!d?.mis_a_jour })
      })
      .catch(() => setEtat({ statut: 'erreur', articles: [], majour: '' }))
  }, [])

  const A = etat.articles
  const q = simplifier(filtre.q)
  const passe = (a, ignore) =>
    (ignore === 'h' || !filtre.h || a.handicap === filtre.h) &&
    (ignore === 'm' || !filtre.m || a.maturite === filtre.m) &&
    (!q || texteRecherche(a).includes(q))
  const filtreActif = !!(filtre.h || filtre.m || q)

  const puces = useMemo(() => {
    const baseH = A.filter((a) => passe(a, 'h'))
    const baseM = A.filter((a) => passe(a, 'm'))
    const presentsH = ORDRE_CATEGORIES.filter((k) => A.some((a) => a.handicap === k))
    const presentsM = Object.keys(MATURITES).filter((k) => A.some((a) => a.maturite === k))
    return {
      h: [{ cle: '', n: baseH.length }, ...presentsH.map((k) => ({ cle: k, cat: true, label: CATEGORIES[k].court || CATEGORIES[k].label, n: baseH.filter((a) => a.handicap === k).length }))],
      m: [{ cle: '', n: baseM.length }, ...presentsM.map((k) => ({ cle: k, label: MATURITES[k], n: baseM.filter((a) => a.maturite === k).length }))],
    }
  }, [A, filtre.h, filtre.m, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const { une, liste } = useMemo(() => {
    const L = A.filter((a) => passe(a))
    const tri = filtre.tri === 'note' ? parNote : parDate
    if (filtreActif || !L.length) return { une: null, liste: L.sort(tri) }
    const meilleure = [...L].sort(parNote)[0]
    return { une: meilleure, liste: L.filter((a) => a !== meilleure).sort(tri) }
  }, [A, filtre, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const choisir = (cle, valeur) => {
    setFiltre((f) => ({ ...f, [cle]: valeur }))
    setNombre(PAS + 1)
  }
  const reinitialiser = () => {
    setFiltre({ h: '', m: '', q: '', tri: 'date' })
    setNombre(PAS + 1)
  }

  const nbFavoris = Object.keys(prefs.fav).length
  const favoris = A.filter((a) => prefs.fav[a.id]).sort(parDate)
  const total = (une ? 1 : 0) + liste.length
  const visibles = liste.slice(0, une ? nombre - 1 : nombre)
  const filtres = (
    <>
      <div className="p-top">
        <label>
          Trier par
          <select value={filtre.tri} onChange={(e) => choisir('tri', e.target.value)}>
            <option value="date">Date</option>
            <option value="note">Pertinence</option>
          </select>
        </label>
        <p className="compte" aria-live="polite">{etat.statut === 'ok' ? `${total} article${total > 1 ? 's' : ''} affiché${total > 1 ? 's' : ''}` : ''}</p>
        {(filtreActif || filtre.tri !== 'date') && (
          <button type="button" className="ghost" onClick={reinitialiser}>Réinitialiser les filtres</button>
        )}
      </div>
      <div className="p-grid">
        <Puces libelle="Type de handicap" tous="Tous" valeurs={puces.h} actif={filtre.h} onChoix={(v) => choisir('h', v)} />
        {puces.m.length > 2 && <Puces libelle="Maturité" tous="Toutes" valeurs={puces.m} actif={filtre.m} onChoix={(v) => choisir('m', v)} />}
      </div>
    </>
  )
  const carte = (a, i, estUne = false) => (
    <Carte key={a.id} article={a} une={estUne} rang={i} favori={!!prefs.fav[a.id]} onFavori={basculerFavori} lecture={lecture} />
  )

  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion={prefs.calme ? 'always' : 'user'}>
      <a className="skip" href="#main">Aller au contenu</a>
      <Bandeau articles={A} />

      <div className="barre">
        <div className="wrap">
          <a className="logo" href="#accueil"><Icone nom="marque" />Veille IA &amp; handicap</a>
          <nav className="onglets" aria-label="Navigation principale">
            <a href="#accueil" aria-current={vue === 'accueil' ? 'page' : undefined}>Journal</a>
            <a href="#favoris" aria-current={vue === 'favoris' ? 'page' : undefined}>
              Favoris{nbFavoris > 0 && <span className="pastille">{nbFavoris}</span>}
            </a>
          </nav>
        </div>
      </div>

      <header className="hero">
        {!mobile && <AnimationHero calme={prefs.calme} />}
        <div className="wrap">
          <p className="kick">
            {etat.statut === 'ok'
              ? `${etat.majour ? `${etat.dateExplicite ? 'Édition du' : 'Dernière dépêche du'} ${dateFr(etat.majour, { weekday: 'long', day: 'numeric', month: 'long' })} · ` : ''}${A.length} article${A.length > 1 ? 's' : ''}`
              : etat.statut === 'erreur' ? 'Édition indisponible' : 'Chargement de l’édition…'}
          </p>
          <h1>L’IA au service du <span className="hl">handicap</span></h1>
          <p className="tag-line">Chaque matin, les innovations qui compensent les situations de handicap, résumées simplement.</p>
          {vue === 'accueil' && (
            <div className="search">
              <label htmlFor="q" className="sr">Rechercher un article</label>
              <div className="search-champ">
                <Icone nom="recherche" />
                <input type="search" id="q" value={filtre.q} placeholder="Rechercher : langue des signes, EEG…" autoComplete="off" onChange={(e) => choisir('q', e.target.value)} />
              </div>
              {mobile && (
                <button type="button" className="btn-filtres" aria-haspopup="dialog" aria-expanded={volet} onClick={() => setVolet(true)}>
                  <Icone nom="filtres" />
                  <span className="sr">Filtrer les articles</span>
                  {(filtre.h ? 1 : 0) + (filtre.m ? 1 : 0) > 0 && <span className="pastille" aria-hidden="true">{(filtre.h ? 1 : 0) + (filtre.m ? 1 : 0)}</span>}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main id="main" className="wrap" tabIndex={-1}>
        {vue === 'accueil' ? (
          <section aria-label="Articles">
            {mobile ? (filtreActif || filtre.tri !== 'date') && (
              <div className="resume-mobile" aria-live="polite">
                <p>
                  {etat.statut === 'ok' ? `${total} article${total > 1 ? 's' : ''}` : ''}
                  {filtre.h && ` · ${CATEGORIES[filtre.h].label}`}
                  {filtre.m && ` · ${MATURITES[filtre.m]}`}
                </p>
                {(filtreActif || filtre.tri !== 'date') && (
                  <button type="button" className="ghost" onClick={reinitialiser}>Réinitialiser</button>
                )}
              </div>
            ) : (
              <div className="panel">{filtres}</div>
            )}

            <div className="grid">
              {etat.statut === 'chargement' &&
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="card squelette" aria-hidden="true">
                    <span className="sk sk-s" /><span className="sk sk-t" /><span className="sk" /><span className="sk" /><span className="sk sk-s" />
                  </div>
                ))}
              {etat.statut === 'erreur' && <p className="status">Les articles n’ont pas pu être chargés. Réessayez dans quelques instants.</p>}
              {etat.statut === 'ok' && !total && <p className="status">Aucun article ne correspond. Élargissez la recherche ou les filtres.</p>}
              {une && carte(une, 0, true)}
              {visibles.map((a, i) => carte(a, i + 1))}
            </div>
            {liste.length > visibles.length && (
              <button type="button" className="more" onClick={() => setNombre((n) => n + PAS)}>Voir plus d’articles</button>
            )}
          </section>
        ) : (
          <section aria-labelledby="t-fav">
            <h2 id="t-fav" className="fav-t">Mes favoris</h2>
            <div className="grid">
              {favoris.length ? favoris.map((a, i) => carte(a, i)) : <p className="status">Aucun favori pour l’instant. Utilisez le bouton « Favori » sur un article.</p>}
            </div>
          </section>
        )}
      </main>

      {mobile && (
        <Dialogue ouvert={volet} onFermer={() => setVolet(false)} titre="Filtrer les articles" variante="volet">
          <div className="volet-filtres">{filtres}</div>
          <button type="button" className="btn primaire volet-ok" onClick={() => setVolet(false)}>
            Voir {total} article{total > 1 ? 's' : ''}
          </button>
        </Dialogue>
      )}

      <footer className="foot">
        <div className="wrap">
          <p className="brand"><Icone nom="marque" />Veille IA &amp; Handicap</p>
          <div className="foot-ligne">
            <p>Le journal du matin : chaque jour, les innovations de l’intelligence artificielle qui aident à compenser les situations de handicap, triées, résumées et rendues accessibles.</p>
            <MenuReglages prefs={prefs} changer={changer} />
          </div>
          <p className="legal">Projet de veille technologique · édition automatisée · articles issus d’arXiv</p>
        </div>
      </footer>
    </MotionConfig>
    </LazyMotion>
  )
}
