# TechQueue - Système de Gestion d'Assistance Technique

## Vue d'ensemble

TechQueue est une application web P2P (peer-to-peer) permettant de gérer efficacement les demandes d'assistance technique au sein d'une équipe de développement. L'application facilite la communication entre les développeurs qui ont besoin d'aide et les techleads qui fournissent le support technique.

## Architecture

### Type d'application
- Application web monopage (SPA) basée sur du JavaScript vanilla
- Communication P2P via PeerJS (WebRTC)
- Stockage local avec localStorage
- Aucun backend serveur requis (sauf le serveur de signaling PeerJS)

### Structure des fichiers

```
tech-queue/
├── index.html              # Page d'accueil et sélection de rôle
├── developer.html          # Interface développeur
├── techlead.html          # Interface techlead
├── css/
│   ├── style.css          # Styles communs
│   ├── developer.css      # Styles interface développeur
│   └── techlead.css       # Styles interface techlead
└── js/
    ├── common.js          # Utilitaires et modèles de données
    ├── peer-service.js    # Service de gestion P2P
    ├── storage.js         # Gestion du stockage local
    ├── notifications.js   # Système de notifications
    ├── developer.js       # Logique interface développeur
    └── techlead.js        # Logique interface techlead
```

## Fonctionnalités principales

### Pour les développeurs

1. **Soumission de demandes d'assistance**
   - Titre et description détaillée
   - Niveaux d'urgence (faible, moyen, élevé)
   - Ajout de code (snippets)
   - Upload de captures d'écran
   - Recherche de techleads par ID ou domaine d'expertise

2. **Suivi des demandes**
   - Visualisation du statut en temps réel
   - Position dans la file d'attente
   - Estimation du temps d'attente
   - Historique des demandes précédentes

3. **Communication**
   - Chat en temps réel avec le techlead assigné
   - Notifications de changement de statut
   - Système de feedback après résolution

### Pour les techleads

1. **Gestion de la file d'attente**
   - Visualisation de toutes les demandes en attente
   - Filtres par statut (toutes, en attente, en cours)
   - Compteur de demandes actives
   - Priorisation automatique par urgence

2. **Traitement des demandes**
   - Prise en charge des demandes
   - Visualisation détaillée (description, code, captures)
   - Marquage comme résolu
   - Indicateur de disponibilité (disponible/indisponible)

3. **Communication**
   - Chat bidirectionnel avec les développeurs
   - Notifications de nouvelles demandes
   - Historique des demandes résolues

## Modèles de données

### Request (Demande)
```javascript
{
    id: string,                    // Identifiant unique
    title: string,                 // Titre de la demande
    description: string,           // Description détaillée
    priority: 'low'|'medium'|'high', // Niveau d'urgence
    status: 'waiting'|'in-progress'|'resolved'|'cancelled', // Statut
    code: string|null,             // Code partagé
    screenshot: string|null,       // Capture d'écran (base64)
    developerId: string,           // ID du développeur
    developerName: string,         // Nom du développeur
    developerTeam: string,         // Équipe du développeur
    techleadId: string,            // ID du techlead assigné
    createdAt: ISO8601,            // Date de création
    updatedAt: ISO8601,            // Date de mise à jour
    startedAt: ISO8601|null,       // Date de prise en charge
    resolvedAt: ISO8601|null       // Date de résolution
}
```

### Message (Chat)
```javascript
{
    id: string,                    // Identifiant unique
    senderId: string,              // ID de l'expéditeur
    senderName: string,            // Nom de l'expéditeur
    receiverId: string,            // ID du destinataire
    content: string,               // Contenu du message
    timestamp: ISO8601,            // Horodatage
    requestId: string,             // ID de la demande associée
    isRead: boolean                // Statut de lecture
}
```

### Techlead
```javascript
{
    id: string,                    // Identifiant unique
    expertise: string[],           // Domaines d'expertise
    isAvailable: boolean,          // Disponibilité
    lastSeen: ISO8601              // Dernière connexion
}
```

### Feedback
```javascript
{
    id: string,                    // Identifiant unique
    requestId: string,             // ID de la demande
    rating: number,                // Note (1-5 étoiles)
    comment: string,               // Commentaire
    developerId: string,           // ID du développeur
    techleadId: string,            // ID du techlead
    timestamp: ISO8601             // Horodatage
}
```

## Technologies utilisées

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **P2P**: PeerJS 1.4.7 (WebRTC wrapper)
- **Stockage**: localStorage API
- **UI**: CSS personnalisé avec design moderne

## Flux de données P2P

### Connexion
1. Le techlead s'initialise avec un peer ID unique
2. Le développeur recherche le techlead par ID
3. Le développeur établit une connexion P2P
4. Les deux parties échangent des données directement

### Types de messages P2P
- `new-request`: Nouvelle demande d'assistance
- `update-request`: Mise à jour du statut
- `chat-message`: Message de chat
- `request-resolved`: Demande marquée comme résolue
- `request-cancelled`: Demande annulée

## Installation et utilisation

### Prérequis
- Navigateur moderne supportant WebRTC (Chrome, Firefox, Safari, Edge)
- Serveur web local ou hébergement web

### Démarrage rapide
1. Cloner le dépôt ou télécharger les fichiers
2. Ouvrir `index.html` dans un navigateur
3. Choisir le rôle (Techlead ou Développeur)
4. Suivre les instructions à l'écran

### Mode Techlead
1. Entrer un ID unique (ex: `techlead-react`)
2. Définir les domaines d'expertise (ex: `React, Node.js, API`)
3. Gérer les demandes entrantes depuis le tableau de bord

### Mode Développeur
1. Entrer votre nom et équipe
2. Rechercher un techlead disponible
3. Soumettre une demande avec détails et priorité
4. Suivre l'évolution en temps réel

## Sécurité et limitations

### Points de sécurité
- Connexions P2P chiffrées via WebRTC
- Données stockées localement sur l'appareil
- Pas de transmission de données sensibles vers un serveur central

### Limitations actuelles
- Nécessite que les deux parties soient en ligne simultanément
- Pas de persistance des données entre sessions (stockage local uniquement)
- Dépend de la disponibilité du serveur de signaling PeerJS public
- Pas d'authentification forte

## Guide de développement

### Ajouter une nouvelle fonctionnalité

1. **Côté données**: Mettre à jour les modèles dans `js/common.js`
2. **Côté UI**: Modifier les fichiers HTML et CSS appropriés
3. **Côté logique**: Implémenter dans `js/developer.js` ou `js/techlead.js`
4. **Côté P2P**: Ajouter les nouveaux types de messages dans `js/peer-service.js`

### Conventions de code
- Utiliser des noms descriptifs en français pour l'UI
- Commenter les fonctions importantes avec JSDoc
- Suivre les modèles de données existants
- Gérer les erreurs avec try/catch et afficher des messages utilisateurs clairs

## Support et contribution

Pour signaler des bugs ou suggérer des améliorations:
- Ouvrir une issue sur le dépôt GitHub
- Contacter l'équipe de développement

## Licence

À définir selon les besoins du projet.
