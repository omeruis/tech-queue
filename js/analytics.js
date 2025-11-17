/**
 * Système d'analytics et statistiques
 */
class AnalyticsManager {
    constructor() {
        this.events = this.loadEvents();
        this.metrics = this.loadMetrics();
    }

    /**
     * Charge les événements depuis le stockage
     * @returns {Array} - Liste des événements
     */
    loadEvents() {
        const stored = localStorage.getItem('analytics_events');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Charge les métriques depuis le stockage
     * @returns {Object} - Métriques
     */
    loadMetrics() {
        const stored = localStorage.getItem('analytics_metrics');
        return stored ? JSON.parse(stored) : {
            totalRequests: 0,
            resolvedRequests: 0,
            cancelledRequests: 0,
            averageResolutionTime: 0,
            totalChatMessages: 0,
            averageRating: 0,
            totalRatings: 0
        };
    }

    /**
     * Sauvegarde les événements
     */
    saveEvents() {
        // Garder seulement les 1000 derniers événements
        if (this.events.length > 1000) {
            this.events = this.events.slice(-1000);
        }
        localStorage.setItem('analytics_events', JSON.stringify(this.events));
    }

    /**
     * Sauvegarde les métriques
     */
    saveMetrics() {
        localStorage.setItem('analytics_metrics', JSON.stringify(this.metrics));
    }

    /**
     * Enregistre un événement
     * @param {string} type - Type d'événement
     * @param {Object} data - Données de l'événement
     */
    trackEvent(type, data = {}) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId()
        };

        this.events.push(event);
        this.saveEvents();
        this.updateMetrics(type, data);
    }

    /**
     * Met à jour les métriques basées sur un événement
     * @param {string} type - Type d'événement
     * @param {Object} data - Données de l'événement
     */
    updateMetrics(type, data) {
        switch (type) {
            case 'request_created':
                this.metrics.totalRequests++;
                break;
            case 'request_resolved':
                this.metrics.resolvedRequests++;
                if (data.resolutionTime) {
                    this.updateAverageResolutionTime(data.resolutionTime);
                }
                break;
            case 'request_cancelled':
                this.metrics.cancelledRequests++;
                break;
            case 'message_sent':
                this.metrics.totalChatMessages++;
                break;
            case 'feedback_submitted':
                if (data.rating) {
                    this.updateAverageRating(data.rating);
                }
                break;
        }
        this.saveMetrics();
    }

    /**
     * Met à jour le temps moyen de résolution
     * @param {number} newTime - Nouveau temps en minutes
     */
    updateAverageResolutionTime(newTime) {
        const total = this.metrics.averageResolutionTime * (this.metrics.resolvedRequests - 1);
        this.metrics.averageResolutionTime = (total + newTime) / this.metrics.resolvedRequests;
    }

    /**
     * Met à jour la note moyenne
     * @param {number} rating - Nouvelle note
     */
    updateAverageRating(rating) {
        const total = this.metrics.averageRating * this.metrics.totalRatings;
        this.metrics.totalRatings++;
        this.metrics.averageRating = (total + rating) / this.metrics.totalRatings;
    }

    /**
     * Obtient l'ID de l'utilisateur actuel
     * @returns {string} - ID utilisateur
     */
    getCurrentUserId() {
        return localStorage.getItem('techleadId') || localStorage.getItem('developerId') || 'anonymous';
    }

    /**
     * Obtient les statistiques d'une période
     * @param {number} days - Nombre de jours
     * @returns {Object} - Statistiques
     */
    getStats(days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        const periodEvents = this.events.filter(e =>
            new Date(e.timestamp) >= startDate
        );

        const stats = {
            requestsCreated: periodEvents.filter(e => e.type === 'request_created').length,
            requestsResolved: periodEvents.filter(e => e.type === 'request_resolved').length,
            requestsCancelled: periodEvents.filter(e => e.type === 'request_cancelled').length,
            messagesSent: periodEvents.filter(e => e.type === 'message_sent').length,
            feedbackSubmitted: periodEvents.filter(e => e.type === 'feedback_submitted').length,
            averageRating: this.calculatePeriodAverageRating(periodEvents),
            averageResolutionTime: this.calculatePeriodAverageResolutionTime(periodEvents),
            busyHours: this.getBusyHours(periodEvents),
            topTags: this.getTopTags(periodEvents)
        };

        return stats;
    }

    /**
     * Calcule la note moyenne d'une période
     * @param {Array} events - Événements
     * @returns {number} - Note moyenne
     */
    calculatePeriodAverageRating(events) {
        const feedbackEvents = events.filter(e => e.type === 'feedback_submitted' && e.data.rating);
        if (feedbackEvents.length === 0) return 0;

        const sum = feedbackEvents.reduce((acc, e) => acc + e.data.rating, 0);
        return sum / feedbackEvents.length;
    }

    /**
     * Calcule le temps moyen de résolution d'une période
     * @param {Array} events - Événements
     * @returns {number} - Temps moyen en minutes
     */
    calculatePeriodAverageResolutionTime(events) {
        const resolvedEvents = events.filter(e => e.type === 'request_resolved' && e.data.resolutionTime);
        if (resolvedEvents.length === 0) return 0;

        const sum = resolvedEvents.reduce((acc, e) => acc + e.data.resolutionTime, 0);
        return sum / resolvedEvents.length;
    }

    /**
     * Obtient les heures les plus chargées
     * @param {Array} events - Événements
     * @returns {Object} - Heures avec nombre d'événements
     */
    getBusyHours(events) {
        const hours = {};
        events.forEach(e => {
            const hour = new Date(e.timestamp).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });
        return hours;
    }

    /**
     * Obtient les tags les plus utilisés
     * @param {Array} events - Événements
     * @returns {Object} - Tags avec compteurs
     */
    getTopTags(events) {
        const tags = {};
        events.forEach(e => {
            if (e.data.tags && Array.isArray(e.data.tags)) {
                e.data.tags.forEach(tag => {
                    tags[tag] = (tags[tag] || 0) + 1;
                });
            }
        });
        return Object.entries(tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
    }

    /**
     * Exporte les données analytics
     * @param {string} format - Format d'export ('json' ou 'csv')
     * @returns {string} - Données exportées
     */
    export(format = 'json') {
        if (format === 'json') {
            return JSON.stringify({
                events: this.events,
                metrics: this.metrics,
                exportDate: new Date().toISOString()
            }, null, 2);
        } else if (format === 'csv') {
            return this.exportCSV();
        }
    }

    /**
     * Exporte en CSV
     * @returns {string} - Données CSV
     */
    exportCSV() {
        const headers = ['Type', 'Timestamp', 'User ID', 'Data'];
        const rows = this.events.map(e => [
            e.type,
            e.timestamp,
            e.userId,
            JSON.stringify(e.data)
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Réinitialise toutes les données analytics
     */
    reset() {
        this.events = [];
        this.metrics = {
            totalRequests: 0,
            resolvedRequests: 0,
            cancelledRequests: 0,
            averageResolutionTime: 0,
            totalChatMessages: 0,
            averageRating: 0,
            totalRatings: 0
        };
        this.saveEvents();
        this.saveMetrics();
    }
}

// Instance globale
window.analyticsManager = new AnalyticsManager();
