/**
 * Gestionnaire d'export de données
 */
class DataExportManager {
    constructor() {
        this.formats = ['json', 'csv', 'html'];
    }

    /**
     * Exporte toutes les données
     * @param {string} format - Format d'export
     * @returns {Promise<string>} - Données exportées
     */
    async exportAll(format = 'json') {
        const data = await this.collectAllData();

        switch (format) {
            case 'json':
                return this.exportJSON(data);
            case 'csv':
                return this.exportCSV(data);
            case 'html':
                return this.exportHTML(data);
            default:
                throw new Error(`Format non supporté: ${format}`);
        }
    }

    /**
     * Collecte toutes les données
     * @returns {Promise<Object>} - Toutes les données
     */
    async collectAllData() {
        const data = {
            requests: [],
            messages: [],
            feedbacks: [],
            techleads: [],
            analytics: {},
            knowledgeBase: [],
            userStats: {},
            exportDate: new Date().toISOString(),
            exportedBy: localStorage.getItem('developerId') || localStorage.getItem('techleadId') || 'anonymous'
        };

        // Récupérer depuis IndexedDB si disponible
        if (window.indexedDBManager && window.indexedDBManager.db) {
            try {
                data.requests = await window.indexedDBManager.getAll('requests');
                data.messages = await window.indexedDBManager.getAll('messages');
                data.feedbacks = await window.indexedDBManager.getAll('feedbacks');
                data.techleads = await window.indexedDBManager.getAll('techleads');
            } catch (error) {
                console.error('Erreur IndexedDB, utilisation de localStorage:', error);
            }
        }

        // Fallback sur localStorage
        if (data.requests.length === 0) {
            data.requests = JSON.parse(localStorage.getItem('requests') || '[]');
            data.messages = JSON.parse(localStorage.getItem('messages') || '[]');
            data.feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
        }

        // Analytics
        if (window.analyticsManager) {
            data.analytics = {
                events: window.analyticsManager.events,
                metrics: window.analyticsManager.metrics,
                stats: window.analyticsManager.getStats(30)
            };
        }

        // Base de connaissance
        if (window.knowledgeBase) {
            data.knowledgeBase = window.knowledgeBase.articles;
        }

        // Stats utilisateur
        if (window.gamificationManager) {
            data.userStats = window.gamificationManager.getStats();
            data.achievements = window.gamificationManager.getUnlockedBadges();
        }

        return data;
    }

    /**
     * Exporte en JSON
     * @param {Object} data - Données
     * @returns {string} - JSON formaté
     */
    exportJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Exporte en CSV
     * @param {Object} data - Données
     * @returns {string} - CSV
     */
    exportCSV(data) {
        let csv = '';

        // Export des demandes
        csv += 'DEMANDES D\'ASSISTANCE\n';
        csv += 'ID,Titre,Description,Priorité,Statut,Développeur,Équipe,Techlead,Créé le,Résolu le\n';

        data.requests.forEach(r => {
            csv += this.escapeCSV([
                r.id,
                r.title,
                r.description,
                r.priority,
                r.status,
                r.developerName,
                r.developerTeam,
                r.techleadId || 'N/A',
                r.createdAt,
                r.resolvedAt || 'N/A'
            ]) + '\n';
        });

        csv += '\n\nMESSAGES\n';
        csv += 'ID,Expéditeur,Contenu,Date,Demande ID\n';

        data.messages.forEach(m => {
            csv += this.escapeCSV([
                m.id,
                m.senderName,
                m.content.substring(0, 100),
                m.timestamp,
                m.requestId
            ]) + '\n';
        });

        csv += '\n\nFEEDBACKS\n';
        csv += 'ID,Note,Commentaire,Demande ID,Date\n';

        data.feedbacks.forEach(f => {
            csv += this.escapeCSV([
                f.id,
                f.rating,
                f.comment,
                f.requestId,
                f.timestamp
            ]) + '\n';
        });

        return csv;
    }

