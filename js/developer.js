/**
 * Logique de l'interface Développeur
 */
class DeveloperApp {
    constructor() {
        // Services
        this.peerService = new PeerService();
        this.storage = storageService;
        this.notifications = notificationService;
        
        // Données
        this.developerId = Utils.generateId();
        this.developerName = localStorage.getItem('developerName');
        this.team = localStorage.getItem('team');
        this.activeRequest = null;
        this.activeChat = null;
        this.searchResults = [];
        
        // Éléments du DOM
        this.searchResultsElement = document.getElementById('search-results');
        this.activeRequestsListElement = document.getElementById('active-requests-list');
        this.noActiveRequestsElement = document.getElementById('no-active-requests');
        this.requestTemplate = document.getElementById('active-request-template');
        this.chatPanelElement = document.getElementById('chat-panel');
        this.historyListElement = document.getElementById('history-list');
        this.feedbackModalElement = document.getElementById('feedback-modal');
        
        // Vérifier si l'utilisateur est connecté
        if (!this.developerName) {
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
        // Mettre à jour les informations du développeur dans l'interface
        this.updateDeveloperInfo();
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
        
        // Initialiser la connexion P2P
        try {
            await this.peerService.initialize(this.developerId);
            this.notifications.success('Connecté au réseau P2P avec succès');
            
            // Configurer les écouteurs pour les événements PeerJS
            this.setupPeerListeners();
            
            // Charger la demande active et l'historique
            this.loadActiveRequests();
            this.loadHistory();
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
        
        // Recherche de techlead
        document.getElementById('search-button').addEventListener('click', () => this.searchTechlead());
        document.getElementById('techlead-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchTechlead();
            }
        });
        
        // Formulaire de demande
        document.getElementById('request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });
        
        // Aperçu de capture d'écran
        document.getElementById('screenshot').addEventListener('change', (e) => {
            this.handleScreenshotUpload(e);
        });
        
        // Actions de chat
        document.getElementById('close-chat').addEventListener('click', () => this.closeChat());
        document.getElementById('send-message').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        
        // Modal de feedback
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => this.closeFeedbackModal());
        });
        document.getElementById('submit-feedback').addEventListener('click', () => this.submitFeedback());
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
            // Si c'est le techlead de notre demande active
            if (this.activeRequest && this.activeRequest.techleadId === data.peerId) {
                this.notifications.warning('La connexion avec le techlead a été perdue');
            }
        });
        
        // Erreur
        this.peerService.on('error', (data) => {
            this.notifications.error(`Erreur de connexion: ${data.error.message}`);
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
            case 'techlead_info':
                this.handleTechleadInfo(data);
                break;
            case 'request_update':
                this.handleRequestUpdate(data.request);
                break;
            case 'message':
                this.handleNewMessage(data.message);
                break;
            case 'queue_position':
                this.handleQueuePosition(data.requestId, data.position, data.estimatedTime);
                break;
        }
    }
    
    /**
     * Met à jour les informations du développeur dans l'interface
     */
    updateDeveloperInfo() {
        document.getElementById('developer-name-display').textContent = `Nom: ${this.developerName}`;
        document.getElementById('team-display').textContent = `Équipe: ${this.team || 'Non spécifiée'}`;
    }

    /**
     * Gère la mise à jour de la position dans la file d'attente
     * @param {string} requestId - ID de la demande
     * @param {number} position - Position dans la file
     * @param {string} estimatedTime - Temps d'attente estimé
     */
    handleQueuePosition(requestId, position, estimatedTime) {
        // Trouver la demande dans notre liste
        const requestIndex = this.activeRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) return;
        
        const request = this.activeRequests[requestIndex];
        const oldPosition = request.position;
        
        // Mettre à jour la position dans notre objet
        request.position = position;
        
        // Mettre à jour l'interface
        const requestCard = this.activeRequestsListElement.querySelector(`[data-request-id="${requestId}"]`);
        if (requestCard) {
            const positionElement = requestCard.querySelector('.position-number');
            positionElement.textContent = position;
            requestCard.querySelector('.estimated-time').textContent = estimatedTime;
            
            // Ajouter une animation si la position a changé
            if (oldPosition && oldPosition > position) {
                positionElement.classList.add('position-updated');
                setTimeout(() => {
                    positionElement.classList.remove('position-updated');
                }, 2000);
                
                this.notifications.info(`Votre position pour la demande "${request.title}" a été mise à jour: ${position}`);
            }
        }
        
        // Sauvegarder les modifications
        this.saveRequests();
    }
    
    /**
     * Recherche un techlead
     */
    searchTechlead() {
        const searchInput = document.getElementById('techlead-search');
        const query = searchInput.value.trim();
        
        if (!query) {
            this.notifications.warning('Veuillez entrer un ID de techlead ou un domaine d\'expertise');
            return;
        }
        
        // Effacer les résultats précédents
        this.searchResults = [];
        this.searchResultsElement.innerHTML = '';
        
        // Vérifier si c'est un ID spécifique ou un domaine d'expertise
        const isId = !query.includes(',') && !query.includes(' ');
        
        // Si c'est un ID, tenter de se connecter directement
        if (isId) {
            this.peerService.connect(query)
                .then(conn => {
                    // Ajouter aux résultats de recherche
                    this.searchResults.push({
                        id: query,
                        expertise: [],
                        isAvailable: true
                    });
                    
                    // Afficher le résultat
                    this.renderSearchResults();
                    
                    this.notifications.success(`Connexion établie avec le techlead ${query}`);
                })
                .catch(error => {
                    this.notifications.error(`Impossible de se connecter au techlead ${query}`);
                });
        } else {
            // C'est une recherche par expertise
            const expertise = Utils.parseExpertise(query);
            
            if (expertise.length === 0) {
                this.notifications.warning('Veuillez entrer des domaines d\'expertise valides');
                return;
            }
            
            // Diffuser la recherche à tous les pairs connectés
            const searchData = {
                type: 'developer_search',
                expertise: expertise
            };
            
            this.peerService.broadcast(searchData);
            
            // Afficher un indicateur de recherche
            this.searchResultsElement.innerHTML = '<div class="searching">Recherche en cours...</div>';
            
            // Définir un délai pour la recherche
            setTimeout(() => {
                if (this.searchResults.length === 0) {
                    this.searchResultsElement.innerHTML = '<div class="no-results">Aucun techlead trouvé</div>';
                }
            }, 5000);
        }
    }
    
    /**
     * Gère les informations d'un techlead reçues après une recherche
     * @param {Object} techleadInfo - Informations du techlead
     */
    handleTechleadInfo(techleadInfo) {
        // Vérifier si le techlead est déjà dans les résultats
        const existingIndex = this.searchResults.findIndex(result => result.id === techleadInfo.techleadId);
        
        if (existingIndex >= 0) {
            // Mettre à jour les informations
            this.searchResults[existingIndex] = techleadInfo;
        } else {
            // Ajouter aux résultats
            this.searchResults.push({
                id: techleadInfo.techleadId,
                expertise: techleadInfo.expertise,
                isAvailable: techleadInfo.isAvailable
            });
        }
        
        // Mettre à jour l'affichage des résultats
        this.renderSearchResults();
    }
    
    /**
     * Affiche les résultats de recherche
     */
    renderSearchResults() {
        // Effacer le contenu actuel
        this.searchResultsElement.innerHTML = '';
        
        if (this.searchResults.length === 0) {
            this.searchResultsElement.innerHTML = '<div class="no-results">Aucun techlead trouvé</div>';
            return;
        }
        
        // Ajouter chaque résultat
        this.searchResults.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = `techlead-result ${result.isAvailable ? '' : 'unavailable'}`;
            resultElement.dataset.id = result.id;
            
            resultElement.innerHTML = `
                <div class="techlead-info">
                    <div class="techlead-id">${result.id}</div>
                    <div class="techlead-expertise">${result.expertise.join(', ') || 'Aucune expertise spécifiée'}</div>
                    <div class="techlead-status ${result.isAvailable ? 'available' : 'unavailable'}">
                        ${result.isAvailable ? 'Disponible' : 'Indisponible'}
                    </div>
                </div>
            `;
            
            // Ajouter un écouteur de clic
            resultElement.addEventListener('click', () => {
                // Sélectionner ce techlead
                this.selectTechlead(result.id);
            });
            
            this.searchResultsElement.appendChild(resultElement);
        });
    }
    
    /**
     * Sélectionne un techlead pour la demande
     * @param {string} techleadId - ID du techlead
     */
    selectTechlead(techleadId) {
        // Retirer la sélection précédente
        document.querySelectorAll('.techlead-result.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner le nouveau techlead
        const resultElement = document.querySelector(`.techlead-result[data-id="${techleadId}"]`);
        if (resultElement) {
            resultElement.classList.add('selected');
        }
        
        // Stocker l'ID sélectionné dans un champ caché (ou en mémoire)
        document.getElementById('request-form').dataset.techleadId = techleadId;
        
        this.notifications.info(`Techlead ${techleadId} sélectionné pour votre demande`);
    }
    
    /**
     * Gère le téléchargement d'une capture d'écran
     * @param {Event} event - Événement de changement de fichier
     */
    handleScreenshotUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            this.notifications.error('Veuillez sélectionner une image');
            event.target.value = '';
            return;
        }
        
        // Vérifier la taille du fichier (max 5 Mo)
        if (file.size > 5 * 1024 * 1024) {
            this.notifications.error('L\'image est trop volumineuse (max 5 Mo)');
            event.target.value = '';
            return;
        }
        
        // Afficher un aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewElement = document.getElementById('screenshot-preview');
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Aperçu">`;
            previewElement.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Soumet une nouvelle demande d'assistance
     */
    async submitRequest() {
        // Récupérer le techlead sélectionné
        const techleadId = document.getElementById('request-form').dataset.techleadId;
        
        if (!techleadId) {
            this.notifications.warning('Veuillez sélectionner un techlead');
            return;
        }
        
        // Récupérer les données du formulaire
        const title = document.getElementById('request-title').value.trim();
        const description = document.getElementById('request-description').value.trim();
        const priorityRadios = document.getElementsByName('priority');
        let priority = 'low';
        
        for (const radio of priorityRadios) {
            if (radio.checked) {
                priority = radio.value;
                break;
            }
        }
        
        const code = document.getElementById('code-snippet').value.trim();
        
        // Vérifier les champs obligatoires
        if (!title || !description) {
            this.notifications.warning('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Gérer la capture d'écran
        let screenshot = null;
        const screenshotFile = document.getElementById('screenshot').files[0];
        
        if (screenshotFile) {
            try {
                screenshot = await Utils.fileToBase64(screenshotFile);
            } catch (error) {
                console.error('Erreur lors de la conversion de l\'image:', error);
            }
        }
        
        // Créer la demande
        const request = DataModels.createRequest({
            title: title,
            description: description,
            priority: priority,
            code: code,
            screenshot: screenshot,
            developerId: this.developerId,
            developerName: this.developerName,
            developerTeam: this.team,
            techleadId: techleadId
        });

        // Initialiser la position à 1 par défaut (sera mise à jour par le techlead)
        request.lastPosition = 1;
        
        // Ajouter à notre liste de demandes actives
        this.activeRequests.push(request);

        // Stocker toutes les demandes dans une seule clé
        this.saveRequests();

        // Mettre à jour l'interface
        this.updateActiveRequestsUI();
        
        // Envoyer la demande au techlead
        try {
            await this.peerService.connect(techleadId);
            
            this.peerService.sendData(techleadId, {
                type: 'new_request',
                request: request
            });
            
            this.notifications.success('Demande envoyée avec succès');
            
            // Réinitialiser le formulaire
            document.getElementById('request-form').reset();
            document.getElementById('screenshot-preview').innerHTML = '';
            document.getElementById('screenshot-preview').classList.remove('active');
            document.getElementById('request-form').dataset.techleadId = '';
            
            // Effacer les résultats de recherche
            this.searchResults = [];
            this.searchResultsElement.innerHTML = '';
            
        } catch (error) {
            this.notifications.error(`Erreur lors de l'envoi de la demande: ${error.message}`);
        }
    }

    /**
     * Sauvegarde toutes les demandes dans le stockage
     */
    saveRequests() {
        let allRequests = this.storage.get('requests', []);
        
        // Mettre à jour ou ajouter les demandes actives
        this.activeRequests.forEach(activeReq => {
            const index = allRequests.findIndex(req => req.id === activeReq.id);
            if (index >= 0) {
                allRequests[index] = activeReq;
            } else {
                allRequests.push(activeReq);
            }
        });
        
        // Sauvegarder
        this.storage.save('requests', allRequests);
    }
    
    /**
     * Charge les demandes actives depuis le stockage local
     */
    loadActiveRequests() {
        // Récupérer toutes les demandes depuis le stockage
        const allRequests = this.storage.get('requests', []);
        
        // Filtrer pour obtenir uniquement les demandes actives de ce développeur
        const activeRequests = allRequests.filter(req => 
            req.developerId === this.developerId && 
            (req.status === 'waiting' || req.status === 'in-progress')
        );
        
        // Mettre à jour notre liste locale
        this.activeRequests = activeRequests;
        
        // Mettre à jour l'interface
        this.updateActiveRequestsUI();
        
        // Se connecter aux techleads pour recevoir les mises à jour
        activeRequests.forEach(request => {
            this.peerService.connect(request.techleadId)
                .catch(error => {
                    console.error(`Erreur de connexion au techlead ${request.techleadId}:`, error);
                });
        });
    }
    
    /**
     * Met à jour l'interface pour les demandes actives
     */
    updateActiveRequestsUI() {
        // Vider la liste actuelle
        this.activeRequestsListElement.innerHTML = '';
        
        if (this.activeRequests.length === 0) {
            // Afficher l'état vide
            this.noActiveRequestsElement.classList.add('active');
            return;
        }
        
        // Masquer l'état vide
        this.noActiveRequestsElement.classList.remove('active');
        
        // Trier les demandes par statut (in-progress en premier) puis par date
        this.activeRequests.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'in-progress' ? -1 : 1;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Ajouter chaque demande à la liste
        this.activeRequests.forEach(request => {
            this.addRequestToActiveList(request);
        });
    }

    /**
     * Ajoute une demande à la liste des demandes actives
     * @param {Object} request - Demande à ajouter
     */
    addRequestToActiveList(request) {
        // Cloner le template
        const requestCard = this.requestTemplate.content.cloneNode(true).firstElementChild;
        
        // Définir l'ID de la demande comme attribut data
        requestCard.dataset.requestId = request.id;
        
        // Ajouter la classe de statut
        requestCard.classList.add(`status-${request.status}`);
        
        // Remplir les informations
        requestCard.querySelector('.active-title').textContent = request.title;
        
        const priorityBadge = requestCard.querySelector('.priority-badge');
        priorityBadge.textContent = Utils.translate(request.priority);
        priorityBadge.className = `priority-badge ${Utils.getPriorityClass(request.priority)}`;
        
        requestCard.querySelector('.active-techlead').textContent = request.techleadId;
        requestCard.querySelector('.active-status').textContent = Utils.translate(request.status);
        requestCard.querySelector('.active-time').textContent = Utils.formatDate(request.createdAt);
        
        // Position dans la file
        const position = request.position || '-';
        requestCard.querySelector('.position-number').textContent = position;
        
        const estimatedTime = position !== '-' ? Utils.estimateWaitTime(position) : '-';
        requestCard.querySelector('.estimated-time').textContent = estimatedTime;
        
        // Configurer les boutons d'action
        const chatButton = requestCard.querySelector('.open-chat');
        if (request.status === 'in-progress') {
            chatButton.style.display = 'block';
        } else {
            chatButton.style.display = 'none';
        }
        
        // Ajouter les écouteurs d'événements
        requestCard.querySelector('.cancel-request').addEventListener('click', () => {
            this.cancelRequest(request.id);
        });
        
        chatButton.addEventListener('click', () => {
            this.openChat(request.id);
        });
        
        // Ajouter à la liste
        this.activeRequestsListElement.appendChild(requestCard);
    }
    
    /**
     * Gère une mise à jour de demande reçue du techlead
     * @param {Object} updatedRequest - Demande mise à jour
     */
    handleRequestUpdate(updatedRequest) {
        // Trouver la demande dans notre liste
        const requestIndex = this.activeRequests.findIndex(req => req.id === updatedRequest.id);
        
        if (requestIndex === -1) return;
        
        const oldStatus = this.activeRequests[requestIndex].status;
        
        // Mettre à jour la demande
        this.activeRequests[requestIndex] = updatedRequest;
        
        // Sauvegarder
        this.saveRequests();
        
        // Mettre à jour l'interface
        this.updateActiveRequestsUI();
        
        // Gérer les changements de statut
        if (updatedRequest.status === 'in-progress' && oldStatus !== 'in-progress') {
            this.notifications.showBrowserNotification(
                'Demande prise en charge',
                `Votre demande "${updatedRequest.title}" est maintenant en cours de traitement`,
                { onClick: () => window.focus() }
            );
        } else if (updatedRequest.status === 'resolved') {
            this.notifications.showBrowserNotification(
                'Demande résolue',
                `Votre demande "${updatedRequest.title}" a été marquée comme résolue`,
                { onClick: () => window.focus() }
            );
            
            // Supprimer de la liste des demandes actives
            this.activeRequests.splice(requestIndex, 1);
            this.updateActiveRequestsUI();
            
            // Ajouter à l'historique
            this.addRequestToHistory(updatedRequest);
            
            // Afficher le modal de feedback après un court délai
            setTimeout(() => {
                this.openFeedbackModal(updatedRequest);
            }, 1000);
        }
    }
    
    /**
     * Annule une demande
     * @param {string} requestId - ID de la demande à annuler
     */
    cancelRequest(requestId) {
        // Trouver la demande dans notre liste
        const requestIndex = this.activeRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            this.notifications.warning('Demande non trouvée');
            return;
        }
        
        const request = this.activeRequests[requestIndex];
        
        // Mettre à jour le statut
        request.status = 'cancelled';
        request.updatedAt = new Date().toISOString();
        
        // Notifier le techlead
        if (request.techleadId) {
            this.peerService.sendData(request.techleadId, {
                type: 'cancel_request',
                requestId: request.id
            }).catch(error => {
                console.error('Erreur lors de l\'annulation de la demande:', error);
            });
        }
        
        // Ajouter à l'historique
        this.addRequestToHistory(request);
        
        // Supprimer de la liste des demandes actives
        this.activeRequests.splice(requestIndex, 1);
        
        // Sauvegarder et mettre à jour l'interface
        this.saveRequests();
        this.updateActiveRequestsUI();
        
        this.notifications.success('Demande annulée');
    }
    
    /**
     * Charge l'historique des demandes
     */
    loadHistory() {
        const requests = this.storage.get('history', []);
        
        // Effacer la liste actuelle
        this.historyListElement.innerHTML = '';
        
        if (requests.length === 0) {
            // Afficher l'état vide
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state active';
            emptyState.innerHTML = '<p>Aucune demande dans l\'historique</p>';
            this.historyListElement.appendChild(emptyState);
            return;
        }
        
        // Trier les demandes par date (la plus récente en premier)
        requests.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Ajouter chaque demande à l'historique
        requests.forEach(request => {
            this.addRequestToHistory(request, false);
        });
    }
    
    /**
     * Ajoute une demande à l'historique
     * @param {Object} request - Demande à ajouter
     * @param {boolean} saveToStorage - Si true, sauvegarde dans le stockage
     */
    addRequestToHistory(request, saveToStorage = true) {
        // Masquer l'état vide si présent
        const emptyState = this.historyListElement.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = request.id;
        
        // Récupérer le feedback s'il existe
        const feedbacks = this.storage.get('feedbacks', []);
        const feedback = feedbacks.find(f => f.requestId === request.id);
        
        let feedbackHtml = '';
        if (feedback) {
            const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
            feedbackHtml = `
                <div class="rating">
                    <span>Votre évaluation:</span>
                    <div class="rating-stars">${stars}</div>
                </div>
            `;
        }
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${request.title}</div>
                <div class="priority-badge ${Utils.getPriorityClass(request.priority)}">${Utils.translate(request.priority)}</div>
            </div>
            <div class="history-meta">
                <div>Techlead: ${request.techleadId}</div>
                <div>Statut: ${Utils.translate(request.status)}</div>
                <div>Soumis le: ${Utils.formatDate(request.createdAt)}</div>
                ${request.resolvedAt ? `<div>Résolu le: ${Utils.formatDate(request.resolvedAt)}</div>` : ''}
                ${feedbackHtml}
            </div>
        `;
        
        this.historyListElement.insertBefore(historyItem, this.historyListElement.firstChild);
        
        // Sauvegarder dans le stockage si demandé
        if (saveToStorage) {
            const history = this.storage.get('history', []);
            
            // Vérifier si la demande existe déjà
            const existingIndex = history.findIndex(item => item.id === request.id);
            
            if (existingIndex >= 0) {
                // Mettre à jour la demande existante
                history[existingIndex] = request;
            } else {
                // Ajouter la nouvelle demande
                history.push(request);
            }
            
            this.storage.save('history', history);
        }
    }
    
    /**
     * Ouvre le chat avec le techlead
     * @param {string} requestId - ID de la demande concernée
     */
    openChat(requestId) {
        // Trouver la demande dans notre liste
        const request = this.activeRequests.find(req => req.id === requestId);
        
        if (!request || request.status !== 'in-progress') {
            this.notifications.warning('Le chat n\'est disponible que lorsque votre demande est en cours de traitement');
            return;
        }
        
        // Stocker les informations du chat actif
        this.activeChat = {
            requestId: request.id,
            techleadId: request.techleadId
        };
        
        // Mettre à jour l'interface du chat
        document.getElementById('chat-with').textContent = `Techlead (${request.techleadId})`;
        
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
        
        // Déterminer si le message a été envoyé par le développeur
        const isSent = message.senderId === this.developerId;
        
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
            senderId: this.developerId,
            senderName: this.developerName,
            receiverId: this.activeChat.techleadId,
            content: content,
            requestId: this.activeChat.requestId
        });
        
        // Sauvegarder le message
        const messages = this.storage.get('messages', []);
        messages.push(message);
        this.storage.save('messages', messages);
        
        // Ajouter le message au chat
        this.addMessageToChat(message);
        
        // Envoyer le message au techlead
        this.peerService.sendData(this.activeChat.techleadId, {
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
        if (message.receiverId !== this.developerId) return;
        
        // Sauvegarder le message
        const messages = this.storage.get('messages', []);
        messages.push(message);
        this.storage.save('messages', messages);
        
        // Si le chat est ouvert, ajouter le message
        if (this.activeChat && this.activeChat.requestId === message.requestId) {
            this.addMessageToChat(message);
        } else {
            // Notifier
            this.notifications.showBrowserNotification(
                'Nouveau message',
                `Techlead: ${Utils.truncateText(message.content, 50)}`,
                {
                    onClick: () => {
                        window.focus();
                        this.openChat();
                    }
                }
            );
        }
    }
    
    /**
     * Ouvre le modal de feedback
     * @param {Object} request - Demande concernée par le feedback
     */
    openFeedbackModal(request) {
        // Stocker la demande pour laquelle on donne un feedback
        this.feedbackModalElement.dataset.requestId = request.id;
        this.feedbackModalElement.dataset.techleadId = request.techleadId;
        
        // Réinitialiser le formulaire
        document.querySelector('input[name="rating"]:checked')?.removeAttribute('checked');
        document.getElementById('feedback-comment').value = '';
        
        // Afficher le modal
        this.feedbackModalElement.classList.add('active');
    }
    
    /**
     * Ferme le modal de feedback
     */
    closeFeedbackModal() {
        this.feedbackModalElement.classList.remove('active');
    }
    
    /**
     * Soumet un feedback
     */
    submitFeedback() {
        const requestId = this.feedbackModalElement.dataset.requestId;
        const techleadId = this.feedbackModalElement.dataset.techleadId;
        
        if (!requestId || !techleadId) {
            this.notifications.error('Informations manquantes pour le feedback');
            return;
        }
        
        // Récupérer la note
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        const rating = ratingInput ? parseInt(ratingInput.value) : 0;
        
        if (rating === 0) {
            this.notifications.warning('Veuillez attribuer une note');
            return;
        }
        
        const comment = document.getElementById('feedback-comment').value.trim();
        
        // Créer le feedback
        const feedback = DataModels.createFeedback({
            requestId: requestId,
            rating: rating,
            comment: comment,
            developerId: this.developerId,
            techleadId: techleadId
        });
        
        // Sauvegarder le feedback
        const feedbacks = this.storage.get('feedbacks', []);
        feedbacks.push(feedback);
        this.storage.save('feedbacks', feedbacks);
        
        // Mettre à jour l'historique
        this.loadHistory();
        
        // Envoyer le feedback au techlead
        this.peerService.sendData(techleadId, {
            type: 'feedback',
            feedback: feedback
        }).catch(error => {
            console.error('Erreur lors de l\'envoi du feedback:', error);
        });
        
        // Fermer le modal
        this.closeFeedbackModal();
        
        this.notifications.success('Merci pour votre feedback!');
    }
    
    /**
     * Déconnexion
     */
    logout() {
        // Détruire la connexion P2P
        this.peerService.destroy();
        
        // Effacer les données de session
        localStorage.removeItem('developerName');
        localStorage.removeItem('team');
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new DeveloperApp();
});