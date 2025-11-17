/**
 * Gestionnaire de notifications push
 */
class PushNotificationManager {
    constructor() {
        this.permission = this.checkPermission();
        this.enabled = this.isEnabled();
    }

    /**
     * Vérifie si les notifications sont supportées
     * @returns {boolean} - Support des notifications
     */
    isSupported() {
        return 'Notification' in window;
    }

    /**
     * Vérifie la permission actuelle
     * @returns {string} - Permission ('granted', 'denied', 'default')
     */
    checkPermission() {
        if (!this.isSupported()) return 'denied';
        return Notification.permission;
    }

    /**
     * Vérifie si les notifications sont activées
     * @returns {boolean} - État d'activation
     */
    isEnabled() {
        return localStorage.getItem('notifications_enabled') === 'true';
    }

    /**
     * Demande la permission pour les notifications
     * @returns {Promise<boolean>} - Permission accordée
     */
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error('Les notifications ne sont pas supportées par ce navigateur');
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error);
            return false;
        }
    }

    /**
     * Active les notifications
     * @returns {Promise<boolean>} - Succès
     */
    async enable() {
        const granted = await this.requestPermission();
        if (granted) {
            this.enabled = true;
            localStorage.setItem('notifications_enabled', 'true');
            return true;
        }
        return false;
    }

    /**
     * Désactive les notifications
     */
    disable() {
        this.enabled = false;
        localStorage.setItem('notifications_enabled', 'false');
    }

    /**
     * Envoie une notification
     * @param {string} title - Titre de la notification
     * @param {Object} options - Options de notification
     * @returns {Notification|null} - Objet notification ou null
     */
    send(title, options = {}) {
        if (!this.isSupported() || !this.enabled || this.permission !== 'granted') {
            return null;
        }

        // Ne pas envoyer de notification si la page est visible
        if (!document.hidden && options.onlyWhenHidden !== false) {
            return null;
        }

        const defaultOptions = {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            // Fermeture automatique après 5 secondes
            setTimeout(() => {
                notification.close();
            }, options.duration || 5000);

            // Gérer le clic sur la notification
            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) {
                    options.onClick();
                }
            };

            return notification;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
            return null;
        }
    }

    /**
     * Envoie une notification de nouvelle demande
     * @param {Object} request - Demande
     */
    notifyNewRequest(request) {
        this.send('Nouvelle demande d\'assistance', {
            body: `${request.developerName}: ${request.title}`,
            tag: `request-${request.id}`,
            data: { requestId: request.id, type: 'new-request' },
            icon: this.getPriorityIcon(request.priority)
        });
    }

    /**
     * Envoie une notification de prise en charge
     * @param {Object} request - Demande
     * @param {string} techleadId - ID du techlead
     */
    notifyRequestStarted(request, techleadId) {
        this.send('Demande prise en charge', {
            body: `Votre demande "${request.title}" est maintenant traitée par ${techleadId}`,
            tag: `request-${request.id}`,
            data: { requestId: request.id, type: 'request-started' }
        });
    }

    /**
     * Envoie une notification de résolution
     * @param {Object} request - Demande
     */
    notifyRequestResolved(request) {
        this.send('Demande résolue', {
            body: `Votre demande "${request.title}" a été marquée comme résolue`,
            tag: `request-${request.id}`,
            data: { requestId: request.id, type: 'request-resolved' },
            requireInteraction: true
        });
    }

    /**
     * Envoie une notification de nouveau message
     * @param {Object} message - Message
     * @param {string} senderName - Nom de l'expéditeur
     */
    notifyNewMessage(message, senderName) {
        this.send(`Nouveau message de ${senderName}`, {
            body: message.content.substring(0, 100),
            tag: `message-${message.requestId}`,
            data: { requestId: message.requestId, type: 'new-message' }
        });
    }

    /**
     * Envoie une notification personnalisée
     * @param {string} title - Titre
     * @param {string} body - Corps
     * @param {Object} options - Options supplémentaires
     */
    notify(title, body, options = {}) {
        this.send(title, {
            body,
            ...options
        });
    }

    /**
     * Obtient l'icône selon la priorité
     * @param {string} priority - Priorité
     * @returns {string} - URL de l'icône
     */
    getPriorityIcon(priority) {
        // Vous pouvez créer des icônes spécifiques pour chaque priorité
        return '/favicon.ico';
    }

    /**
     * Teste les notifications
     */
    test() {
        this.send('Test de notification', {
            body: 'Si vous voyez ceci, les notifications fonctionnent correctement!',
            icon: '/favicon.ico'
        });
    }
}

// Instance globale
window.pushNotificationManager = new PushNotificationManager();
