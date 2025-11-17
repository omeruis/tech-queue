/**
 * Gestionnaire de base de données IndexedDB pour persistance locale avancée
 */
class IndexedDBManager {
    constructor() {
        this.dbName = 'TechQueueDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialise la base de données
     * @returns {Promise} - Promise résolue avec la DB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('Erreur lors de l\'ouverture de la base de données'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialisée avec succès');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store pour les demandes
                if (!db.objectStoreNames.contains('requests')) {
                    const requestsStore = db.createObjectStore('requests', { keyPath: 'id' });
                    requestsStore.createIndex('status', 'status', { unique: false });
                    requestsStore.createIndex('techleadId', 'techleadId', { unique: false });
                    requestsStore.createIndex('developerId', 'developerId', { unique: false });
                    requestsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    requestsStore.createIndex('priority', 'priority', { unique: false });
                }

                // Store pour les messages
                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messagesStore.createIndex('requestId', 'requestId', { unique: false });
                    messagesStore.createIndex('senderId', 'senderId', { unique: false });
                    messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store pour les feedbacks
                if (!db.objectStoreNames.contains('feedbacks')) {
                    const feedbacksStore = db.createObjectStore('feedbacks', { keyPath: 'id' });
                    feedbacksStore.createIndex('requestId', 'requestId', { unique: false });
                    feedbacksStore.createIndex('techleadId', 'techleadId', { unique: false });
                }

                // Store pour les techleads
                if (!db.objectStoreNames.contains('techleads')) {
                    const techleadsStore = db.createObjectStore('techleads', { keyPath: 'id' });
                    techleadsStore.createIndex('isAvailable', 'isAvailable', { unique: false });
                }

                // Store pour les fichiers
                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', { keyPath: 'id' });
                    filesStore.createIndex('requestId', 'requestId', { unique: false });
                    filesStore.createIndex('messageId', 'messageId', { unique: false });
                }

                console.log('Schéma de base de données créé');
            };
        });
    }

    /**
     * Ajoute un élément dans un store
     * @param {string} storeName - Nom du store
     * @param {Object} data - Données à ajouter
     * @returns {Promise} - Promise résolue avec l'ID
     */
    async add(storeName, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Met à jour un élément
     * @param {string} storeName - Nom du store
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise} - Promise résolue
     */
    async update(storeName, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère un élément par ID
     * @param {string} storeName - Nom du store
     * @param {string} id - ID de l'élément
     * @returns {Promise} - Promise résolue avec l'élément
     */
    async get(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère tous les éléments d'un store
     * @param {string} storeName - Nom du store
     * @returns {Promise} - Promise résolue avec le tableau
     */
    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère des éléments par index
     * @param {string} storeName - Nom du store
     * @param {string} indexName - Nom de l'index
     * @param {any} value - Valeur à rechercher
     * @returns {Promise} - Promise résolue avec le tableau
     */
    async getByIndex(storeName, indexName, value) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Supprime un élément
     * @param {string} storeName - Nom du store
     * @param {string} id - ID de l'élément
     * @returns {Promise} - Promise résolue
     */
    async delete(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Vide un store
     * @param {string} storeName - Nom du store
     * @returns {Promise} - Promise résolue
     */
    async clear(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Compte le nombre d'éléments
     * @param {string} storeName - Nom du store
     * @returns {Promise<number>} - Nombre d'éléments
     */
    async count(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Recherche avec filtre personnalisé
     * @param {string} storeName - Nom du store
     * @param {Function} filterFn - Fonction de filtrage
     * @returns {Promise<Array>} - Résultats filtrés
     */
    async search(storeName, filterFn) {
        const allItems = await this.getAll(storeName);
        return allItems.filter(filterFn);
    }

    /**
     * Synchronise localStorage vers IndexedDB
     * @returns {Promise} - Promise résolue
     */
    async syncFromLocalStorage() {
        try {
            // Synchroniser les demandes
            const requests = JSON.parse(localStorage.getItem('requests') || '[]');
            for (const request of requests) {
                await this.update('requests', request);
            }

            // Synchroniser les messages
            const messages = JSON.parse(localStorage.getItem('messages') || '[]');
            for (const message of messages) {
                await this.update('messages', message);
            }

            // Synchroniser les feedbacks
            const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
            for (const feedback of feedbacks) {
                await this.update('feedbacks', feedback);
            }

            console.log('Synchronisation localStorage → IndexedDB terminée');
            return true;
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
            return false;
        }
    }

    /**
     * Exporte toute la base de données
     * @returns {Promise<Object>} - Données exportées
     */
    async exportAll() {
        const data = {
            requests: await this.getAll('requests'),
            messages: await this.getAll('messages'),
            feedbacks: await this.getAll('feedbacks'),
            techleads: await this.getAll('techleads'),
            files: await this.getAll('files'),
            exportDate: new Date().toISOString()
        };

        return data;
    }

    /**
     * Importe des données
     * @param {Object} data - Données à importer
     * @returns {Promise<boolean>} - Succès
     */
    async importAll(data) {
        try {
            // Importer les demandes
            if (data.requests) {
                for (const request of data.requests) {
                    await this.update('requests', request);
                }
            }

            // Importer les messages
            if (data.messages) {
                for (const message of data.messages) {
                    await this.update('messages', message);
                }
            }

            // Importer les feedbacks
            if (data.feedbacks) {
                for (const feedback of data.feedbacks) {
                    await this.update('feedbacks', feedback);
                }
            }

            // Importer les techleads
            if (data.techleads) {
                for (const techlead of data.techleads) {
                    await this.update('techleads', techlead);
                }
            }

            // Importer les fichiers
            if (data.files) {
                for (const file of data.files) {
                    await this.update('files', file);
                }
            }

            console.log('Import terminé avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }

    /**
     * Ferme la connexion à la base de données
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     * Supprime complètement la base de données
     * @returns {Promise} - Promise résolue
     */
    async deleteDatabase() {
        this.close();

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);

            request.onsuccess = () => {
                console.log('Base de données supprimée');
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la suppression de la base de données'));
            };
        });
    }
}

// Instance globale
window.indexedDBManager = new IndexedDBManager();

// Initialiser automatiquement
window.indexedDBManager.init().catch(err => {
    console.error('Erreur lors de l\'initialisation d\'IndexedDB:', err);
});
