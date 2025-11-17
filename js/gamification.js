/**
 * Système de gamification (badges, points, classements)
 */
class GamificationManager {
    constructor() {
        this.userStats = this.loadUserStats();
        this.badges = this.getBadgeDefinitions();
        this.achievements = this.loadAchievements();
    }

    /**
     * Charge les statistiques utilisateur
     * @returns {Object} - Stats
     */
    loadUserStats() {
        const stored = localStorage.getItem('user_stats');
        return stored ? JSON.parse(stored) : {
            points: 0,
            level: 1,
            requestsResolved: 0,
            requestsCreated: 0,
            messagesExchanged: 0,
            averageResponseTime: 0,
            feedbackReceived: 0,
            averageRating: 0,
            helpfulVotes: 0,
            articlesCreated: 0,
            streak: 0,
            lastActiveDate: null
        };
    }

    /**
     * Sauvegarde les stats
     */
    saveUserStats() {
        localStorage.setItem('user_stats', JSON.stringify(this.userStats));
    }

    /**
     * Charge les succès débloqués
     * @returns {Array} - Succès
     */
    loadAchievements() {
        const stored = localStorage.getItem('achievements');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Sauvegarde les succès
     */
    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    /**
     * Définitions des badges
     * @returns {Array} - Badges
     */
    getBadgeDefinitions() {
        return [
            {
                id: 'first-request',
                name: 'Première demande',
                description: 'Soumettre votre première demande d\'assistance',
                icon: '🎯',
                points: 10,
                condition: (stats) => stats.requestsCreated >= 1
            },
            {
                id: 'helper-newbie',
                name: 'Assistant débutant',
                description: 'Résoudre 5 demandes',
                icon: '🌟',
                points: 50,
                condition: (stats) => stats.requestsResolved >= 5
            },
            {
                id: 'helper-pro',
                name: 'Assistant professionnel',
                description: 'Résoudre 25 demandes',
                icon: '⭐',
                points: 250,
                condition: (stats) => stats.requestsResolved >= 25
            },
            {
                id: 'helper-expert',
                name: 'Expert en assistance',
                description: 'Résoudre 100 demandes',
                icon: '🏆',
                points: 1000,
                condition: (stats) => stats.requestsResolved >= 100
            },
            {
                id: 'fast-responder',
                name: 'Réponse éclair',
                description: 'Temps de réponse moyen < 5 minutes',
                icon: '⚡',
                points: 100,
                condition: (stats) => stats.averageResponseTime > 0 && stats.averageResponseTime < 5
            },
            {
                id: 'communicator',
                name: 'Grand communicateur',
                description: 'Échanger 100 messages',
                icon: '💬',
                points: 75,
                condition: (stats) => stats.messagesExchanged >= 100
            },
            {
                id: 'highly-rated',
                name: 'Très bien noté',
                description: 'Obtenir une note moyenne de 4.5/5 (minimum 10 évaluations)',
                icon: '🌟',
                points: 200,
                condition: (stats) => stats.feedbackReceived >= 10 && stats.averageRating >= 4.5
            },
            {
                id: 'knowledge-contributor',
                name: 'Contributeur de connaissances',
                description: 'Créer 5 articles dans la base de connaissance',
                icon: '📚',
                points: 150,
                condition: (stats) => stats.articlesCreated >= 5
            },
            {
                id: 'week-streak',
                name: 'Une semaine active',
                description: 'Être actif 7 jours consécutifs',
                icon: '🔥',
                points: 100,
                condition: (stats) => stats.streak >= 7
            },
            {
                id: 'month-streak',
                name: 'Un mois actif',
                description: 'Être actif 30 jours consécutifs',
                icon: '🔥🔥',
                points: 500,
                condition: (stats) => stats.streak >= 30
            },
            {
                id: 'popular-helper',
                name: 'Aide populaire',
                description: 'Recevoir 50 votes "utile"',
                icon: '👍',
                points: 200,
                condition: (stats) => stats.helpfulVotes >= 50
            },
            {
                id: 'early-bird',
                name: 'Lève-tôt',
                description: 'Résoudre 10 demandes avant 9h',
                icon: '🌅',
                points: 75,
                condition: (stats) => stats.earlyMorningResolutions >= 10
            },
            {
                id: 'night-owl',
                name: 'Oiseau de nuit',
                description: 'Résoudre 10 demandes après 22h',
                icon: '🦉',
                points: 75,
                condition: (stats) => stats.lateNightResolutions >= 10
            }
        ];
    }

    /**
     * Ajoute des points
     * @param {number} points - Points à ajouter
     * @param {string} reason - Raison
     */
    addPoints(points, reason = '') {
        this.userStats.points += points;
        this.updateLevel();
        this.saveUserStats();

        // Notification
        if (window.notificationManager) {
            window.notificationManager.show('success', `+${points} points! ${reason}`);
        }

        // Vérifier les nouveaux badges
        this.checkBadges();
    }

    /**
     * Met à jour le niveau
     */
    updateLevel() {
        const newLevel = Math.floor(this.userStats.points / 100) + 1;
        if (newLevel > this.userStats.level) {
            this.userStats.level = newLevel;
            if (window.notificationManager) {
                window.notificationManager.show('success', `🎉 Niveau ${newLevel} atteint!`);
            }
        }
    }

    /**
     * Vérifie et débloque les badges
     */
    checkBadges() {
        this.badges.forEach(badge => {
            // Si le badge n'est pas déjà débloqué
            if (!this.achievements.find(a => a.badgeId === badge.id)) {
                // Vérifier la condition
                if (badge.condition(this.userStats)) {
                    this.unlockBadge(badge);
                }
            }
        });
    }

    /**
     * Débloque un badge
     * @param {Object} badge - Badge
     */
    unlockBadge(badge) {
        const achievement = {
            badgeId: badge.id,
            unlockedAt: new Date().toISOString()
        };

        this.achievements.push(achievement);
        this.saveAchievements();

        // Ajouter les points du badge
        this.userStats.points += badge.points;
        this.updateLevel();
        this.saveUserStats();

        // Notification
        if (window.notificationManager) {
            window.notificationManager.show('success',
                `🏆 Badge débloqué: ${badge.icon} ${badge.name} (+${badge.points} points)`
            );
        }
    }

    /**
     * Enregistre une action
     * @param {string} action - Type d'action
     * @param {Object} data - Données supplémentaires
     */
    recordAction(action, data = {}) {
        switch (action) {
            case 'request_created':
                this.userStats.requestsCreated++;
                this.addPoints(5, 'Demande créée');
                break;

            case 'request_resolved':
                this.userStats.requestsResolved++;
                const points = this.calculateResolutionPoints(data);
                this.addPoints(points, 'Demande résolue');

                // Vérifier l'heure pour les badges spéciaux
                const hour = new Date().getHours();
                if (hour < 9) {
                    this.userStats.earlyMorningResolutions = (this.userStats.earlyMorningResolutions || 0) + 1;
                } else if (hour >= 22) {
                    this.userStats.lateNightResolutions = (this.userStats.lateNightResolutions || 0) + 1;
                }
                break;

            case 'message_sent':
                this.userStats.messagesExchanged++;
                if (this.userStats.messagesExchanged % 10 === 0) {
                    this.addPoints(2, '10 messages échangés');
                }
                break;

            case 'feedback_received':
                this.userStats.feedbackReceived++;
                if (data.rating) {
                    const total = this.userStats.averageRating * (this.userStats.feedbackReceived - 1);
                    this.userStats.averageRating = (total + data.rating) / this.userStats.feedbackReceived;

                    if (data.rating === 5) {
                        this.addPoints(10, 'Note parfaite reçue!');
                    }
                }
                break;

            case 'article_created':
                this.userStats.articlesCreated++;
                this.addPoints(25, 'Article créé');
                break;

            case 'helpful_vote':
                this.userStats.helpfulVotes++;
                this.addPoints(3, 'Vote utile reçu');
                break;
        }

        this.updateStreak();
        this.saveUserStats();
        this.checkBadges();
    }

    /**
     * Calcule les points pour une résolution
     * @param {Object} data - Données de la résolution
     * @returns {number} - Points
     */
    calculateResolutionPoints(data) {
        let points = 20; // Points de base

        // Bonus selon la priorité
        if (data.priority === 'high') points += 10;
        if (data.priority === 'medium') points += 5;

        // Bonus selon le temps de résolution
        if (data.resolutionTime) {
            if (data.resolutionTime < 10) points += 15; // < 10 min
            else if (data.resolutionTime < 30) points += 10; // < 30 min
            else if (data.resolutionTime < 60) points += 5; // < 1h
        }

        return points;
    }

    /**
     * Met à jour la série d'activité
     */
    updateStreak() {
        const today = new Date().toDateString();
        const lastActive = this.userStats.lastActiveDate;

        if (!lastActive) {
            this.userStats.streak = 1;
        } else {
            const lastActiveDate = new Date(lastActive).toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (lastActiveDate === today) {
                // Déjà actif aujourd'hui
                return;
            } else if (lastActiveDate === yesterday) {
                // Actif hier, continuer la série
                this.userStats.streak++;
            } else {
                // Série brisée
                this.userStats.streak = 1;
            }
        }

        this.userStats.lastActiveDate = new Date().toISOString();
        this.saveUserStats();
    }

    /**
     * Obtient les badges débloqués
     * @returns {Array} - Badges débloqués avec leurs détails
     */
    getUnlockedBadges() {
        return this.achievements.map(achievement => {
            const badge = this.badges.find(b => b.id === achievement.badgeId);
            return {
                ...badge,
                unlockedAt: achievement.unlockedAt
            };
        }).sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
    }

    /**
     * Obtient les badges verrouillés
     * @returns {Array} - Badges non débloqués
     */
    getLockedBadges() {
        return this.badges.filter(badge =>
            !this.achievements.find(a => a.badgeId === badge.id)
        );
    }

    /**
     * Obtient les statistiques
     * @returns {Object} - Stats
     */
    getStats() {
        return { ...this.userStats };
    }

    /**
     * Obtient le classement (basé sur le localStorage partagé)
     * @returns {Array} - Classement
     */
    getLeaderboard() {
        // Note: Pour un vrai classement, il faudrait un backend
        // Ici on retourne juste l'utilisateur actuel
        return [{
            userId: localStorage.getItem('techleadId') || localStorage.getItem('developerId') || 'user',
            userName: localStorage.getItem('techleadId') || localStorage.getItem('developerName') || 'Vous',
            points: this.userStats.points,
            level: this.userStats.level,
            badgesCount: this.achievements.length
        }];
    }

    /**
     * Réinitialise les stats
     */
    reset() {
        this.userStats = {
            points: 0,
            level: 1,
            requestsResolved: 0,
            requestsCreated: 0,
            messagesExchanged: 0,
            averageResponseTime: 0,
            feedbackReceived: 0,
            averageRating: 0,
            helpfulVotes: 0,
            articlesCreated: 0,
            streak: 0,
            lastActiveDate: null
        };
        this.achievements = [];
        this.saveUserStats();
        this.saveAchievements();
    }
}

// Instance globale
window.gamificationManager = new GamificationManager();
