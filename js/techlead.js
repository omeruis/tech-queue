/**
 * Logique de l'interface Techlead
 */
class TechleadApp {
    constructor() {
        // Services
        this.peerService = new PeerService();
        this.storage = storageService;
        this.notifications = notificationService;
        
        // Données
        this.techleadId = localStorage.getItem('techleadId');
        this.expertise = localStorage.getItem('expertise');
        this.isAvailable = true;
        this.currentRequestId = null;
        this.activeChat = null;
        
        // Éléments du DOM
        this.queueListElement = document.getElementById('queue-list');
        this.historyListElement = document.getElementById('history-list');
        this.detailsElement = document.getElementById('request-details');
        this.chatPanelElement = document.getElementById('chat-panel');
        
        // Vérifier si l'utilisateur est connecté
        if (!this.techleadId) {
            window.location.href = 'index.html';
            return;
        }
        
        // Initialiser l'application
        this.initializeApp();
    }
    
    /**
     * Initialise l'application
     */
    async initializeApp() {
        // Mettre à jour les informations du techlead dans l'interface
        this.updateTechleadInfo();
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
        
        // Initialiser la connexion P2P
        try {
            await this.peerService.initialize(this.techleadId);
            this.notifications.success('Connecté au réseau P2P avec succès');
            
            // Sauvegarder les informations du techlead
            this.saveTechleadInfo();
            
            // Charger les demandes et l'historique
            this.loadRequests();
            this.loadHistory();

            // Démarrer les mises à jour périodiques des positions dans la file d'attente
            this.startQueuePositionUpdates();
            
            // Configurer les écouteurs pour les événements PeerJS
            this.setupPeerListeners();
        } catch (error) {
            this.notifications.error(`Erreur de connexion P2P: ${error.message}`);
        }
    }
    
    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Bouton de déconnexion
        document.getElementById('logout-button').addEventListener('click', () => this.logout());
        
        // Toggle de statut
        document.getElementById('status-checkbox').addEventListener('change', (e) => {
            this.isAvailable = e.target.checked;
            document.getElementById('status-text').textContent = this.isAvailable ? 'Disponible' : 'Indisponible';
            this.updateTechleadStatus();
        });
        
