# Veille IA et handicap

Site React (Vite) qui affiche chaque matin les articles retenus par le workflow n8n.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produit le dossier dist/
```

## Organisation du projet

```
public/data.json              ← l'édition du jour, écrite par n8n (ne pas modifier à la main)
public/favicon.svg
src/App.jsx                   ← page : barre, héro, filtres, articles, pied de page
src/components/               ← Carte, AnimationHero, Dialogue, MenuReglages, Icones
src/assets/animation-hero.json← animation du héro (LottieFiles)
src/lib/data.js               ← lecture et nettoyage des données n8n
src/lib/preferences.js        ← réglages de lecture et favoris (mémorisés sur l'appareil)
src/lib/lecture.js            ← lecture à voix haute
src/styles.css
n8n/preparer-data-json.js     ← code du nœud Code n8n
```

## Déployer sur Vercel

1. Mettez le contenu de ce dossier dans votre dépôt GitHub (sans `node_modules` ni `dist`).
2. Vercel détecte **Vite** : commande `npm run build`, dossier de sortie `dist`.
3. Chaque commit sur la branche principale redéploie le site, y compris ceux faits par n8n.

## Le pont n8n → site

Le site lit **`public/data.json`**. n8n réécrit ce fichier chaque matin dans le dépôt GitHub, puis Vercel redéploie le site.

```
… → IA (notation) → IF pertinence ≥ 8 → Code « Préparer data.json » → GitHub « Edit a file »
```

### 1. Nœud Code « Préparer data.json »
- Branché sur la sortie **vrai** du nœud IF.
- Mode : **Run Once for All Items**, langage JavaScript.
- Contenu : `n8n/preparer-data-json.js`.
- Il supprime les doublons (v1/v2 d'arXiv), ajoute la date de l'édition, et s'arrête si aucun article n'est retenu (le site garde alors l'édition précédente).

### 2. Nœud GitHub
- Credential : jeton GitHub avec le droit d'écrire dans le dépôt.
- Resource : **File** · Operation : **Edit**
- File Path : `public/data.json`
- File Content : `{{ $json.contenu }}`
- Commit Message : `Édition du {{ $json.jour }}`

### Format attendu

```json
{
  "mis_a_jour": "2026-10-14",
  "articles": [
    {
      "titre": "Titre original (anglais)",
      "titre_fr": "Titre traduit (facultatif)",
      "url": "https://arxiv.org/abs/…",
      "date": "2026-09-30T11:55:25.000Z",
      "pertinence": 10,
      "justification_pertinence": "…",
      "type_handicap": "auditif",
      "maturite": "recherche",
      "resume": "…",
      "pourquoi_important": "…",
      "resume_simple": "…"
    }
  ]
}
```

| Champ | Utilisation sur le site |
|---|---|
| `titre_fr` | Titre affiché ; le titre anglais passe en dessous. Si absent, le titre anglais est affiché |
| `url`, `date` | Lien vers l'article, date |
| `pertinence` | Note sur 10, article « À la une », tri |
| `justification_pertinence` | « Pourquoi 9/10 ? » |
| `type_handicap` | visuel, auditif, moteur, parole_communication, cognitif, psychique |
| `maturite` | recherche, prototype, produit_disponible, politique / financement |
| `resume` | Texte principal |
| `resume_simple` | « Pas clair ? Version simplifiée » |
| `pourquoi_important` | Encadré « Pourquoi c'est important » |

Le site accepte aussi la sortie brute de n8n (un simple tableau d'articles) et écarte les lignes en erreur (`pertinence` négative).
