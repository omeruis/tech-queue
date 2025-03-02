/**
 * Service de gestion des notifications
 * Ce service permet d'afficher des notifications dans l'interface
 */
class NotificationService {
    constructor() {
        this.container = document.getElementById('notification-container');
        
        // Créer le conteneur s'il n'existe pas
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        // Compteur pour les identifiants uniques
        this.counter = 0;
        
        // Support des notifications du navigateur
        this.browserNotificationsSupported = 'Notification' in window;
        this.browserNotificationsEnabled = false;
        
        // Vérifier si les notifications du navigateur sont autorisées
        if (this.browserNotificationsSupported && Notification.permission === 'granted') {
            this.browserNotificationsEnabled = true;
        }
    }

    /**
     * Demande l'autorisation pour les notifications du navigateur
     * @returns {Promise} - Promise résolue avec le statut de l'autorisation
     */
    requestBrowserPermission() {
        if (!this.browserNotificationsSupported) {
            return Promise.resolve(false);
        }
        
        return Notification.requestPermission().then(permission => {
            this.browserNotificationsEnabled = permission === 'granted';
            return this.browserNotificationsEnabled;
        });
    }

    /**
     * Affiche une notification dans l'interface
     * @param {string} message - Message de la notification
     * @param {string} type - Type de notification (info, success, warning, error)
     * @param {number} duration - Durée d'affichage en ms (0 pour permanent)
     * @returns {string} - ID de la notification
     */
    show(message, type = 'info', duration = 5000) {
        // Générer un ID unique
        const id = `notification-${Date.now()}-${this.counter++}`;
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        
        // Créer le contenu
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        
        // Créer le bouton de fermeture
        const closeButton = document.createElement('button');
        closeButton.className = 'close-notification';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.close(id));
        
        // Assembler la notification
        notification.appendChild(content);
        notification.appendChild(closeButton);
        
        // Ajouter au conteneur
        this.container.appendChild(notification);
        
        // Fermer automatiquement après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => {
                this.close(id);
            }, duration);
        }
        
        return id;
    }

    /**
     * Affiche une notification de type info
     * @param {string} message - Message de la notification
     * @param {number} duration - Durée d'affichage en ms
     * @returns {string} - ID de la notification
     */
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Affiche une notification de type succès
     * @param {string} message - Message de la notification
     * @param {number} duration - Durée d'affichage en ms
     * @returns {string} - ID de la notification
     */
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Affiche une notification de type avertissement
     * @param {string} message - Message de la notification
     * @param {number} duration - Durée d'affichage en ms
     * @returns {string} - ID de la notification
     */
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Affiche une notification de type erreur
     * @param {string} message - Message de la notification
     * @param {number} duration - Durée d'affichage en ms
     * @returns {string} - ID de la notification
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Ferme une notification
     * @param {string} id - ID de la notification à fermer
     */
    close(id) {
        const notification = document.getElementById(id);
        
        if (notification) {
            // Animation de fermeture
            notification.classList.add('closing');
            
            // Supprimer après l'animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    /**
     * Affiche une notification dans le navigateur
     * @param {string} title - Titre de la notification
     * @param {string} message - Corps de la notification
     * @param {Object} options - Options supplémentaires
     */
    showBrowserNotification(title, message, options = {}) {
        if (!this.browserNotificationsEnabled) {
            // Afficher dans l'interface si les notifications navigateur ne sont pas disponibles
            return this.show(message, options.type || 'info');
        }
        
        const defaultOptions = {
            body: message,
            icon: options.icon || '/assets/icons/notification-icon.png',
            silent: options.silent || false
        };
        
        const notification = new Notification(title, { ...defaultOptions, ...options });
        
        // Gérer les événements de la notification
        notification.onclick = options.onClick || (() => {
            window.focus();
            notification.close();
        });
        
        return notification;
    }
}

// Exporter une instance unique
const notificationService = new NotificationService();