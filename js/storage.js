/**
 * Service de gestion du stockage local
 * Ce service permet de sauvegarder et récupérer des données localement
 */
class StorageService {
    constructor(storagePrefix = 'techQueue_') {
        this.prefix = storagePrefix;
        this.storage = window.localStorage;
    }

    /**
     * Sauvegarde des données
     * @param {string} key - Clé de stockage
     * @param {*} data - Données à stocker (seront converties en JSON)
     */
    save(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            this.storage.setItem(this.prefix + key, serializedData);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
            return false;
        }
    }

    /**
     * Récupère des données stockées
     * @param {string} key - Clé de stockage
     * @param {*} defaultValue - Valeur par défaut si aucune donnée n'est trouvée
     * @returns {*} Données stockées ou valeur par défaut
     */
    get(key, defaultValue = null) {
        try {
            const serializedData = this.storage.getItem(this.prefix + key);
            
            if (serializedData === null) {
                return defaultValue;
            }
            
            return JSON.parse(serializedData);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            return defaultValue;
        }
    }

    /**
     * Supprime des données stockées
     * @param {string} key - Clé de stockage
     * @returns {boolean} - Statut de l'opération
     */
    remove(key) {
        try {
            this.storage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            return false;
        }
    }

    /**
     * Vérifie si une clé existe
     * @param {string} key - Clé de stockage
     * @returns {boolean} - Vrai si la clé existe
     */
    exists(key) {
        return this.storage.getItem(this.prefix + key) !== null;
    }

    /**
     * Sauvegarde une valeur dans une liste
     * @param {string} listKey - Clé de la liste
     * @param {*} item - Élément à ajouter
     * @param {string} idField - Champ d'identifiant pour éviter les doublons (optionnel)
     * @returns {Array} - Liste mise à jour
     */
    addToList(listKey, item, idField = null) {
        const list = this.get(listKey, []);
        
        // Si idField est spécifié, vérifier les doublons
        if (idField && item[idField]) {
            const index = list.findIndex(i => i[idField] === item[idField]);
            
            if (index >= 0) {
                // Mettre à jour l'élément existant
                list[index] = { ...list[index], ...item };
            } else {
                // Ajouter un nouvel élément
                list.push(item);
            }
        } else {
            // Ajouter sans vérifier les doublons
            list.push(item);
        }
        
        this.save(listKey, list);
        return list;
    }

    /**
     * Met à jour un élément dans une liste
     * @param {string} listKey - Clé de la liste
     * @param {string} itemId - ID de l'élément à mettre à jour
     * @param {*} updates - Modifications à appliquer
     * @param {string} idField - Champ d'identifiant (par défaut 'id')
     * @returns {Array} - Liste mise à jour
     */
    updateInList(listKey, itemId, updates, idField = 'id') {
        const list = this.get(listKey, []);
        const index = list.findIndex(item => item[idField] === itemId);
        
        if (index >= 0) {
            list[index] = { ...list[index], ...updates };
            this.save(listKey, list);
        }
        
        return list;
    }

    /**
     * Supprime un élément d'une liste
     * @param {string} listKey - Clé de la liste
     * @param {string} itemId - ID de l'élément à supprimer
     * @param {string} idField - Champ d'identifiant (par défaut 'id')
     * @returns {Array} - Liste mise à jour
     */
    removeFromList(listKey, itemId, idField = 'id') {
        const list = this.get(listKey, []);
        const newList = list.filter(item => item[idField] !== itemId);
        
        this.save(listKey, newList);
        return newList;
    }

    /**
     * Vide le stockage en supprimant toutes les clés avec ce préfixe
     */
    clear() {
        Object.keys(this.storage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                this.storage.removeItem(key);
            }
        });
    }
}

// Exporter une instance unique
const storageService = new StorageService();