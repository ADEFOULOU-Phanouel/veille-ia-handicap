/*
 * Pont n8n → site
 * Le site lit public/data.json. Deux formats sont acceptés :
 *   1. la sortie brute du nœud IF de n8n : [ {titre, url, date, pertinence, ...}, ... ]
 *   2. un objet enveloppe : { mis_a_jour: "2026-10-14", articles: [ ... ] }
 * Les noms de champs sont ceux produits par n8n ; les anciens noms restent acceptés.
 */

export const CATEGORIES = {
  visuel: { label: 'Visuel' },
  auditif: { label: 'Auditif' },
  moteur: { label: 'Moteur' },
  parole: { label: 'Parole et communication', court: 'Parole' },
  cognitif: { label: 'Cognitif' },
  psychique: { label: 'Psychique' },
  multiple: { label: 'Plusieurs handicaps', court: 'Plusieurs' },
}
export const ORDRE_CATEGORIES = Object.keys(CATEGORIES)

export const MATURITES = {
  recherche: 'Recherche',
  prototype: 'Prototype',
  produit: 'Produit disponible',
  politique: 'Politique ou financement',
}

const SOURCES = { 'arxiv.org': 'arXiv' }

/* Enlève accents et majuscules pour comparer et rechercher */
export const simplifier = (x) =>
  String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const lienSur = (u) => {
  try {
    const x = new URL(String(u ?? ''))
    return /^https?:$/.test(x.protocol) ? x.href : ''
  } catch {
    return ''
  }
}

/* Identifiant stable : sans protocole, sans www, sans numéro de version arXiv (v1, v2…) */
const identifiant = (u) => {
  try {
    const x = new URL(u)
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/v\d+$/, '').replace(/\/$/, '')).toLowerCase()
  } catch {
    return ''
  }
}

const categorie = (v) => {
  v = simplifier(v)
  if (/parole|communic|langage/.test(v)) return 'parole'
  if (/visu|aveug|malvoy/.test(v)) return 'visuel'
  if (/audi|sourd|malentend/.test(v)) return 'auditif'
  if (/moteur|motric/.test(v)) return 'moteur'
  if (/cogn/.test(v)) return 'cognitif'
  if (/psych/.test(v)) return 'psychique'
  return 'multiple'
}

const maturite = (v) => {
  v = simplifier(v).replace(/_/g, ' ')
  if (/polit|financ/.test(v)) return 'politique'
  if (/produit/.test(v)) return 'produit'
  if (/proto/.test(v)) return 'prototype'
  if (/recherch/.test(v)) return 'recherche'
  return ''
}

const nomSource = (a, u) => {
  if (a.source) return String(a.source)
  try {
    const h = new URL(u).hostname.replace(/^www\./, '')
    return SOURCES[h] || h
  } catch {
    return ''
  }
}

export function normaliser(brut) {
  const liste = Array.isArray(brut) ? brut : Array.isArray(brut?.articles) ? brut.articles : []
  const vus = new Set()
  return liste
    .map((a) => {
      const lien = lienSur(a.url ?? a.lien ?? a.link)
      const note = Number(a.pertinence ?? a.score ?? a.score_pertinence)
      const source = nomSource(a, lien)
      return {
        id: identifiant(lien),
        lien,
        titre: String(a.titre_fr || a.titre || a.title || 'Sans titre'),
        titreOriginal: a.titre_fr ? String(a.titre || a.title || '') : '',
        langueTitre: a.titre_fr ? 'fr' : a.langue_titre || (source === 'arXiv' ? 'en' : ''),
        source,
        date: String(a.date || '').slice(0, 10),
        note: Number.isFinite(note) ? note : null,
        justification: String(a.justification_pertinence || ''),
        handicap: categorie(a.type_handicap ?? a.handicap),
        maturite: maturite(a.maturite ?? a.maturite_technologie),
        resume: String(a.resume || ''),
        enjeu: String(a.pourquoi_important || a.pourquoi || ''),
        simple: String(a.resume_simple || a.version_simple || a.version_simplifiee || ''),
      }
    })
    .filter((a) => {
      if (!a.lien || !a.id) return false
      if (a.note != null && a.note < 0) return false // appel IA échoué dans n8n
      if (/erreur de lecture|appel echoue/.test(simplifier(a.resume))) return false
      if (vus.has(a.id)) return false
      vus.add(a.id)
      return true
    })
}

export const parDate = (x, y) => y.date.localeCompare(x.date) || (y.note ?? 0) - (x.note ?? 0)
export const parNote = (x, y) => (y.note ?? 0) - (x.note ?? 0) || y.date.localeCompare(x.date)

export function dateFr(d, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const x = new Date(String(d).slice(0, 10) + 'T12:00:00')
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('fr-FR', options)
}

export const texteRecherche = (a) =>
  simplifier([a.titre, a.titreOriginal, a.resume, a.enjeu, a.simple, a.source, CATEGORIES[a.handicap].label, MATURITES[a.maturite] || ''].join(' '))
