// Nœud Code n8n « Préparer data.json »
// À placer juste après la branche « vrai » du nœud IF (pertinence ≥ 8).
// Mode : Run Once for All Items — Langage : JavaScript

// Identifiant sans numéro de version arXiv : 2609.33967v1 et v2 = même article
const vus = new Set();
const cle = (url) => String(url).replace(/^https?:\/\/(www\.)?/, '').replace(/v\d+$/, '').toLowerCase();

const articles = $input.all()
  .map((item) => item.json)
  .filter((a) => a && a.url && Number(a.pertinence) >= 8)
  .filter((a) => !vus.has(cle(a.url)) && vus.add(cle(a.url)))
  .map((a) => ({
    titre: a.titre,
    url: a.url,
    date: a.date,
    pertinence: Number(a.pertinence),
    justification_pertinence: a.justification_pertinence || '',
    type_handicap: a.type_handicap,
    maturite: a.maturite,
    resume: a.resume,
    pourquoi_important: a.pourquoi_important || '',
    resume_simple: a.resume_simple || '',
  }));

// Aucun article retenu : on arrête ici pour ne pas publier une édition vide
// (le site garde alors l'édition précédente).
if (articles.length === 0) return [];

// Date du jour au format AAAA-MM-JJ, à l'heure du Bénin
const jour = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Lagos' });

return [{
  json: {
    contenu: JSON.stringify({ mis_a_jour: jour, articles }, null, 2),
    nombre: articles.length,
    jour,
  },
}];
