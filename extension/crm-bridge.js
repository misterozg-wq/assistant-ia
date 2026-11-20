// Reçoit la fiche envoyée par le CRM GPC (bouton « Copier la fiche ») et la garde dans l'extension.
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data || e.data.type !== 'GPC_FICHE' || !e.data.fiche) return;
  const fiche = e.data.fiche;
  chrome.storage.local.set({ fiche, ficheDate: Date.now() }, () => {
    window.postMessage({ type: 'GPC_FICHE_OK', nom: fiche.nomComplet || fiche.nom || '' }, '*');
  });
});