        // Filtres de demandes
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Retirer la classe active des autres boutons
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                e.target.classList.add('active');
                // Filtrer les demandes
                this.filterRequests(e.target.dataset.filter);
            });
        });
        
        // Actions de détail
        document.getElementById('start-button').addEventListener('click', () => this.startRequest());
        document.getElementById('resolve-button').addEventListener('click', () => this.resolveRequest());
        document.getElementById('chat-button').addEventListener('click', () => this.openChat());
        
        // Actions de chat
        document.getElementById('close-chat').addEventListener('click', () => this.closeChat());
        document.getElementById('send-message').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
    }
    
    /**
     * Configure les écouteurs pour les événements PeerJS
     */
    setupPeerListeners() {
        // Nouvelle connexion
        this.peerService.on('connection', (data) => {
            this.notifications.info(`Nouvelle connexion établie avec ${data.peerId}`);
        });
        
        // Réception de données
        this.peerService.on('data', (data) => {
            this.handlePeerData(data.peerId, data.data);
        });
        
        // Fermeture de connexion
        this.peerService.on('close', (data) => {
            this.notifications.info(`Connexion fermée avec ${data.peerId}`);
        });
        
        // Erreur
        this.peerService.on('error', (data) => {
            this.notifications.error(`Erreur de connexion avec ${data.peerId}: ${data.error.message}`);
        });
    }
    
    /**
     * Gère les données reçues d'un pair
     * @param {string} peerId - ID du pair
     * @param {Object} data - Données reçues
     */
    handlePeerData(peerId, data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'new_request':
                this.handleNewRequest(data.request);
                break;
            case 'cancel_request':
                this.handleCancelRequest(data.requestId);
                break;
            case 'message':
                this.handleNewMessage(data.message);
                break;
            case 'feedback':
                this.handleFeedback(data.feedback);
                break;
            case 'developer_search':
                this.handleDeveloperSearch(peerId, data.expertise);
                break;
        }
    }
    
    /**
     * Met à jour les informations du techlead dans l'interface
     */
    updateTechleadInfo() {
        document.getElementById('techlead-id-display').textContent = `ID: ${this.techleadId}`;
        document.getElementById('expertise-display').textContent = `Expertise: ${this.expertise || 'Non spécifiée'}`;
        document.getElementById('status-text').textContent = this.isAvailable ? 'Disponible' : 'Indisponible';
        document.getElementById('status-checkbox').checked = this.isAvailable;
    }
    
    /**
     * Sauvegarde les informations du techlead
     */
    saveTechleadInfo() {
        const techleadInfo = DataModels.createTechlead({
            id: this.techleadId,
            expertise: Utils.parseExpertise(this.expertise),
            isAvailable: this.isAvailable,
            lastSeen: new Date().toISOString()
        });
        
        this.storage.save('techlead_info', techleadInfo);
        
        // Diffuser le statut
        this.broadcastTechleadStatus();
    }
    
    /**
     * Met à jour le statut du techlead et le diffuse
     */
    updateTechleadStatus() {
        this.saveTechleadInfo();
        this.broadcastTechleadStatus();
    }
    
    /**
     * Diffuse le statut du techlead
     */
    broadcastTechleadStatus() {
        const statusData = {
            type: 'techlead_status',
            techleadId: this.techleadId,
            expertise: Utils.parseExpertise(this.expertise),
            isAvailable: this.isAvailable,
            lastSeen: new Date().toISOString()
        };
        
        this.peerService.broadcast(statusData);
    }
    
    /**
     * Charge les demandes depuis le stockage local
     */
    loadRequests() {
        const requests = this.storage.get('requests', []);
        const activeRequests = requests.filter(req => 
            req.techleadId === this.techleadId && 
            (req.status === 'waiting' || req.status === 'in-progress')
        );
        
        // Mettre à jour le compteur
        document.getElementById('queue-count').textContent = activeRequests.length;
        
        // Effacer la liste actuelle
        this.queueListElement.innerHTML = '';
        
        if (activeRequests.length === 0) {
            // Afficher l'état vide
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state active';
            emptyState.innerHTML = '<p>Aucune demande en attente</p>';
            this.queueListElement.appendChild(emptyState);
            return;
        }
        
        // Trier les demandes par priorité et date
        activeRequests.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Ajouter chaque demande à la liste
        activeRequests.forEach(request => {
            this.addRequestToQueue(request);
        });
    }
    
    /**
     * Ajoute une demande à la file d'attente
     * @param {Object} request - Demande à ajouter
     */
    addRequestToQueue(request) {
        const requestItem = document.createElement('div');
        requestItem.className = `request-item status-${request.status}`;
        requestItem.dataset.id = request.id;
        
        requestItem.innerHTML = `
            <div class="request-item-header">
                <div class="request-item-title">${request.title}</div>
                <div class="priority-badge ${Utils.getPriorityClass(request.priority)}">${Utils.translate(request.priority)}</div>
            </div>
            <div class="request-meta">
                <div class="request-developer">${request.developerName}</div>
                <div class="request-time">${Utils.formatDate(request.createdAt)}</div>
            </div>
        `;
        
        // Ajouter un écouteur de clic
        requestItem.addEventListener('click', () => {
            this.selectRequest(request.id);
        });
        
        this.queueListElement.appendChild(requestItem);
    }
    
    /**
     * Sélectionne une demande et affiche ses détails
     * @param {string} requestId - ID de la demande
     */
    selectRequest(requestId) {
        // Retirer la sélection précédente
        document.querySelectorAll('.request-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner la nouvelle demande
        const requestItem = document.querySelector(`.request-item[data-id="${requestId}"]`);
        if (requestItem) {
            requestItem.classList.add('selected');
        }
        
        // Stocker l'ID de la demande active
        this.currentRequestId = requestId;
        
        // Récupérer les données de la demande
        const requests = this.storage.get('requests', []);
        const request = requests.find(req => req.id === requestId);
        
        if (!request) {
            this.notifications.error('Demande non trouvée');
            return;
        }
        
        // Mettre à jour les détails
        this.updateRequestDetails(request);
    }
    
    /**
     * Met à jour l'affichage des détails d'une demande
     * @param {Object} request - Demande à afficher
     */
    updateRequestDetails(request) {
        // Masquer l'état vide et afficher le contenu
        this.detailsElement.querySelector('.empty-state').classList.remove('active');
        this.detailsElement.querySelector('.details-content').classList.add('active');
        
        // Mettre à jour les champs
        document.getElementById('details-title').textContent = request.title;
        document.getElementById('details-priority').textContent = Utils.translate(request.priority);
        document.getElementById('details-priority').className = `priority-badge ${Utils.getPriorityClass(request.priority)}`;
        document.getElementById('details-developer').textContent = request.developerName;
        document.getElementById('details-team').textContent = request.developerTeam || 'Non spécifiée';
        document.getElementById('details-time').textContent = Utils.formatDate(request.createdAt);
        document.getElementById('details-description').textContent = request.description;
        
        // Gérer l'affichage du code
        const codeSection = document.getElementById('details-code-section');
        if (request.code) {
            codeSection.style.display = 'block';
            document.getElementById('details-code').textContent = request.code;
        } else {
            codeSection.style.display = 'none';
        }
        
        // Gérer l'affichage de la capture d'écran
        const screenshotSection = document.getElementById('details-screenshot-section');
        if (request.screenshot) {
            screenshotSection.style.display = 'block';
            document.getElementById('details-screenshot').src = request.screenshot;
        } else {
            screenshotSection.style.display = 'none';
        }
        
        // Mettre à jour les boutons d'action en fonction du statut
        const startButton = document.getElementById('start-button');
        const resolveButton = document.getElementById('resolve-button');
        
        if (request.status === 'waiting') {
            startButton.style.display = 'block';
            resolveButton.style.display = 'none';
        } else if (request.status === 'in-progress') {
            startButton.style.display = 'none';
            resolveButton.style.display = 'block';
        } else {
            startButton.style.display = 'none';
            resolveButton.style.display = 'none';
        }
    }
    
    /**
     * Filtre les demandes affichées selon le critère spécifié
     * @param {string} filter - Critère de filtrage (all, waiting, in-progress)
     */
    filterRequests(filter) {
        const requestItems = document.querySelectorAll('.request-item');
        
        requestItems.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'block';
            } else if (filter === 'waiting') {
                item.style.display = item.classList.contains('status-waiting') ? 'block' : 'none';
            } else if (filter === 'in-progress') {
                item.style.display = item.classList.contains('status-in-progress') ? 'block' : 'none';
            }
        });
    }
    
    /**
     * Prend en charge une demande
     */
    startRequest() {
        if (!this.currentRequestId) {
            this.notifications.warning('Aucune demande sélectionnée');
            return;
        }
        
        // Récupérer la demande
        const requests = this.storage.get('requests', []);
        const requestIndex = requests.findIndex(req => req.id === this.currentRequestId);
        
        if (requestIndex === -1) {
            this.notifications.error('Demande non trouvée');
            return;
        }
        
        // Mettre à jour le statut de la demande
        const request = requests[requestIndex];
        request.status = 'in-progress';
        request.startedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        
        // Sauvegarder les modifications
        this.storage.save('requests', requests);
        
        // Mettre à jour l'interface
        this.updateRequestUI(request);
        
        // Notifier le développeur
        this.sendRequestUpdate(request);
        
        this.notifications.success('Demande prise en charge');

        // Mettre à jour les positions dans la file d'attente
        this.updateQueuePositions();
    }
    
    /**
     * Marque une demande comme résolue
     */
    resolveRequest() {
        if (!this.currentRequestId) {
            this.notifications.warning('Aucune demande sélectionnée');
            return;
        }
        
        // Récupérer la demande
        const requests = this.storage.get('requests', []);
        const requestIndex = requests.findIndex(req => req.id === this.currentRequestId);
        
        if (requestIndex === -1) {
            this.notifications.error('Demande non trouvée');
            return;
        }
        
        // Mettre à jour le statut de la demande
        const request = requests[requestIndex];
        request.status = 'resolved';
        request.resolvedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        
        // Sauvegarder les modifications
        this.storage.save('requests', requests);
        
        // Mettre à jour l'interface
        this.updateRequestUI(request);
        
        // Ajouter à l'historique
        this.addRequestToHistory(request);
        
        // Notifier le développeur
        this.sendRequestUpdate(request);
        
        this.notifications.success('Demande résolue');

        // Mettre à jour les positions dans la file d'attente
        this.updateQueuePositions();
    }
    
    /**
     * Met à jour l'interface après une modification de demande
     * @param {Object} request - Demande mise à jour
     */
    updateRequestUI(request) {
        // Mettre à jour l'affichage des détails
        this.updateRequestDetails(request);
        
        // Mettre à jour l'élément dans la liste
        const requestItem = document.querySelector(`.request-item[data-id="${request.id}"]`);
        
        if (requestItem) {
            // Mettre à jour la classe de statut
            requestItem.className = `request-item status-${request.status} selected`;
            
            // Si la demande est résolue, la retirer de la liste après un délai
            if (request.status === 'resolved' || request.status === 'closed' || request.status === 'cancelled') {
                setTimeout(() => {
                    if (requestItem.parentNode) {
                        requestItem.parentNode.removeChild(requestItem);
                    }
                    
                    // Vérifier si la liste est vide
                    if (this.queueListElement.querySelectorAll('.request-item').length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state active';
                        emptyState.innerHTML = '<p>Aucune demande en attente</p>';
                        this.queueListElement.appendChild(emptyState);
                    }
                    
                    // Mettre à jour le compteur
                    this.updateQueueCount();
                }, 1000);
            }
        }
    }

    /**
     * Met à jour et envoie les positions dans la file d'attente
     */
    updateQueuePositions() {
        const requests = this.storage.get('requests', []);
        
        // Regrouper les demandes par techlead
        const requestsByTechlead = {};
        
        requests.forEach(req => {
            if (req.status === 'waiting') {
                if (!requestsByTechlead[req.techleadId]) {
                    requestsByTechlead[req.techleadId] = [];
                }
                requestsByTechlead[req.techleadId].push(req);
            }
        });
        
        // Pour chaque techlead, traiter sa file d'attente
        Object.keys(requestsByTechlead).forEach(techleadId => {
            const waitingRequests = requestsByTechlead[techleadId];
            
            // Trier les demandes par priorité et date
            waitingRequests.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            
            // Si c'est ce techlead, envoyer les positions à tous les développeurs concernés
            if (techleadId === this.techleadId) {
                // Attribuer les positions et envoyer les mises à jour
                waitingRequests.forEach((request, index) => {
                    const position = index + 1;
                    
                    // Envoyer la mise à jour au développeur
                    this.peerService.sendData(request.developerId, {
                        type: 'queue_position',
                        requestId: request.id,
                        position: position,
                        estimatedTime: Utils.estimateWaitTime(position)
                    }).catch(error => {
                        console.error('Erreur lors de l\'envoi de la position:', error);
                    });
                });
            }
        });
    }
    
    /**
     * Met à jour le compteur de demandes
     */
    updateQueueCount() {
        const requests = this.storage.get('requests', []);
        const activeCount = requests.filter(req => 
            req.techleadId === this.techleadId && 
            (req.status === 'waiting' || req.status === 'in-progress')
        ).length;
        
        document.getElementById('queue-count').textContent = activeCount;
    }
    
    /**
     * Envoie une mise à jour de demande au développeur
     * @param {Object} request - Demande mise à jour
     */
    sendRequestUpdate(request) {
        if (!request.developerId) return;
        
        const updateData = {
            type: 'request_update',
            request: request
        };
        
        this.peerService.sendData(request.developerId, updateData)
            .catch(error => {
                console.error('Erreur lors de l\'envoi de la mise à jour:', error);
            });
    }
    
    /**
     * Charge l'historique des demandes résolues
     */
    loadHistory() {
        const requests = this.storage.get('requests', []);
        const historyRequests = requests.filter(req => 
            req.techleadId === this.techleadId && 
            (req.status === 'resolved' || req.status === 'closed')
        );
        
        // Mettre à jour le compteur
        document.getElementById('history-count').textContent = historyRequests.length;
        
        // Effacer la liste actuelle
        this.historyListElement.innerHTML = '';
        
        if (historyRequests.length === 0) {
            // Afficher l'état vide
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state active';
            emptyState.innerHTML = '<p>Aucune demande résolue</p>';
            this.historyListElement.appendChild(emptyState);
            return;
        }
        
        // Trier les demandes par date de résolution (la plus récente en premier)
        historyRequests.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
        
        // Ajouter chaque demande à l'historique
        historyRequests.forEach(request => {
            this.addRequestToHistory(request, false);
        });
    }
    
    /**
     * Ajoute une demande à l'historique
     * @param {Object} request - Demande à ajouter
     * @param {boolean} prepend - Si true, ajoute au début de la liste
     */
    addRequestToHistory(request, prepend = true) {
        // Masquer l'état vide si présent
        const emptyState = this.historyListElement.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = request.id;
        
        // Calculer le temps de résolution
        let resolutionTime = '';
        if (request.startedAt && request.resolvedAt) {
            resolutionTime = Utils.getElapsedTime(request.startedAt, request.resolvedAt);
        }
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${request.title}</div>
                <div class="priority-badge ${Utils.getPriorityClass(request.priority)}">${Utils.translate(request.priority)}</div>
            </div>
            <div class="history-meta">
                <div>${request.developerName} (${request.developerTeam || 'Non spécifiée'})</div>
                <div>Résolu le: ${Utils.formatDate(request.resolvedAt)}</div>
                <div class="resolution-time">Temps de résolution: ${resolutionTime}</div>
            </div>
        `;
        
        if (prepend && this.historyListElement.firstChild) {
            this.historyListElement.insertBefore(historyItem, this.historyListElement.firstChild);
        } else {
            this.historyListElement.appendChild(historyItem);
        }
        
        // Mettre à jour le compteur
        const count = this.historyListElement.querySelectorAll('.history-item').length;
        document.getElementById('history-count').textContent = count;
    }
    
    /**
     * Gère une nouvelle demande reçue
     * @param {Object} request - Nouvelle demande
     */
    handleNewRequest(request) {
        // Vérifier que la demande nous est adressée
        if (request.techleadId !== this.techleadId) return;
        
        // Sauvegarder la demande
        const requests = this.storage.get('requests', []);
        
        // Vérifier si la demande existe déjà
        const existingIndex = requests.findIndex(req => req.id === request.id);
        
        if (existingIndex >= 0) {
            // Mettre à jour la demande existante
            requests[existingIndex] = request;
        } else {
            // Ajouter la nouvelle demande
            requests.push(request);
            
            // Notifier
            this.notifications.showBrowserNotification(
                'Nouvelle demande d\'assistance',
                `${request.developerName} a besoin d'aide avec: ${request.title}`,
                {
                    onClick: () => {
                        window.focus();
                        this.selectRequest(request.id);
                    }
                }
            );
        }
        
        // Sauvegarder les modifications
        this.storage.save('requests', requests);
        
        // Mettre à jour l'interface
        this.loadRequests();

        // Mettre à jour les positions dans la file d'attente
        this.updateQueuePositions();
    }
    
    /**
     * Gère l'annulation d'une demande
     * @param {string} requestId - ID de la demande annulée
     */
    handleCancelRequest(requestId) {
        // Récupérer la demande
        const requests = this.storage.get('requests', []);
        const requestIndex = requests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) return;
        
        // Mettre à jour le statut de la demande
        requests[requestIndex].status = 'cancelled';
        requests[requestIndex].updatedAt = new Date().toISOString();
        
        // Sauvegarder les modifications
        this.storage.save('requests', requests);
        
        // Mettre à jour l'interface
        this.loadRequests();

        // Mettre à jour les positions dans la file d'attente
        this.updateQueuePositions();
        
        // Si la demande était sélectionnée, effacer les détails
        if (this.currentRequestId === requestId) {
            this.clearRequestDetails();
        }
        
        this.notifications.info('Une demande a été annulée par le développeur');
    }
    
    /**
     * Efface les détails de la demande
     */
    clearRequestDetails() {
        this.currentRequestId = null;
        this.detailsElement.querySelector('.empty-state').classList.add('active');
        this.detailsElement.querySelector('.details-content').classList.remove('active');
    }

    /**
     * Démarre l'envoi périodique des positions dans la file d'attente
     */
    startQueuePositionUpdates() {
        // Envoyer les positions toutes les 30 secondes
        this.queueUpdateInterval = setInterval(() => {
            this.updateQueuePositions();
        }, 60000); // 30 secondes
    }

    /**
     * Arrête l'envoi périodique des positions
     */
    stopQueuePositionUpdates() {
        if (this.queueUpdateInterval) {
            clearInterval(this.queueUpdateInterval);
        }
    }
    
    /**
     * Ouvre le chat avec le développeur
     */
    openChat() {
        if (!this.currentRequestId) {
            this.notifications.warning('Aucune demande sélectionnée');
            return;
        }
        
        // Récupérer la demande
        const requests = this.storage.get('requests', []);
        const request = requests.find(req => req.id === this.currentRequestId);
        
        if (!request) {
            this.notifications.error('Demande non trouvée');
            return;
        }
        
        // Stocker les informations du chat actif
        this.activeChat = {
            requestId: request.id,
            developerId: request.developerId,
            developerName: request.developerName
        };
        
        // Mettre à jour l'interface du chat
        document.getElementById('chat-with').textContent = request.developerName;
        
        // Charger les messages
        this.loadChatMessages();
        
        // Afficher le panneau de chat
        this.chatPanelElement.classList.add('active');
    }
    
    /**
     * Ferme le chat
     */
    closeChat() {
        this.chatPanelElement.classList.remove('active');
        this.activeChat = null;
    }
    
    /**
     * Charge les messages du chat
     */
    loadChatMessages() {
        if (!this.activeChat) return;
        
        const messages = this.storage.get('messages', []);
        const chatMessages = messages.filter(msg => msg.requestId === this.activeChat.requestId);
        
        // Trier par date
        chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Effacer les messages actuels
        const chatMessagesElement = document.getElementById('chat-messages');
        chatMessagesElement.innerHTML = '';
        
        // Afficher les messages
        chatMessages.forEach(message => {
            this.addMessageToChat(message);
        });
        
        // Défiler jusqu'au bas
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }
    
    /**
     * Ajoute un message au chat
     * @param {Object} message - Message à ajouter
     */
    addMessageToChat(message) {
        const chatMessagesElement = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        
        // Déterminer si le message a été envoyé par le techlead
        const isSent = message.senderId === this.techleadId;
        
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${Utils.formatDate(message.timestamp)}</div>
        `;
        
        chatMessagesElement.appendChild(messageElement);
        
        // Défiler jusqu'au bas
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }
    
    /**
     * Envoie un message dans le chat
     */
    sendChatMessage() {
        if (!this.activeChat) return;
        
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        // Créer le message
        const message = DataModels.createMessage({
            senderId: this.techleadId,
            senderName: 'Techlead',
            receiverId: this.activeChat.developerId,
            content: content,
            requestId: this.activeChat.requestId
        });
        
        // Sauvegarder le message
        const messages = this.storage.get('messages', []);
        messages.push(message);
        this.storage.save('messages', messages);
        
        // Ajouter le message au chat
        this.addMessageToChat(message);
        
        // Envoyer le message au développeur
        this.peerService.sendData(this.activeChat.developerId, {
            type: 'message',
            message: message
        }).catch(error => {
            console.error('Erreur lors de l\'envoi du message:', error);
            this.notifications.error('Impossible d\'envoyer le message');
        });
        
        // Effacer le champ de saisie
        messageInput.value = '';
        messageInput.focus();
    }
    
    /**
     * Gère un nouveau message reçu
     * @param {Object} message - Message reçu
     */
    handleNewMessage(message) {
        // Vérifier que le message nous est adressé
        if (message.receiverId !== this.techleadId) return;
        
        // Sauvegarder le message
        const messages = this.storage.get('messages', []);
        messages.push(message);
        this.storage.save('messages', messages);
        
        // Si le chat est ouvert et correspond au même développeur, ajouter le message
        if (this.activeChat && this.activeChat.developerId === message.senderId) {
            this.addMessageToChat(message);
        } else {
            // Notifier
            this.notifications.showBrowserNotification(
                'Nouveau message',
                `${message.senderName}: ${Utils.truncateText(message.content, 50)}`,
                {
                    onClick: () => {
                        window.focus();
                        // Trouver la demande associée et ouvrir le chat
                        const requests = this.storage.get('requests', []);
                        const request = requests.find(req => req.id === message.requestId);
                        if (request) {
                            this.selectRequest(request.id);
                            this.openChat();
                        }
                    }
                }
            );
        }
    }
    
    /**
     * Gère un feedback reçu
     * @param {Object} feedback - Feedback reçu
     */
    handleFeedback(feedback) {
        // Vérifier que le feedback nous est adressé
        if (feedback.techleadId !== this.techleadId) return;
        
        // Sauvegarder le feedback
        const feedbacks = this.storage.get('feedbacks', []);
        feedbacks.push(feedback);
        this.storage.save('feedbacks', feedbacks);
        
        // Notifier
        this.notifications.success(`Feedback reçu: ${feedback.rating}/5 étoiles`);
    }
    
    /**
     * Gère une recherche de techlead par un développeur
     * @param {string} developerId - ID du développeur
     * @param {Array} expertise - Domaines d'expertise recherchés
     */
    handleDeveloperSearch(developerId, expertise) {
        // Vérifier si nous sommes disponibles
        if (!this.isAvailable) return;
        
        // Vérifier si notre expertise correspond
        const myExpertise = Utils.parseExpertise(this.expertise);
        
        // Si aucune expertise spécifiée ou s'il y a une correspondance
        if (!expertise || expertise.length === 0 || 
            myExpertise.some(exp => expertise.includes(exp.toLowerCase()))) {
            
            // Répondre avec nos informations
            const techleadInfo = {
                type: 'techlead_info',
                techleadId: this.techleadId,
                expertise: myExpertise,
                isAvailable: this.isAvailable
            };
            
            this.peerService.sendData(developerId, techleadInfo)
                .catch(error => {
                    console.error('Erreur lors de la réponse à la recherche:', error);
                });
        }
    }
    
    /**
     * Déconnexion
     */
    logout() {
        stopQueuePositionUpdates();
        // Détruire la connexion P2P
        this.peerService.destroy();
        
        // Effacer les données de session
        localStorage.removeItem('techleadId');
        localStorage.removeItem('expertise');
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new TechleadApp();
});