# Assistant IA — chatbot Android multi-IA avec bascule automatique

## Contenu
- `www/index.html` : l'application (HTML/JS, un seul fichier)
- `capacitor.config.json` / `package.json` : empaquetage en APK via Capacitor
- `.github/workflows/build-apk.yml` : compilation automatique de l'APK sur GitHub

## Obtenir l'APK — méthode simple (sans rien installer)
1. Créer un dépôt sur github.com et y déposer tout le contenu de ce dossier (bouton « Add file > Upload files »).
2. Onglet **Actions** → le workflow « Build APK » se lance (sinon : « Run workflow »).
3. Après ~5 min, ouvrir l'exécution terminée → section **Artifacts** → télécharger `assistant-ia-apk`.
4. Copier `app-debug.apk` sur le téléphone et l'installer (autoriser « sources inconnues »).

## Méthode locale (PC avec Node.js 20+ et Android Studio)
```
npm install
npx cap add android
npm run apk
```
APK produit : `android/app/build/outputs/apk/debug/app-debug.apk`

## Configuration dans l'app (⚙)
Saisir au moins une clé API. Ordre de bascule modifiable (↑ ↓).

| IA | Gratuit ? | Clé |
|---|---|---|
| Google Gemini | Oui (quota quotidien) | aistudio.google.com/apikey |
| Mistral | Oui (offre Experiment) | console.mistral.ai |
| DeepSeek via OpenRouter | Oui (modèles `:free`) | openrouter.ai/keys |
| Groq (Llama) | Oui | console.groq.com/keys |
| DeepSeek officiel | Payant (peu cher) | platform.deepseek.com |
| ChatGPT / OpenAI | Payant | platform.openai.com |

Bascule : en cas de quota atteint (429), crédit épuisé (402), clé refusée, panne ou erreur réseau, l'app passe à l'IA suivante et met la précédente en pause (15 min pour un quota, 6 h pour un crédit épuisé).
