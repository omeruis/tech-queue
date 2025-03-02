/**
 * Fonctions utilitaires communes pour l'application TechQueue
 */

// Modèles de données
const DataModels = {
    /**
     * Crée un nouvel objet de demande d'assistance
     * @param {Object} data - Données de la demande
     * @returns {Object} - Nouvelle demande formatée
     */
    createRequest(data) {
        return {
            id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: data.title || 'Demande sans titre',
            description: data.description || '',
            priority: data.priority || 'low',
            status: 'waiting',
            code: data.code || null,
            screenshot: data.screenshot || null,
            developerId: data.developerId || null,
            developerName: data.developerName || 'Anonyme',
            developerTeam: data.developerTeam || '',
            techleadId: data.techleadId || null,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            startedAt: null,
            resolvedAt: null
        };
    },

    /**
     * Crée un nouvel objet message de chat
     * @param {Object} data - Données du message
     * @returns {Object} - Nouveau message formaté
     */
    createMessage(data) {
        return {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            senderId: data.senderId || null,
            senderName: data.senderName || 'Anonyme',
            receiverId: data.receiverId || null,
            content: data.content || '',
            timestamp: data.timestamp || new Date().toISOString(),
            requestId: data.requestId || null,
            isRead: false
        };
    },

    /**
     * Crée un nouvel objet feedback
     * @param {Object} data - Données du feedback
     * @returns {Object} - Nouveau feedback formaté
     */
    createFeedback(data) {
        return {
            id: `fbk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestId: data.requestId || null,
            rating: data.rating || 0,
            comment: data.comment || '',
            developerId: data.developerId || null,
            techleadId: data.techleadId || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    },

    /**
     * Crée un nouvel objet techlead
     * @param {Object} data - Données du techlead
     * @returns {Object} - Nouveau techlead formaté
     */
    createTechlead(data) {
        return {
            id: data.id || null,
            expertise: data.expertise || [],
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            lastSeen: data.lastSeen || new Date().toISOString()
        };
    }
};

// Fonctions utilitaires
const Utils = {
    /**
     * Formate une date en chaîne lisible
     * @param {string} dateString - Date ISO à formater
     * @returns {string} - Date formatée
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Calcule le temps écoulé entre deux dates
     * @param {string} startDate - Date de début (ISO)
     * @param {string} endDate - Date de fin (ISO), utilise maintenant si non défini
     * @returns {string} - Chaîne de durée formatée
     */
    getElapsedTime(startDate, endDate = null) {
        if (!startDate) return '';
        
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Vérifier si les dates sont valides
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return '';
        }
        
        const diffMs = end - start;
        const diffSec = Math.floor(diffMs / 1000);
        
        if (diffSec < 60) {
            return `${diffSec} sec`;
        }
        
        const diffMin = Math.floor(diffSec / 60);
        
        if (diffMin < 60) {
            return `${diffMin} min`;
        }
        
        const diffHours = Math.floor(diffMin / 60);
        const remainingMin = diffMin % 60;
        
        if (diffHours < 24) {
            return `${diffHours}h ${remainingMin}min`;
        }
        
        const diffDays = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        
        return `${diffDays}j ${remainingHours}h`;
    },

    /**
     * Tronque un texte à une longueur maximale
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @returns {string} - Texte tronqué
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Génère un identifiant unique
     * @returns {string} - Identifiant unique
     */
    generateId() {
        return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    },

    /**
     * Convertit une chaîne d'expertise en tableau
     * @param {string} expertiseString - Chaîne d'expertise séparée par des virgules
     * @returns {string[]} - Tableau d'expertises
     */
    parseExpertise(expertiseString) {
        if (!expertiseString) return [];
        
        return expertiseString
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    },

    /**
     * Convertit un fichier en base64
     * @param {File} file - Fichier à convertir
     * @returns {Promise<string>} - Chaîne base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Aucun fichier fourni'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = () => {
                resolve(reader.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };
            
            reader.readAsDataURL(file);
        });
    },

    /**
     * Calcule l'estimation du temps d'attente
     * @param {number} position - Position dans la file
     * @param {number} avgTimePerRequest - Temps moyen par demande en minutes
     * @returns {string} - Temps d'attente estimé formaté
     */
    estimateWaitTime(position, avgTimePerRequest = 15) {
        const totalMinutes = position * avgTimePerRequest;
        
        if (totalMinutes < 60) {
            return `~${totalMinutes} minutes`;
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (minutes === 0) {
            return `~${hours} heure${hours > 1 ? 's' : ''}`;
        }
        
        return `~${hours}h ${minutes}min`;
    },

    /**
     * Obtient la classe CSS pour une priorité
     * @param {string} priority - Priorité (low, medium, high)
     * @returns {string} - Classe CSS
     */
    getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'high';
            case 'medium': return 'medium';
            default: return 'low';
        }
    },

    /**
     * Traduit les termes en français
     * @param {string} term - Terme à traduire
     * @returns {string} - Terme traduit
     */
    translate(term) {
        const translations = {
            'waiting': 'En attente',
            'in-progress': 'En cours',
            'resolved': 'Résolu',
            'closed': 'Fermé',
            'cancelled': 'Annulé',
            'low': 'Faible',
            'medium': 'Moyen',
            'high': 'Élevé',
            'available': 'Disponible',
            'unavailable': 'Indisponible'
        };
        
        return translations[term] || term;
    }
};

// Exporter les constantes
window.DataModels = DataModels;
window.Utils = Utils;