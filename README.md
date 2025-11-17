# TechQueue - Système de Gestion d'Assistance Technique

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/omeruis/tech-queue)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](manifest.json)

> Application web P2P moderne de gestion de file d'attente pour l'assistance technique entre développeurs et techleads.

## 🚀 Nouvelles Fonctionnalités (v2.0)

### 🎨 Interface & UX
- ✅ **Mode sombre/clair** - Thème adaptatif avec préférence système
- ✅ **PWA** - Installable comme application native
- ✅ **Mode hors ligne** - Fonctionne sans connexion Internet
- ✅ **Raccourcis clavier** - Navigation rapide (appuyez sur `?` pour l'aide)
- ✅ **Recherche rapide** - Recherche globale avec `Ctrl+K`

### 💬 Chat Amélioré
- ✅ **Support Markdown** - Formatage de texte riche
- ✅ **Coloration syntaxique** - Code coloré automatiquement
- ✅ **Indicateur de saisie** - Voyez quand quelqu'un écrit
- ✅ **Partage de fichiers** - Images et documents
- ✅ **Historique persistant** - Conversations sauvegardées

### 🏷️ Organisation
- ✅ **Système de tags** - Catégorisez vos demandes
- ✅ **Recherche avancée** - Filtres multiples
- ✅ **Priorité automatique** - File d'attente intelligente
- ✅ **Base de connaissance** - FAQ et solutions réutilisables

### 📊 Analytics & Gamification
- ✅ **Statistiques détaillées** - Temps de résolution, satisfaction, etc.
- ✅ **Système de badges** - Débloquez des succès
- ✅ **Points et niveaux** - Progression motivante
- ✅ **Classements** - Comparez vos performances

### 🔔 Notifications
- ✅ **Notifications push** - Alertes du navigateur
- ✅ **Notifications sonores** - Sons personnalisables
- ✅ **Badges de notifications** - Compteurs non lus

### 💾 Persistance
- ✅ **IndexedDB** - Stockage local avancé
- ✅ **Export de données** - JSON, CSV, HTML
- ✅ **Synchronisation** - Cloud ready
- ✅ **Import/Export** - Sauvegarde complète

## 📋 Table des Matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Développement](#développement)
- [Documentation](#documentation)

## 🛠️ Installation

> ⚠️ **IMPORTANT** : TechQueue nécessite un serveur HTTP local. Vous ne pouvez PAS simplement ouvrir `index.html` directement.
>
> 👉 **[Voir le guide de démarrage rapide (QUICKSTART.md)](QUICKSTART.md)** pour résoudre les problèmes d'accès

### Méthode 1 : Script automatique (RECOMMANDÉ)

1. Clonez le dépôt :
```bash
git clone https://github.com/omeruis/tech-queue.git
cd tech-queue
```

2. Démarrez le serveur avec le script :
```bash
# Linux/Mac
./start-server.sh

# Windows
start-server.bat
```

3. Ouvrez votre navigateur et accédez à **http://localhost:3000**

4. (Optionnel) Installez comme PWA :
   - Cliquez sur le bouton "Installer l'application" dans la barre d'adresse
   - Ou utilisez le bouton d'installation qui apparaît dans l'application

### Méthode 2 : Commande manuelle

Pour bénéficier de toutes les fonctionnalités PWA :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve

# Avec PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

## 📖 Utilisation

### Démarrage Rapide

1. **Choisissez votre rôle** sur la page d'accueil
   - **Techlead** : Répondez aux demandes d'assistance
   - **Développeur** : Soumettez vos demandes

2. **Configuration**
   - Entrez votre ID/nom
   - Définissez vos expertises (pour techleads)
   - Activez les notifications (recommandé)

3. **Commencez à utiliser**
   - Créez des demandes avec tags
   - Chattez en temps réel
   - Consultez la base de connaissance

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `?` | Afficher l'aide |
| `Ctrl+K` | Recherche rapide |
| `n` | Nouvelle demande |
| `c` | Ouvrir/fermer le chat |
| `t` | Basculer le thème |
| `Esc` | Fermer les modales |
| `Ctrl+Enter` | Envoyer un message |
| `h` | Aller à l'accueil |
| `↑/↓` | Naviguer dans les demandes |

## ⚡ Fonctionnalités Principales

### Pour les Développeurs

#### Création de Demandes
- Titre et description détaillée
- 3 niveaux de priorité (faible, moyen, élevé)
- Ajout de code (avec coloration syntaxique)
- Upload de captures d'écran
- Tags personnalisables
- Recherche de techleads par expertise

#### Suivi
- Position en temps réel dans la file
- Estimation du temps d'attente
- Notifications de changement de statut
- Historique complet
- Chat direct avec le techlead

#### Base de Connaissance
- Recherche de solutions existantes
- Suggestions automatiques
- Création d'articles depuis demandes résolues

### Pour les Techleads

#### Gestion de File
- Vue d'ensemble des demandes
- Filtres par statut et priorité
- Tri automatique par urgence
- Compteurs en temps réel

#### Traitement
- Détails complets des demandes
- Prise en charge instantanée
- Marquage comme résolu
- Statut disponible/indisponible

#### Analytics
- Temps moyen de résolution
- Nombre de demandes traitées
- Note de satisfaction
- Statistiques détaillées

### Gamification

#### Badges Disponibles

| Badge | Condition | Points |
|-------|-----------|--------|
| 🎯 Première demande | Soumettre 1 demande | 10 |
| 🌟 Assistant débutant | Résoudre 5 demandes | 50 |
| ⭐ Assistant pro | Résoudre 25 demandes | 250 |
| 🏆 Expert | Résoudre 100 demandes | 1000 |
| ⚡ Réponse éclair | Temps moyen < 5 min | 100 |
| 💬 Grand communicateur | 100 messages échangés | 75 |
| 🌟 Très bien noté | Note moyenne ≥ 4.5/5 | 200 |
| 📚 Contributeur KB | Créer 5 articles | 150 |
| 🔥 Une semaine active | 7 jours consécutifs | 100 |
| 👍 Aide populaire | 50 votes utiles | 200 |

## 🏗️ Architecture

### Structure du Projet

```
tech-queue/
├── index.html              # Page d'accueil
├── developer.html          # Interface développeur
├── techlead.html          # Interface techlead
├── offline.html           # Page hors ligne
├── manifest.json          # Manifest PWA
├── service-worker.js      # Service Worker
├── Claude.md              # Documentation du projet
├── README.md              # Ce fichier
│
├── css/
│   ├── style.css          # Styles de base
│   ├── developer.css      # Styles développeur
│   ├── techlead.css       # Styles techlead
│   └── enhanced-features.css  # Nouvelles fonctionnalités
│
└── js/
    ├── common.js          # Utilitaires communs
    ├── peer-service.js    # Gestion P2P
    ├── storage.js         # Stockage localStorage
    ├── notifications.js   # Notifications navigateur
    ├── developer.js       # Logique développeur
    ├── techlead.js        # Logique techlead
    ├── theme.js           # Gestion des thèmes
    ├── analytics.js       # Système d'analytics
    ├── tags.js            # Gestion des tags
    ├── push-notifications.js  # Notifications push
    ├── chat-enhanced.js   # Chat amélioré
    ├── knowledge-base.js  # Base de connaissance
    ├── gamification.js    # Badges et points
    ├── keyboard-shortcuts.js  # Raccourcis clavier
    ├── indexed-db.js      # Stockage IndexedDB
    ├── data-export.js     # Export de données
    └── pwa-installer.js   # Installation PWA
```

### Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **P2P** : PeerJS 1.4.7 (WebRTC)
- **Stockage** : localStorage, IndexedDB
- **PWA** : Service Workers, Web Manifest
- **Notifications** : Push API, Notification API

### Modèles de Données

Voir [Claude.md](Claude.md) pour la documentation complète des modèles de données.

## 🔧 Développement

### Prérequis

- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Support WebRTC
- Serveur web local (pour PWA)

### Configuration Développeur

1. Clonez le dépôt
2. Ouvrez avec votre éditeur de code
3. Lancez un serveur local
4. Ouvrez les DevTools pour le débogage

### Ajouter une Fonctionnalité

1. **Modèles de données** : Mettez à jour `js/common.js`
2. **UI** : Modifiez les fichiers HTML et CSS
3. **Logique** : Implémentez dans les fichiers JS appropriés
4. **P2P** : Ajoutez les types de messages dans `js/peer-service.js`
5. **Analytics** : Trackez les événements dans `js/analytics.js`

### Tests

- Testez en mode développeur et techlead
- Vérifiez le mode hors ligne
- Testez l'installation PWA
- Vérifiez les notifications
- Testez sur mobile

## 📚 Documentation

- [Claude.md](Claude.md) - Documentation technique complète
- [Guide d'utilisation](docs/guide.md) - Guide utilisateur détaillé
- [API Reference](docs/api.md) - Documentation de l'API interne

## 🔐 Sécurité

- Connexions P2P chiffrées via WebRTC
- Pas de stockage serveur central
- Données locales uniquement
- HTTPS recommandé en production

### Limitations de Sécurité

- Pas d'authentification forte
- Les deux parties doivent être en ligne
- Dépend du serveur de signaling PeerJS public

## 📊 Performance

- **Temps de chargement** : < 2s
- **Taille totale** : ~500KB (sans images)
- **Cache** : Assets mis en cache automatiquement
- **Offline-first** : Fonctionne sans réseau

## 🗺️ Roadmap

### v2.1 (À venir)
- [ ] Appel vidéo/audio intégré
- [ ] Partage d'écran
- [ ] Collaboration multi-techleads
- [ ] Intégration Slack/Teams
- [ ] Webhooks personnalisables

### v3.0 (Futur)
- [ ] Backend optionnel (Firebase/Supabase)
- [ ] Authentification robuste
- [ ] Application mobile native
- [ ] API REST publique
- [ ] Intégration Jira/GitHub

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- **Omer Uis** - *Développement initial et améliorations v2.0*

## 🙏 Remerciements

- PeerJS pour la bibliothèque WebRTC
- La communauté open-source
- Tous les contributeurs

## 📞 Support

- 🐛 [Signaler un bug](https://github.com/omeruis/tech-queue/issues)
- 💡 [Suggérer une fonctionnalité](https://github.com/omeruis/tech-queue/issues)
- 📧 Email : support@techqueue.dev

## 🌟 Fonctionnalités Bonus

- **Export de données** : Exportez vos données en JSON, CSV ou HTML
- **Import de configuration** : Importez des paramètres prédéfinis
- **Thèmes personnalisés** : Support pour thèmes personnalisés
- **Multi-langues ready** : Architecture prête pour l'i18n

---

<p align="center">
  Fait avec ❤️ par la communauté TechQueue
</p>

<p align="center">
  <a href="https://github.com/omeruis/tech-queue">⭐ Star ce projet</a>
</p>
