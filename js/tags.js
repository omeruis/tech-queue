/**
 * Système de gestion des tags
 */
class TagManager {
    constructor() {
        this.predefinedTags = [
            'bug', 'feature', 'question', 'urgent',
            'frontend', 'backend', 'database', 'api',
            'performance', 'security', 'ui/ux', 'testing',
            'deployment', 'configuration', 'documentation',
            'react', 'vue', 'angular', 'node.js', 'python',
            'java', 'c#', 'php', 'ruby', 'go'
        ];
        this.customTags = this.loadCustomTags();
    }

    /**
     * Charge les tags personnalisés
     * @returns {Array} - Tags personnalisés
     */
    loadCustomTags() {
        const stored = localStorage.getItem('custom_tags');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Sauvegarde les tags personnalisés
     */
    saveCustomTags() {
        localStorage.setItem('custom_tags', JSON.stringify(this.customTags));
    }

    /**
     * Obtient tous les tags disponibles
     * @returns {Array} - Tous les tags
     */
    getAllTags() {
        return [...new Set([...this.predefinedTags, ...this.customTags])].sort();
    }

    /**
     * Ajoute un tag personnalisé
     * @param {string} tag - Tag à ajouter
     * @returns {boolean} - Succès
     */
    addCustomTag(tag) {
        const normalizedTag = tag.toLowerCase().trim();

        if (!normalizedTag) return false;
        if (this.getAllTags().includes(normalizedTag)) return false;

        this.customTags.push(normalizedTag);
        this.saveCustomTags();
        return true;
    }

    /**
     * Supprime un tag personnalisé
     * @param {string} tag - Tag à supprimer
     * @returns {boolean} - Succès
     */
    removeCustomTag(tag) {
        const index = this.customTags.indexOf(tag);
        if (index === -1) return false;

        this.customTags.splice(index, 1);
        this.saveCustomTags();
        return true;
    }

    /**
     * Recherche des tags
     * @param {string} query - Requête de recherche
     * @returns {Array} - Tags correspondants
     */
    searchTags(query) {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return this.getAllTags();

        return this.getAllTags().filter(tag =>
            tag.includes(normalizedQuery)
        );
    }

    /**
     * Valide un ensemble de tags
     * @param {Array} tags - Tags à valider
     * @returns {Array} - Tags valides
     */
    validateTags(tags) {
        if (!Array.isArray(tags)) return [];

        return tags
            .map(tag => tag.toLowerCase().trim())
            .filter(tag => tag.length > 0 && tag.length <= 50);
    }

    /**
     * Obtient les tags les plus utilisés
     * @param {number} limit - Nombre de tags à retourner
     * @returns {Array} - Tags populaires
     */
    getPopularTags(limit = 10) {
        const tagCounts = {};

        // Compter l'utilisation des tags dans les demandes
        const requests = window.storageManager ? window.storageManager.getAllRequests() : [];
        requests.forEach(request => {
            if (request.tags && Array.isArray(request.tags)) {
                request.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag]) => tag);
    }

    /**
     * Suggère des tags basés sur le titre et la description
     * @param {string} title - Titre
     * @param {string} description - Description
     * @returns {Array} - Tags suggérés
     */
    suggestTags(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        const suggestions = [];

        this.getAllTags().forEach(tag => {
            if (text.includes(tag)) {
                suggestions.push(tag);
            }
        });

        return suggestions.slice(0, 5);
    }

    /**
     * Crée un élément de tag HTML
     * @param {string} tag - Tag
     * @param {boolean} removable - Si le tag peut être supprimé
     * @returns {HTMLElement} - Élément tag
     */
    createTagElement(tag, removable = false) {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagEl.dataset.tag = tag;

        if (removable) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'tag-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => tagEl.remove();
            tagEl.appendChild(removeBtn);
        }

        return tagEl;
    }

    /**
     * Crée un sélecteur de tags
     * @param {Array} selectedTags - Tags déjà sélectionnés
     * @param {Function} onChange - Callback lors du changement
     * @returns {HTMLElement} - Élément sélecteur
     */
    createTagSelector(selectedTags = [], onChange = null) {
        const container = document.createElement('div');
        container.className = 'tag-selector';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tag-input';
        input.placeholder = 'Ajouter des tags...';

        const selectedContainer = document.createElement('div');
        selectedContainer.className = 'selected-tags';

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'tag-suggestions';

        // Afficher les tags sélectionnés
        const updateSelectedTags = () => {
            selectedContainer.innerHTML = '';
            selectedTags.forEach(tag => {
                const tagEl = this.createTagElement(tag, true);
                tagEl.querySelector('.tag-remove').onclick = () => {
                    selectedTags = selectedTags.filter(t => t !== tag);
                    updateSelectedTags();
                    if (onChange) onChange(selectedTags);
                };
                selectedContainer.appendChild(tagEl);
            });
        };

        // Recherche et suggestions
        input.addEventListener('input', () => {
            const query = input.value;
            const suggestions = this.searchTags(query)
                .filter(tag => !selectedTags.includes(tag))
                .slice(0, 10);

            suggestionsContainer.innerHTML = '';
            suggestions.forEach(tag => {
                const suggestionEl = document.createElement('div');
                suggestionEl.className = 'tag-suggestion';
                suggestionEl.textContent = tag;
                suggestionEl.onclick = () => {
                    if (!selectedTags.includes(tag)) {
                        selectedTags.push(tag);
                        updateSelectedTags();
                        input.value = '';
                        suggestionsContainer.innerHTML = '';
                        if (onChange) onChange(selectedTags);
                    }
                };
                suggestionsContainer.appendChild(suggestionEl);
            });
        });

        // Ajouter un tag avec Entrée
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = input.value.toLowerCase().trim();
                if (tag && !selectedTags.includes(tag)) {
                    this.addCustomTag(tag);
                    selectedTags.push(tag);
                    updateSelectedTags();
                    input.value = '';
                    suggestionsContainer.innerHTML = '';
                    if (onChange) onChange(selectedTags);
                }
            }
        });

        updateSelectedTags();

        container.appendChild(selectedContainer);
        container.appendChild(input);
        container.appendChild(suggestionsContainer);

        return container;
    }
}

// Instance globale
window.tagManager = new TagManager();
