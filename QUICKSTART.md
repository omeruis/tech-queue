# 🚀 Démarrage Rapide - TechQueue

## Le problème que vous rencontrez

Si vous voyez l'erreur **ERR_FAILED** ou **"Ce site est inaccessible"**, c'est parce que **vous devez démarrer un serveur HTTP local** pour utiliser TechQueue.

> ⚠️ **Important** : Vous ne pouvez PAS simplement ouvrir `index.html` directement dans votre navigateur. Les fonctionnalités PWA, le service worker et les modules JavaScript nécessitent un serveur HTTP.

## Solution : Démarrer le serveur

### Option 1 : Script automatique (RECOMMANDÉ)

**Sur Linux/Mac :**
```bash
./start-server.sh
```

**Sur Windows :**
```bash
start-server.bat
```

Double-cliquez sur le fichier ou exécutez-le depuis le terminal.

### Option 2 : Commande manuelle

Choisissez l'une de ces commandes selon les outils installés sur votre machine :

**Avec Python 3 (recommandé) :**
```bash
python3 -m http.server 3000
```

**Avec Python 2 :**
```bash
python -m SimpleHTTPServer 3000
```

**Avec Node.js :**
```bash
npx serve -p 3000
```

**Avec PHP :**
```bash
php -S localhost:3000
```

## Une fois le serveur démarré

1. Ouvrez votre navigateur
2. Accédez à : **http://localhost:3000**
3. Choisissez votre rôle (Techlead ou Développeur)
4. Remplissez les informations demandées
5. Cliquez sur "Continuer comme Techlead" ou "Continuer comme Développeur"

## Vérifier que le serveur fonctionne

Vous devriez voir dans votre terminal :
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

## Si vous avez encore des problèmes

### Problème : Le cache du navigateur est corrompu

**Solution :** Accédez à http://localhost:3000/clear-cache.html et cliquez sur "Vider tous les caches"

### Problème : Le port 3000 est déjà utilisé

**Solution :** Utilisez un autre port
```bash
python3 -m http.server 8000
```
Puis accédez à http://localhost:8000

### Problème : ERR_FAILED persiste

**Solution :**
1. Arrêtez le serveur (Ctrl+C)
2. Videz le cache de votre navigateur (Ctrl+Shift+Delete)
3. Fermez complètement votre navigateur
4. Redémarrez le serveur
5. Ouvrez un nouvel onglet et accédez à http://localhost:3000

## URLs importantes

- **Page d'accueil** : http://localhost:3000/
- **Interface Techlead** : http://localhost:3000/techlead.html
- **Interface Développeur** : http://localhost:3000/developer.html
- **Vider le cache** : http://localhost:3000/clear-cache.html

## Arrêter le serveur

Appuyez sur **Ctrl+C** dans le terminal où le serveur est en cours d'exécution.

## Pour les développeurs

Si vous préférez utiliser un serveur de développement plus avancé :

**Live Server (VSCode) :**
1. Installez l'extension "Live Server"
2. Clic droit sur `index.html` → "Open with Live Server"

**Browsersync :**
```bash
npm install -g browser-sync
browser-sync start --server --files "*.html, css/*.css, js/*.js"
```

---

**Vous êtes prêt à utiliser TechQueue ! 🎉**

Si vous avez d'autres questions, consultez le [README.md](README.md) principal.
