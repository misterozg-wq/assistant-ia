// Raccourci clavier Alt+Shift+G : remplit l'onglet actif.
async function remplirOnglet(tabId) {
  const files = ['sites.js', 'filler.js'];
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files });
  const res = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: () => window.__gpcFill && window.__gpcFill()
  });
  return res;
}
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'remplir') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) remplirOnglet(tab.id).catch(() => {});
});
