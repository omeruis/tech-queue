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
        this.activeRequestDetailsElement = document.getElementById('active-request-details');
        this.noActiveRequestElement = document.getElementById('no-active-request');
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
            this.loadActiveRequest();
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
        
        // Actions de demande active
        document.getElementById('cancel-request').addEventListener('click', () => this.cancelRequest());
        document.getElementById('open-chat').addEventListener('click', () => this.openChat());
        
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
        // Vérifier que la mise à jour concerne notre demande active
        if (!this.activeRequest || this.activeRequest.id !== requestId) return;
        
        // Mettre à jour l'interface
        document.getElementById('position-number').textContent = position;
        document.getElementById('estimated-time').textContent = estimatedTime;
        
        // Notifier si la position a changé (amélioration optionnelle)
        if (this.activeRequest.lastPosition && this.activeRequest.lastPosition > position) {
            this.notifications.info(`Votre position dans la file a été mise à jour: ${position}`);
        }
        
        // Stocker la dernière position connue
        this.activeRequest.lastPosition = position;
        this.storage.save('active_request', this.activeRequest);
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
        
        // Sauvegarder la demande
        this.activeRequest = request;
        this.storage.save('active_request', request);
        
        // Mettre à jour l'interface
        this.updateActiveRequestUI(request);
        
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
     * Charge la demande active depuis le stockage local
     */
    loadActiveRequest() {
        const activeRequest = this.storage.get('active_request');
        
        if (activeRequest && (activeRequest.status === 'waiting' || activeRequest.status === 'in-progress')) {
            this.activeRequest = activeRequest;
            this.updateActiveRequestUI(activeRequest);
            
            // Se connecter au techlead pour recevoir les mises à jour
            this.peerService.connect(activeRequest.techleadId)
                .catch(error => {
                    console.error('Erreur de connexion au techlead:', error);
                });
        }
    }
    
    /**
     * Met à jour l'interface pour la demande active
     * @param {Object} request - Demande active
     */
    updateActiveRequestUI(request) {
        if (!request) {
            this.noActiveRequestElement.classList.add('active');
            this.activeRequestDetailsElement.classList.remove('active');
            return;
        }
        
        // Masquer l'état vide et afficher les détails
        this.noActiveRequestElement.classList.remove('active');
        this.activeRequestDetailsElement.classList.add('active');
        
        // Mettre à jour les champs
        document.getElementById('active-title').textContent = request.title;
        document.getElementById('active-priority').textContent = Utils.translate(request.priority);
        document.getElementById('active-priority').className = `priority-badge ${Utils.getPriorityClass(request.priority)}`;
        document.getElementById('active-techlead').textContent = request.techleadId;
        document.getElementById('active-status').textContent = Utils.translate(request.status);
        document.getElementById('active-time').textContent = Utils.formatDate(request.createdAt);
        
        // Mettre à jour la position dans la file et l'estimation
        // Dans une vraie application, cela serait dynamique
        const position = 1; // Pour l'exemple
        document.getElementById('position-number').textContent = position;
        document.getElementById('estimated-time').textContent = Utils.estimateWaitTime(position);
        
        // Mettre à jour les boutons d'action
        const chatButton = document.getElementById('open-chat');
        if (request.status === 'in-progress') {
            chatButton.style.display = 'block';
        } else {
            chatButton.style.display = 'none';
        }
    }
    
    /**
     * Gère une mise à jour de demande reçue du techlead
     * @param {Object} updatedRequest - Demande mise à jour
     */
    handleRequestUpdate(updatedRequest) {
        // Vérifier que la mise à jour concerne notre demande active
        if (!this.activeRequest || this.activeRequest.id !== updatedRequest.id) return;
        
        // Sauvegarder la demande mise à jour
        this.activeRequest = updatedRequest;
        this.storage.save('active_request', updatedRequest);
        
        // Mettre à jour l'interface
        this.updateActiveRequestUI(updatedRequest);
        
        // Gérer les changements de statut
        if (updatedRequest.status === 'in-progress' && this.activeRequest.status !== 'in-progress') {
            this.notifications.showBrowserNotification(
                'Demande prise en charge',
                'Votre demande est maintenant en cours de traitement',
                { onClick: () => window.focus() }
            );
        } else if (updatedRequest.status === 'resolved') {
            this.notifications.showBrowserNotification(
                'Demande résolue',
                'Votre demande a été marquée comme résolue',
                { onClick: () => window.focus() }
            );
            
            // Ajouter à l'historique
            this.addRequestToHistory(updatedRequest);
            
            // Afficher le modal de feedback après un court délai
            setTimeout(() => {
                this.openFeedbackModal(updatedRequest);
            }, 1000);
        }
    }
    
    /**
     * Annule la demande active
     */
    cancelRequest() {
        if (!this.activeRequest) {
            this.notifications.warning('Aucune demande active à annuler');
            return;
        }
        
        // Mettre à jour le statut
        this.activeRequest.status = 'cancelled';
        this.activeRequest.updatedAt = new Date().toISOString();
        
        // Sauvegarder la modification
        this.storage.save('active_request', null);
        
        // Ajouter à l'historique
        this.addRequestToHistory(this.activeRequest);
        
        // Notifier le techlead
        if (this.activeRequest.techleadId) {
            this.peerService.sendData(this.activeRequest.techleadId, {
                type: 'cancel_request',
                requestId: this.activeRequest.id
            }).catch(error => {
                console.error('Erreur lors de l\'annulation de la demande:', error);
            });
        }
        
        // Effacer la demande active
        this.activeRequest = null;
        
        // Mettre à jour l'interface
        this.updateActiveRequestUI(null);
        
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
     */
    openChat() {
        if (!this.activeRequest || this.activeRequest.status !== 'in-progress') {
            this.notifications.warning('Le chat n\'est disponible que lorsque votre demande est en cours de traitement');
            return;
        }
        
        // Stocker les informations du chat actif
        this.activeChat = {
            requestId: this.activeRequest.id,
            techleadId: this.activeRequest.techleadId
        };
        
        // Mettre à jour l'interface du chat
        document.getElementById('chat-with').textContent = `Techlead (${this.activeRequest.techleadId})`;
        
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