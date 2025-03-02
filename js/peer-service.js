/**
 * Service de gestion des connexions PeerJS
 * Ce service permet d'établir des connexions P2P entre les techleads et les développeurs
 */
class PeerService {
    constructor() {
        this.peer = null;
        this.connections = {};
        this.isConnected = false;
        this.peerId = null;
        this.eventListeners = {
            'connection': [],
            'data': [],
            'close': [],
            'error': []
        };
    }

    /**
     * Initialise la connexion PeerJS
     * @param {string} peerId - Identifiant unique pour ce peer
     * @returns {Promise} - Promise résolue lorsque la connexion est établie
     */
    initialize(peerId) {
        return new Promise((resolve, reject) => {
            if (this.peer) {
                this.peer.destroy();
            }

            this.peerId = peerId;
            
            // Initialiser PeerJS
            this.peer = new Peer(peerId, {
                debug: 2
            });

            // Événement de connexion réussie au serveur PeerJS
            this.peer.on('open', (id) => {
                console.log('Connecté au serveur PeerJS avec ID:', id);
                this.isConnected = true;
                resolve(id);
            });

            // Événement de nouvelle connexion entrante
            this.peer.on('connection', (conn) => {
                this._handleNewConnection(conn);
            });

            // Événements d'erreur
            this.peer.on('error', (error) => {
                console.error('Erreur PeerJS:', error);
                this._triggerEvent('error', error);
                
                if (error.type === 'peer-unavailable') {
                    reject(new Error('Pair introuvable. Vérifiez l\'ID et réessayez.'));
                } else if (error.type === 'browser-incompatible') {
                    reject(new Error('Votre navigateur n\'est pas compatible avec WebRTC.'));
                } else {
                    reject(error);
                }
            });

            // Événement de déconnexion
            this.peer.on('disconnected', () => {
                console.log('Déconnecté du serveur PeerJS');
                this.isConnected = false;
                
                // Tenter de se reconnecter après un délai
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('Tentative de reconnexion...');
                        this.peer.reconnect();
                    }
                }, 5000);
            });

            // Événement de fermeture
            this.peer.on('close', () => {
                console.log('Connexion PeerJS fermée');
                this.isConnected = false;
                this.connections = {};
                this._triggerEvent('close');
            });
        });
    }

    /**
     * Établit une connexion à un autre pair
     * @param {string} remotePeerId - ID du pair auquel se connecter
     * @returns {Promise} - Promise résolue lorsque la connexion est établie
     */
    connect(remotePeerId) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Non connecté au serveur PeerJS. Veuillez initialiser d\'abord.'));
                return;
            }

            // Si on est déjà connecté à ce pair, on renvoie la connexion existante
            if (this.connections[remotePeerId]) {
                resolve(this.connections[remotePeerId]);
                return;
            }

            // Créer une nouvelle connexion
            const conn = this.peer.connect(remotePeerId, {
                reliable: true
            });

            // Événement de connexion établie
            conn.on('open', () => {
                console.log(`Connecté au pair: ${remotePeerId}`);
                this._handleNewConnection(conn);
                resolve(conn);
            });

            // Événement d'erreur
            conn.on('error', (error) => {
                console.error(`Erreur de connexion au pair ${remotePeerId}:`, error);
                reject(error);
            });
        });
    }

    /**
     * Envoie des données à un pair spécifique
     * @param {string} remotePeerId - ID du pair destinataire
     * @param {Object} data - Données à envoyer
     * @returns {Promise} - Promise résolue lorsque les données sont envoyées
     */
    sendData(remotePeerId, data) {
        return new Promise((resolve, reject) => {
            const conn = this.connections[remotePeerId];
            
            if (!conn) {
                reject(new Error(`Pas de connexion établie avec le pair ${remotePeerId}`));
                return;
            }

            try {
                conn.send(data);
                resolve();
            } catch (error) {
                console.error(`Erreur lors de l'envoi des données au pair ${remotePeerId}:`, error);
                reject(error);
            }
        });
    }

    /**
     * Envoie des données à tous les pairs connectés
     * @param {Object} data - Données à envoyer
     * @returns {Promise} - Promise résolue lorsque les données sont envoyées à tous les pairs
     */
    broadcast(data) {
        const promises = [];
        
        for (const peerId in this.connections) {
            promises.push(this.sendData(peerId, data));
        }
        
        return Promise.allSettled(promises);
    }

    /**
     * Ferme la connexion avec un pair spécifique
     * @param {string} remotePeerId - ID du pair à déconnecter
     */
    closeConnection(remotePeerId) {
        const conn = this.connections[remotePeerId];
        
        if (conn) {
            conn.close();
            delete this.connections[remotePeerId];
            console.log(`Connexion fermée avec le pair ${remotePeerId}`);
        }
    }

    /**
     * Ferme toutes les connexions et détruit le peer
     */
    destroy() {
        // Fermer toutes les connexions
        for (const peerId in this.connections) {
            this.closeConnection(peerId);
        }
        
        // Détruire le peer
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
            this.isConnected = false;
            this.peerId = null;
            console.log('PeerJS détruit');
        }
    }

    /**
     * Ajoute un écouteur d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler lorsque l'événement est déclenché
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    /**
     * Supprime un écouteur d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à supprimer
     */
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Gère une nouvelle connexion
     * @param {Object} conn - Objet de connexion PeerJS
     * @private
     */
    _handleNewConnection(conn) {
        const remotePeerId = conn.peer;
        
        // Stocker la connexion
        this.connections[remotePeerId] = conn;
        
        // Déclencher l'événement de connexion
        this._triggerEvent('connection', { 
            peerId: remotePeerId, 
            connection: conn 
        });
        
        // Configurer les écouteurs d'événements pour cette connexion
        conn.on('data', (data) => {
            console.log(`Données reçues du pair ${remotePeerId}:`, data);
            this._triggerEvent('data', { 
                peerId: remotePeerId, 
                data: data 
            });
        });
        
        conn.on('close', () => {
            console.log(`Connexion fermée avec le pair ${remotePeerId}`);
            delete this.connections[remotePeerId];
            this._triggerEvent('close', { 
                peerId: remotePeerId 
            });
        });
        
        conn.on('error', (error) => {
            console.error(`Erreur sur la connexion avec le pair ${remotePeerId}:`, error);
            this._triggerEvent('error', { 
                peerId: remotePeerId, 
                error: error 
            });
        });
    }

    /**
     * Déclenche un événement
     * @param {string} event - Nom de l'événement
     * @param {Object} data - Données à passer aux écouteurs
     * @private
     */
    _triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erreur dans l'écouteur d'événement ${event}:`, error);
                }
            });
        }
    }
}