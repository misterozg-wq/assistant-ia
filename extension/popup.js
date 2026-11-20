const LABELS = {
  civilite: 'Civilité', nom: 'Nom', prenom: 'Prénom', dateNaissance: 'Date de naissance', lieuNaissance: 'Lieu de naissance',
  profession: 'Profession', situationFamiliale: 'Situation familiale', adresse: 'Adresse', cp: 'Code postal', ville: 'Ville',
  tel: 'Téléphone', tel2: 'Téléphone 2', email: 'Email', siret: 'SIRET', naf: 'NAF', activite: 'Activité', formeJuridique: 'Forme juridique',
  gerant: 'Gérant', dateCreation: 'Date de création', iban: 'IBAN', bic: 'BIC', datePermis: 'Date du permis', bonusMalus: 'Bonus/malus',
  moisAssure36: 'Mois assuré (36)', sinistres36: 'Sinistres (36 mois)', vehMarque: 'Marque', vehModele: 'Modèle', vehEnergie: 'Énergie',
  vehCarrosserie: 'Carrosserie', vehCV: 'CV', vehImmat: 'Immatriculation', vehMEC: '1re mise en circulation', vehDateAchat: "Date d'achat",
  vehFinancement: 'Financement', vehUsage: 'Usage', vehKm: 'Km/an', vehStationnement: 'Stationnement', vehCPGarage: 'CP stationnement',
  formuleSouhaitee: 'Formule', dateEffetSouhaitee: "Date d'effet"
};
const fr = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split('-').reverse().join('/') : v;
let tab;

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const st = await chrome.storage.local.get(['fiche', 'ficheDate', 'learned']);
  const host = tab && tab.url ? new URL(tab.url).hostname.replace(/^www\./, '') : '';
  const nb = st.learned && st.learned[host] ? Object.keys(st.learned[host]).length : 0;
  document.getElementById('site').textContent = host ? `Site : ${host} — ${nb} case(s) apprise(s)` : '';
  if (!st.fiche) {
    document.getElementById('fiche').textContent = 'Aucune fiche — cliquez « Copier la fiche » dans le CRM';
    document.getElementById('fill').disabled = true;
    return;
  }
  const f = st.fiche;
  document.getElementById('fiche').textContent = `${f.nomComplet || f.nom} — copiée le ${new Date(st.ficheDate).toLocaleString('fr-FR')}`;
  const box = document.getElementById('vals');
  for (const [k, l] of Object.entries(LABELS)) {
    if (!f[k]) continue;
    const d = document.createElement('div');
    d.innerHTML = `<span></span><b></b>`; d.firstChild.textContent = l; d.lastChild.textContent = fr(f[k]);
    d.onclick = () => { navigator.clipboard.writeText(fr(f[k])); d.style.background = '#dcfce7'; };
    box.appendChild(d);
  }
}
async function inject(fnName) {
  await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['sites.js', 'filler.js'] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: (n) => window[n] && window[n](), args: [fnName] });
}
document.getElementById('fill').onclick = async () => { await inject('__gpcFill').catch(e => alert('Page non accessible : ' + e.message)); window.close(); };
document.getElementById('learn').onclick = async () => { await inject('__gpcLearn').catch(e => alert('Page non accessible : ' + e.message)); window.close(); };
document.getElementById('reset').onclick = async () => {
  const host = new URL(tab.url).hostname.replace(/^www\./, '');
  const st = await chrome.storage.local.get('learned'); const l = st.learned || {};
  if (!l[host] || !confirm(`Effacer les ${Object.keys(l[host]).length} case(s) apprise(s) pour ${host} ?`)) return;
  delete l[host]; await chrome.storage.local.set({ learned: l }); init();
};
init();
