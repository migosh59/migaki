/* ─── i18n.js ───────────────────────────────────────────────────────────────
   Système de traduction FR / EN
   Usage dans chaque page :
     import { t, getLang, setLang } from './i18n.js'
     await initI18n()
     document.getElementById('mon-element').textContent = t('ma_cle')
──────────────────────────────────────────────────────────────────────────── */

const LANGUES_DISPONIBLES = ['fr', 'en'];
const LANGUE_DEFAUT = 'fr';
const CLE_STORAGE = 'migaki_lang';

let traductions = {};
let langueActive = LANGUE_DEFAUT;

/* ── Détection de la langue ── */
function detecterLangue() {
  // 1. Préférence sauvegardée par l'utilisateur
  const saved = localStorage.getItem(CLE_STORAGE);
  if (saved && LANGUES_DISPONIBLES.includes(saved)) return saved;

  // 2. Langue du navigateur
  const nav = navigator.language || navigator.userLanguage || '';
  if (nav.startsWith('fr')) return 'fr';

  // 3. Défaut
  return LANGUE_DEFAUT;
}

/* ── Chargement du fichier JSON ── */
async function chargerTraductions(lang) {
  const response = await fetch(`./i18n/${lang}.json`);
  if (!response.ok) throw new Error(`Impossible de charger i18n/${lang}.json`);
  return await response.json();
}

/* ── Initialisation (à appeler en premier dans chaque page) ── */
export async function initI18n() {
  langueActive = detecterLangue();
  traductions = await chargerTraductions(langueActive);
  document.documentElement.lang = langueActive;
}

/* ── Traduction d'une clé ── */
export function t(cle, variables = {}) {
  let texte = traductions[cle] ?? cle;
  // Remplacement de variables : t('supprimer_confirm', { nom: 'fuseki.sgf' })
  for (const [k, v] of Object.entries(variables)) {
    texte = texte.replaceAll(`{${k}}`, v);
  }
  return texte;
}

/* ── Langue active ── */
export function getLang() {
  return langueActive;
}

/* ── Changer de langue et recharger la page ── */
export function setLang(lang) {
  if (!LANGUES_DISPONIBLES.includes(lang)) return;
  localStorage.setItem(CLE_STORAGE, lang);
  window.location.reload();
}

/* ── Créer le bouton de bascule FR/EN ── */
export function creerBoutonLang() {
  const btn = document.createElement('button');
  btn.id = 'btn-lang';
  btn.textContent = langueActive === 'fr' ? '🇬🇧' : '🇫🇷';
  btn.title = langueActive === 'fr' ? 'Switch to English' : 'Passer en français';
  btn.style.cssText = `
    position: absolute;
    right: 130px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--surface-2, #22201a);
    border: 1px solid var(--border-strong, rgba(212,160,23,0.3));
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.22s;
    line-height: 1;
  `;
  btn.addEventListener('click', () => {
    setLang(langueActive === 'fr' ? 'en' : 'fr');
  });
  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = 'var(--gold, #d4a017)';
    btn.style.background = 'var(--surface-3, #2c2920)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.borderColor = 'var(--border-strong, rgba(212,160,23,0.3))';
    btn.style.background = 'var(--surface-2, #22201a)';
  });
  return btn;
}
