// GPC Remplissage — reconnaissance des cases et remplissage (injecté dans la page de l'extranet).
// Ne valide et n'envoie jamais rien : il remplit seulement les cases.
(() => {
if (window.__gpcLoaded) return;
window.__gpcLoaded = true;

const N = (s) => String(s || '')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[_\-.:*()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- Clés de la fiche : libellé + motifs de reconnaissance (ordre = priorité) ----------
const KEYS = [
  ['lieuNaissance', 'Lieu de naissance', /(lieu|ville|commune|pays|departement) (de )?naissance|birth ?place/],
  ['vehCPGarage', 'CP de stationnement', /((code postal|\bcp\b).*(garage|stationnement|parking|remisage))|((garage|stationnement|parking|remisage).*(code postal|\bcp\b))/],
  ['datePermis', 'Date du permis', /permis|licen[cs]e/, /\bn(o|um|°)\b|\bnum|numero|categorie|type de permis|pays|suspen|annul|retrait/],
  ['dateNaissance', 'Date de naissance', /naissance|birth|\bnee? le\b|\bdob\b|\bbday\b/, /nom de naissance/],
  ['vehMEC', '1re mise en circulation', /circulation|\bmec\b|\bpmc\b/],
  ['vehDateAchat', "Date d'achat", /date d ?(achat|acquisition)|achete le|acquis le/],
  ['dateEffetSouhaitee', "Date d'effet", /effet|date de debut|start ?date|date de souscription/],
  ['vehImmat', 'Immatriculation', /immatricul|\bimmat\b|plaque|registration/, /date/],
  ['vehStationnement', 'Stationnement', /stationnement|garage|parking|remisage|gare la nuit|lieu de garage/],
  ['vehMarque', 'Marque', /marque|\bbrand\b|\bmake\b/],
  ['vehModele', 'Modèle', /modele|\bmodel\b|version|finition/],
  ['vehEnergie', 'Énergie', /energie|carburant|motorisation|\bfuel\b/],
  ['vehCarrosserie', 'Carrosserie', /carrosserie|categorie de vehicule|type de vehicule|genre/],
  ['vehCV', 'Puissance (CV)', /puissance|chevaux|\bcv\b|fiscal/],
  ['vehKm', 'Kilométrage', /kilomet|\bkms?\b/],
  ['vehFinancement', 'Financement', /financement|leasing|\bloa\b|\blld\b|credit/],
  ['vehUsage', 'Usage', /usage|utilisation du vehicule/],
  ['bonusMalus', 'Bonus / malus', /bonus|malus|\bcrm\b|coefficient/],
  ['sinistres36', 'Sinistres 36 mois', /sinistre/],
  ['moisAssure36', 'Mois assuré (36)', /mois.*assur|assur.*mois|antecedent|anciennete/],
  ['formuleSouhaitee', 'Formule', /formule|niveau de garantie/],
  ['civilite', 'Civilité', /civilite|\btitre\b|salutation|gender|\bsexe\b|honorific/],
  ['situationFamiliale', 'Situation familiale', /situation (familiale|matrimoniale)|marital/],
  ['profession', 'Profession', /profession|metier|occupation|\bcsp\b|categorie socio/],
  ['siret', 'SIRET', /siret|siren/],
  ['naf', 'Code NAF', /\bnaf\b|\bape\b/],
  ['dateCreation', 'Date de création', /date de creation|immatriculation (au|rcs)/],
  ['iban', 'IBAN', /iban/],
  ['bic', 'BIC', /\bbic\b|swift/],
  ['email', 'Email', /e ?mail|courriel/],
  ['tel', 'Téléphone', /\btel\b|telephone|phone|portable|mobile|\bgsm\b/],
  ['prenom', 'Prénom', /prenom|first ?name|given ?name|forename/],
  ['cp', 'Code postal', /code postal|postal|\bcp\b|\bzip\b/],
  ['ville', 'Ville', /\bville\b|commune|\bcity\b|localite|address level2/],
  ['adresse', 'Adresse', /adresse|address|\brue\b|\bvoie\b|street/, /mail|complement|\bip\b|\bligne 2\b|line ?2/],
  ['nom', 'Nom', /\bnom\b|last ?name|surname|family ?name|raison sociale|denomination/, /prenom|utilisateur|user|fichier|\bnom de la (voie|rue)/],
  ['activite', 'Activité', /activite/],
];
const KEY_LABEL = Object.fromEntries(KEYS.map(k => [k[0], k[1]]));
const AUTOCOMPLETE = { 'given-name': 'prenom', 'family-name': 'nom', 'bday': 'dateNaissance', 'postal-code': 'cp',
  'address-level2': 'ville', 'street-address': 'adresse', 'address-line1': 'adresse', 'tel': 'tel', 'tel-national': 'tel',
  'email': 'email', 'honorific-prefix': 'civilite', 'organization': 'nom', 'name': 'nomComplet' };
const DATE_KEYS = new Set(['dateNaissance', 'datePermis', 'vehMEC', 'vehDateAchat', 'dateEffetSouhaitee', 'dateCreation']);

// ---------- Synonymes pour les listes déroulantes / boutons radio ----------
const SYN = {
  'mme': ['mme', 'madame', 'mrs', 'ms', 'femme', 'f'], 'm': ['m', 'mr', 'monsieur', 'homme', 'h'],
  'mlle': ['mlle', 'mademoiselle'],
  'hybride rechargeable': ['hybride rechargeable', 'phev', 'plug', 'hybride'], 'electrique': ['electrique', 'elec', 'ev'],
  'prive + trajet travail': ['trajet', 'domicile travail', 'prive et trajet', 'prive trajet', 'promenade trajet'],
  'prive': ['prive', 'promenade', 'loisirs'],
  'garage collectif ferme': ['garage collectif', 'parking collectif', 'collectif', 'parking prive ferme', 'garage'],
  'garage individuel ferme': ['garage individuel', 'box', 'garage ferme', 'garage'],
  'voie publique': ['voie publique', 'rue', 'exterieur'],
  'suv / tout chemin': ['suv', 'tout chemin', '4x4', 'tout terrain', 'crossover'],
  'tous risques': ['tous risques', 'tout risque', 'tous accidents', 'premium', 'confort'],
  'tiers + vol/incendie': ['tiers plus', 'intermediaire', 'vol incendie', 'tiers etendu'],
  'tiers': ['tiers', 'au tiers', 'responsabilite civile'],
  'celibataire': ['celibataire'], 'marie(e)': ['marie'], 'pacse(e)': ['pacse', 'pacs'], 'concubin(e)': ['concubin', 'union libre', 'vie maritale'],
};
const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

// ---------- Valeurs dérivées de la fiche ----------
function prepare(f) {
  const v = { ...f };
  if (!v.nomComplet) v.nomComplet = [v.civilite, v.prenom, v.nom].filter(Boolean).join(' ');
  v.adresseComplete = [v.adresse, [v.cp, v.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (!v.vehCPGarage && v.cp) v.vehCPGarage = v.cp;
  if (v.tel) v.tel = v.tel.replace(/[^\d+]/g, '').replace(/^\+33/, '0');
  if (v.civilite) v.civilite = v.civilite.replace('.', '');
  return v;
}
function dateParts(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return null;
  return { y: m[1], m: m[2], d: m[3] || '01' };
}

// ---------- Description d'une case (libellés autour) ----------
function textOf(el) { return el ? (el.innerText || el.textContent || '').slice(0, 160) : ''; }
// Niveau 1 : libellé propre de la case ; niveau 2 : bloc qui ne contient que cette case ; niveau 3 : texte juste avant.
function describeTiers(el) {
  const t1 = [];
  if (el.id) { try { document.querySelectorAll('label[for="' + CSS.escape(el.id) + '"]').forEach(l => t1.push(textOf(l))); } catch (e) {} }
  const lab = el.closest('label'); if (lab) t1.push(textOf(lab));
  ['aria-label', 'placeholder', 'name', 'id', 'title', 'formcontrolname', 'ng-model', 'v-model', 'data-name', 'data-field', 'data-testid'].forEach(a => {
    const x = el.getAttribute(a); if (x) t1.push(x);
  });
  const lb = el.getAttribute('aria-labelledby');
  if (lb) lb.split(/\s+/).forEach(id => t1.push(textOf(document.getElementById(id))));
  // bloc le plus large ne contenant que cette case
  let box = el, p = el.parentElement;
  while (p && p !== document.body && p.querySelectorAll('input:not([type=hidden]),select,textarea').length === 1) { box = p; p = p.parentElement; }
  const t2 = box !== el ? textOf(box) : '';
  // texte juste avant la case (éléments frères précédents, puis frère précédent du bloc)
  const t3 = [];
  let s = el.previousElementSibling, n = 0;
  while (s && n < 2) { if (!s.matches('input,select,textarea') && !s.querySelector('input,select,textarea')) t3.push(textOf(s)); else break; s = s.previousElementSibling; n++; }
  let prevNode = el.previousSibling; if (prevNode && prevNode.nodeType === 3) t3.push(prevNode.textContent);
  const bs = box.previousElementSibling; if (bs && !bs.querySelector('input,select,textarea') && textOf(bs).length < 120) t3.push(textOf(bs));
  const fs = el.closest('fieldset'); if (fs) { const lg = fs.querySelector('legend'); if (lg) t3.push(textOf(lg)); }
  return [N(t1.join(' | ')), N(t2), N(t3.join(' | '))];
}
function describe(el) { return describeTiers(el).filter(Boolean).join(' | '); }
function ownLabel(el) {
  const parts = [];
  if (el.id) { try { document.querySelectorAll('label[for="' + CSS.escape(el.id) + '"]').forEach(l => parts.push(textOf(l))); } catch (e) {} }
  const lab = el.closest('label'); if (lab) parts.push(textOf(lab));
  parts.push(el.value || '', el.getAttribute('aria-label') || '');
  const nx = el.nextElementSibling; if (nx && !nx.matches('input,select,textarea')) parts.push(textOf(nx));
  return N(parts.join(' '));
}
function groupDescribe(el) {
  const fs = el.closest('fieldset'); if (fs) { const lg = fs.querySelector('legend'); if (lg) return N(textOf(lg)); }
  let p = el.parentElement, d = 0;
  while (p && d < 5) {
    const n = p.querySelectorAll('input[type=radio][name="' + CSS.escape(el.name) + '"]').length;
    if (n > 1) {
      const t = N(textOf(p)); const own = N(Array.from(p.querySelectorAll('label')).map(textOf).join(' '));
      const prev = p.previousElementSibling ? N(textOf(p.previousElementSibling)) : '';
      return (prev + ' ' + t.replace(own, '')).trim() || t;
    }
    p = p.parentElement; d++;
  }
  return describe(el);
}
function matchKey(desc) {
  if (!desc) return null;
  for (const [k, , re, not] of KEYS) if (re.test(desc) && !(not && not.test(desc))) return k;
  return null;
}
function guessKey(tiers, el) {
  const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
  if (AUTOCOMPLETE[ac]) return AUTOCOMPLETE[ac];
  if (el.type === 'email') return 'email';
  if (el.type === 'tel') return 'tel';
  if (typeof tiers === 'string') return matchKey(tiers);
  for (const t of tiers) { const k = matchKey(t); if (k) return k; }
  return null;
}

// ---------- Écriture d'une valeur (compatible React / Angular / Vue) ----------
function setNative(el, val) {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  el.focus({ preventScroll: true });
  setter.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  el.blur();
}
function candidates(val) {
  const n = N(val); const out = [n];
  for (const [k, list] of Object.entries(SYN)) if (N(k) === n) out.push(...list.map(N));
  return out;
}
function scoreText(text, cands) {
  const t = N(text); if (!t) return 0;
  let best = 0;
  for (const c of cands) {
    if (!c) continue;
    if (t === c) best = Math.max(best, 100);
    else if (c.length > 1 && (t.startsWith(c + ' ') || t.includes(' ' + c + ' ') || t.endsWith(' ' + c))) best = Math.max(best, 70);
    else if (c.length > 3 && t.includes(c)) best = Math.max(best, 50);
    else if (t.length > 3 && c.includes(t)) best = Math.max(best, 40);
  }
  return best;
}
function chooseOption(sel, val, part) {
  const opts = Array.from(sel.options);
  let cands = candidates(val);
  if (part === 'm') { const i = parseInt(val, 10); cands = [String(i), String(i).padStart(2, '0'), MOIS[i - 1]]; }
  else if (part) cands = [String(parseInt(val, 10)), String(val)];
  const num = parseFloat(String(val).replace(',', '.'));
  let best = null, bs = 0;
  for (const o of opts) {
    if (!o.value && !o.text.trim()) continue;
    let s = Math.max(scoreText(o.text, cands), scoreText(o.value, cands));
    if (!s && !isNaN(num)) { const ov = parseFloat(String(o.value || o.text).replace(',', '.')); if (!isNaN(ov) && ov === num) s = 90; }
    if (s > bs) { bs = s; best = o; }
  }
  if (best) { setNative(sel, best.value); return true; }
  return false;
}
function formatDate(iso, el, siteFmt) {
  const p = dateParts(iso); if (!p) return iso;
  if (el.type === 'date') return `${p.y}-${p.m}-${p.d}`;
  if (el.type === 'month') return `${p.y}-${p.m}`;
  const hint = N((el.placeholder || '') + ' ' + (el.getAttribute('pattern') || '') + ' ' + (siteFmt || ''));
  if (/^mm ?\/ ?aaaa$|^mm ?\/ ?yyyy$/.test(N(el.placeholder || '')) || (el.maxLength === 7)) return `${p.m}/${p.y}`;
  if (/aaaa ?- ?mm|yyyy ?- ?mm/.test(hint)) return `${p.y}-${p.m}-${p.d}`;
  return `${p.d}/${p.m}/${p.y}`;
}
function datePart(desc) {
  if (/(jj|dd).*(mm).*(aa|yy)/.test(desc) || /\d\d ?\/ ?\d\d/.test(desc)) return null;
  if (/\b(jour|day|jj|dd)\b/.test(desc)) return 'd';
  if (/\b(mois|month|mm)\b/.test(desc)) return 'm';
  if (/\b(annee|year|aaaa|yyyy|an)\b/.test(desc)) return 'y';
  return null;
}
function mark(el, ok) {
  el.style.outline = ok ? '2px solid #16a34a' : '2px dashed #f59e0b';
  el.style.outlineOffset = '1px';
}
function visible(el) {
  if (el.disabled || el.readOnly) return false;
  if (['hidden', 'submit', 'button', 'reset', 'image', 'file', 'password'].includes(el.type)) return false;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') || el.type === 'radio' || el.type === 'checkbox';
}
function isEmpty(el) {
  if (el.tagName === 'SELECT') return el.selectedIndex <= 0 || !el.value;
  return !el.value;
}

// ---------- Remplir une case avec une clé ----------
function fillOne(el, key, f, siteFmt, force) {
  let val = f[key]; if (!val) return false;
  if (!force && !isEmpty(el) && el.type !== 'radio' && el.type !== 'checkbox') return false;
  if (DATE_KEYS.has(key)) {
    const part = el.type === 'date' || el.type === 'month' ? null : datePart(N(el.name + ' ' + el.id + ' ' + (el.placeholder || '') + ' ' + (el.getAttribute('aria-label') || '')));
    const p = dateParts(val);
    if (part && p) {
      const pv = part === 'd' ? p.d : part === 'm' ? p.m : p.y;
      if (el.tagName === 'SELECT') return chooseOption(el, pv, part);
      setNative(el, pv); return true;
    }
    if (el.tagName === 'SELECT') return false;
    setNative(el, formatDate(val, el, siteFmt)); return true;
  }
  if (el.tagName === 'SELECT') return chooseOption(el, val);
  if (el.type === 'radio') {
    const group = Array.from(document.querySelectorAll('input[type=radio][name="' + CSS.escape(el.name) + '"]'));
    const cands = candidates(val);
    let best = null, bs = 0;
    for (const r of group) { const s = scoreText(ownLabel(r), cands); if (s > bs) { bs = s; best = r; } }
    if (best && !best.checked) { best.click(); best.dispatchEvent(new Event('change', { bubbles: true })); }
    return !!best;
  }
  if (el.type === 'checkbox') return false;
  if (el.type === 'number') val = String(val).replace(',', '.').replace(/[^\d.]/g, '');
  if (key === 'vehKm' || key === 'vehCV' || key === 'sinistres36' || key === 'moisAssure36') val = String(val).replace(/[^\d]/g, '') || val;
  setNative(el, val); return true;
}

// ---------- Réglages du site (fichier sites.js + cases apprises) ----------
function siteConf(learned) {
  const host = location.hostname.replace(/^www\./, '');
  const all = window.GPC_SITES || {};
  let conf = null;
  for (const d of Object.keys(all)) if (host === d || host.endsWith('.' + d)) conf = all[d];
  const champs = Object.assign({}, conf && conf.champs, learned && learned[host]);
  return { host, champs, dates: conf && conf.dates, nom: conf && conf.nom };
}
function toastPage(msg) {
  if (window !== window.top) return;
  let t = document.getElementById('__gpc_toast');
  if (!t) { t = document.createElement('div'); t.id = '__gpc_toast'; document.documentElement.appendChild(t); }
  t.style.cssText = 'position:fixed;z-index:2147483647;right:16px;bottom:16px;background:#14213d;color:#fff;padding:10px 14px;border-radius:8px;font:13px Segoe UI,Arial;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:360px';
  t.textContent = msg; clearTimeout(t._h); t._h = setTimeout(() => t.remove(), 5000);
}

window.__gpcFill = async () => {
  const st = await chrome.storage.local.get(['fiche', 'learned']);
  if (!st.fiche) { toastPage('GPC : aucune fiche. Cliquez « Copier la fiche » dans le CRM.'); return { filled: 0 }; }
  const f = prepare(st.fiche);
  const conf = siteConf(st.learned || {});
  const done = new Set(); let filled = 0, unknown = 0; const radiosDone = new Set();
  // 1) cases réglées pour ce site
  for (const [sel, key] of Object.entries(conf.champs)) {
    let els = []; try { els = Array.from(document.querySelectorAll(sel)); } catch (e) {}
    for (const el of els) { if (fillOne(el, key, f, conf.dates, true)) { mark(el, true); filled++; } done.add(el); if (el.type === 'radio') radiosDone.add(el.name); }
  }
  // 2) reconnaissance automatique
  const els = Array.from(document.querySelectorAll('input, select, textarea')).filter(el => !done.has(el) && visible(el));
  for (const el of els) {
    if (el.type === 'radio') { if (radiosDone.has(el.name)) continue; radiosDone.add(el.name); }
    if (el.type === 'checkbox') continue;
    const desc = el.type === 'radio' ? groupDescribe(el) : describeTiers(el);
    const key = guessKey(desc, el);
    if (key && f[key]) { if (fillOne(el, key, f, conf.dates, false)) { mark(el, true); filled++; } }
    else if (isEmpty(el)) { mark(el, false); unknown++; }
  }
  toastPage(`GPC : ${filled} case(s) remplie(s) pour ${f.nomComplet || f.nom}` + (unknown ? ` — ${unknown} case(s) en orange à compléter (ou « Apprendre une case »)` : '') + '. Vérifiez avant de valider.');
  return { filled, unknown };
};

// ---------- Mode apprentissage : cliquer une case puis choisir la donnée ----------
function selectorFor(el) {
  if (el.id && !/\d{4,}/.test(el.id)) return '#' + CSS.escape(el.id);
  if (el.name) {
    const s = el.tagName.toLowerCase() + '[name="' + el.name.replace(/"/g, '\\"') + '"]';
    if (el.type === 'radio' || document.querySelectorAll(s).length === 1) return s;
  }
  const fcn = el.getAttribute('formcontrolname'); if (fcn) return '[formcontrolname="' + fcn + '"]';
  const path = []; let e = el;
  while (e && e.nodeType === 1 && e !== document.body) {
    let i = 1, s = e.previousElementSibling; while (s) { if (s.tagName === e.tagName) i++; s = s.previousElementSibling; }
    path.unshift(e.tagName.toLowerCase() + ':nth-of-type(' + i + ')'); e = e.parentElement;
  }
  return 'body > ' + path.join(' > ');
}
window.__gpcLearn = () => {
  if (window.__gpcLearning) return; window.__gpcLearning = true;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;right:0;background:#2563eb;color:#fff;padding:8px 14px;font:13px Segoe UI,Arial;text-align:center';
  bar.textContent = 'GPC — Apprentissage : cliquez sur une case du formulaire, puis choisissez la donnée de la fiche. Échap pour terminer.';
  if (window === window.top) document.documentElement.appendChild(bar);
  let picker = null;
  const stop = () => { window.__gpcLearning = false; bar.remove(); picker && picker.remove(); document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey, true); };
  const onKey = (e) => { if (e.key === 'Escape') stop(); };
  const onClick = (e) => {
    const el = e.target.closest('input, select, textarea');
    if (!el || (picker && picker.contains(e.target))) return;
    e.preventDefault(); e.stopPropagation();
    picker && picker.remove();
    picker = document.createElement('select');
    picker.size = 12;
    picker.style.cssText = 'position:fixed;z-index:2147483647;font:13px Segoe UI,Arial;border:2px solid #2563eb;border-radius:6px;background:#fff;color:#000';
    const r = el.getBoundingClientRect();
    picker.style.left = Math.min(r.left, innerWidth - 240) + 'px'; picker.style.top = Math.min(r.bottom + 4, innerHeight - 260) + 'px';
    picker.innerHTML = '<option value="">— Choisir la donnée —</option>' +
      [['nomComplet', 'Nom complet'], ['adresseComplete', 'Adresse complète'], ...KEYS.map(k => [k[0], k[1]])]
        .sort((a, b) => a[1].localeCompare(b[1])).map(([k, l]) => `<option value="${k}">${l}</option>`).join('') +
      '<option value="__ignore">(Ignorer cette case)</option>';
    document.documentElement.appendChild(picker); picker.focus();
    picker.onchange = async () => {
      const key = picker.value; if (!key) return;
      const st = await chrome.storage.local.get(['learned', 'fiche']);
      const learned = st.learned || {}; const host = location.hostname.replace(/^www\./, '');
      learned[host] = learned[host] || {};
      const sel = selectorFor(el);
      if (key === '__ignore') delete learned[host][sel]; else learned[host][sel] = key;
      await chrome.storage.local.set({ learned });
      if (key !== '__ignore' && st.fiche && fillOne(el, key, prepare(st.fiche), null, true)) mark(el, true);
      picker.remove(); picker = null;
      toastPage(key === '__ignore' ? 'GPC : case ignorée.' : `GPC : case retenue pour ce site → ${KEY_LABEL[key] || key}`);
    };
  };
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
};
})();