    /**
     * Échappe les valeurs CSV
     * @param {Array} values - Valeurs
     * @returns {string} - Ligne CSV
     */
    escapeCSV(values) {
        return values.map(v => {
            if (v === null || v === undefined) return '';
            const str = String(v).replace(/"/g, '""');
            return `"${str}"`;
        }).join(',');
    }

    /**
     * Exporte en HTML
     * @param {Object} data - Données
     * @returns {string} - HTML
     */
    exportHTML(data) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export TechQueue - ${new Date().toLocaleDateString('fr-FR')}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #007bff;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge.low { background: #d1ecf1; color: #0c5460; }
        .badge.medium { background: #fff3cd; color: #856404; }
        .badge.high { background: #f8d7da; color: #721c24; }
        .badge.waiting { background: #e2e3e5; color: #383d41; }
        .badge.in-progress { background: #cce5ff; color: #004085; }
        .badge.resolved { background: #d4edda; color: #155724; }
        .stat {
            display: inline-block;
            background: #e9ecef;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 10px 10px 10px 0;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Export TechQueue</h1>
        <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
        <p>Exporté par: ${data.exportedBy}</p>
    </div>

    ${this.generateStatsSection(data)}
    ${this.generateRequestsSection(data.requests)}
    ${this.generateMessagesSection(data.messages)}
    ${this.generateFeedbacksSection(data.feedbacks)}
    ${this.generateKnowledgeBaseSection(data.knowledgeBase)}
    ${this.generateAchievementsSection(data.achievements)}
</body>
</html>
        `;
    }

    /**
     * Génère la section statistiques
     * @param {Object} data - Données
     * @returns {string} - HTML
     */
    generateStatsSection(data) {
        if (!data.analytics || !data.analytics.metrics) return '';

        const m = data.analytics.metrics;

        return `
    <div class="section">
        <h2>Statistiques générales</h2>
        <div class="stat">
            <div class="stat-value">${m.totalRequests || 0}</div>
            <div class="stat-label">Demandes totales</div>
        </div>
        <div class="stat">
            <div class="stat-value">${m.resolvedRequests || 0}</div>
            <div class="stat-label">Demandes résolues</div>
        </div>
        <div class="stat">
            <div class="stat-value">${(m.averageResolutionTime || 0).toFixed(1)} min</div>
            <div class="stat-label">Temps moyen de résolution</div>
        </div>
        <div class="stat">
            <div class="stat-value">${(m.averageRating || 0).toFixed(1)} / 5</div>
            <div class="stat-label">Note moyenne</div>
        </div>
        <div class="stat">
            <div class="stat-value">${m.totalChatMessages || 0}</div>
            <div class="stat-label">Messages échangés</div>
        </div>
    </div>
        `;
    }

    /**
     * Génère la section demandes
     * @param {Array} requests - Demandes
     * @returns {string} - HTML
     */
    generateRequestsSection(requests) {
        if (!requests || requests.length === 0) return '';

        return `
    <div class="section">
        <h2>Demandes d'assistance (${requests.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Titre</th>
                    <th>Développeur</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(r => `
                <tr>
                    <td><strong>${r.title}</strong><br><small>${r.description.substring(0, 100)}...</small></td>
                    <td>${r.developerName}<br><small>${r.developerTeam || ''}</small></td>
                    <td><span class="badge ${r.priority}">${r.priority}</span></td>
                    <td><span class="badge ${r.status}">${r.status}</span></td>
                    <td>${new Date(r.createdAt).toLocaleString('fr-FR')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
        `;
    }

    /**
     * Génère la section messages
     * @param {Array} messages - Messages
     * @returns {string} - HTML
     */
    generateMessagesSection(messages) {
        if (!messages || messages.length === 0) return '';

        return `
    <div class="section">
        <h2>Messages (${messages.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Expéditeur</th>
                    <th>Message</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${messages.slice(0, 100).map(m => `
                <tr>
                    <td><strong>${m.senderName}</strong></td>
                    <td>${m.content.substring(0, 150)}...</td>
                    <td>${new Date(m.timestamp).toLocaleString('fr-FR')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ${messages.length > 100 ? `<p><em>Affichage des 100 premiers messages sur ${messages.length}</em></p>` : ''}
    </div>
        `;
    }

    /**
     * Génère la section feedbacks
     * @param {Array} feedbacks - Feedbacks
     * @returns {string} - HTML
     */
    generateFeedbacksSection(feedbacks) {
        if (!feedbacks || feedbacks.length === 0) return '';

        return `
    <div class="section">
        <h2>Évaluations (${feedbacks.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Note</th>
                    <th>Commentaire</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${feedbacks.map(f => `
                <tr>
                    <td><strong>${'⭐'.repeat(f.rating)}</strong> (${f.rating}/5)</td>
                    <td>${f.comment || '<em>Aucun commentaire</em>'}</td>
                    <td>${new Date(f.timestamp).toLocaleString('fr-FR')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
        `;
    }

    /**
     * Génère la section base de connaissance
     * @param {Array} articles - Articles
     * @returns {string} - HTML
     */
    generateKnowledgeBaseSection(articles) {
        if (!articles || articles.length === 0) return '';

        return `
    <div class="section">
        <h2>Base de connaissance (${articles.length} articles)</h2>
        ${articles.map(a => `
            <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff;">
                <h3 style="margin: 0 0 10px 0;">${a.title}</h3>
                <p><span class="badge">${a.category}</span> | Vues: ${a.views} | Utile: ${a.helpful}</p>
                <div style="margin-top: 10px;">${a.tags.map(t => `<span class="badge">${t}</span>`).join(' ')}</div>
            </div>
        `).join('')}
    </div>
        `;
    }

    /**
     * Génère la section succès
     * @param {Array} achievements - Succès
     * @returns {string} - HTML
     */
    generateAchievementsSection(achievements) {
        if (!achievements || achievements.length === 0) return '';

        return `
    <div class="section">
        <h2>Badges débloqués (${achievements.length})</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${achievements.map(a => `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 48px;">${a.icon}</div>
                    <h4 style="margin: 10px 0 5px 0;">${a.name}</h4>
                    <p style="font-size: 12px; color: #6c757d;">${a.description}</p>
                    <span class="badge">${a.points} points</span>
                </div>
            `).join('')}
        </div>
    </div>
        `;
    }

    /**
     * Télécharge les données exportées
     * @param {string} data - Données
     * @param {string} format - Format
     * @param {string} filename - Nom du fichier (optionnel)
     */
    download(data, format, filename = null) {
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `techqueue-export-${timestamp}.${format}`;
        const finalFilename = filename || defaultFilename;

        const mimeTypes = {
            'json': 'application/json',
            'csv': 'text/csv',
            'html': 'text/html'
        };

        const blob = new Blob([data], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Exporte et télécharge
     * @param {string} format - Format d'export
     */
    async exportAndDownload(format = 'json') {
        try {
            const data = await this.exportAll(format);
            this.download(data, format);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            return false;
        }
    }
}

// Instance globale
window.dataExportManager = new DataExportManager();
