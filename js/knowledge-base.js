/**
 * Système de base de connaissance / FAQ
 */
class KnowledgeBase {
    constructor() {
        this.articles = this.loadArticles();
        this.categories = ['General', 'Frontend', 'Backend', 'Database', 'DevOps', 'Security', 'Performance'];
    }

    /**
     * Charge les articles
     * @returns {Array} - Articles
     */
    loadArticles() {
        const stored = localStorage.getItem('kb_articles');
        return stored ? JSON.parse(stored) : this.getDefaultArticles();
    }

    /**
     * Sauvegarde les articles
     */
    saveArticles() {
        localStorage.setItem('kb_articles', JSON.stringify(this.articles));
    }

    /**
     * Obtient les articles par défaut
     * @returns {Array} - Articles par défaut
     */
    getDefaultArticles() {
        return [
            {
                id: 'kb-1',
                title: 'Comment déboguer une erreur CORS?',
                category: 'Backend',
                tags: ['cors', 'api', 'backend', 'security'],
                content: `# Résolution des erreurs CORS

## Qu'est-ce que CORS?
CORS (Cross-Origin Resource Sharing) est un mécanisme de sécurité du navigateur.

## Solutions communes:
1. Configurer les headers côté serveur:
   \`\`\`javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   \`\`\`

2. Utiliser un proxy en développement
3. Configurer correctement votre serveur (Express, Nginx, etc.)`,
                views: 0,
                helpful: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'kb-2',
                title: 'Optimisation des performances React',
                category: 'Frontend',
                tags: ['react', 'performance', 'frontend', 'optimization'],
                content: `# Optimisation des performances React

## Techniques principales:

1. **Utiliser React.memo**
   \`\`\`javascript
   const MyComponent = React.memo(function MyComponent(props) {
     // Component code
   });
   \`\`\`

2. **useMemo et useCallback**
   \`\`\`javascript
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
   \`\`\`

3. **Lazy loading**
   \`\`\`javascript
   const LazyComponent = React.lazy(() => import('./LazyComponent'));
   \`\`\`

4. **Virtualisation des listes longues**
   - Utiliser react-window ou react-virtualized`,
                views: 0,
                helpful: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'kb-3',
                title: 'Sécuriser une API REST',
                category: 'Security',
                tags: ['api', 'security', 'backend', 'authentication'],
                content: `# Sécurisation d'une API REST

## Bonnes pratiques:

1. **Authentification JWT**
   - Utiliser des tokens avec expiration
   - Stocker de manière sécurisée (httpOnly cookies)

2. **Validation des entrées**
   - Toujours valider et sanitizer les données
   - Utiliser des librairies comme Joi ou Yup

3. **Rate limiting**
   - Limiter le nombre de requêtes par IP
   - Utiliser express-rate-limit

4. **HTTPS obligatoire**
   - Forcer l'utilisation de HTTPS
   - Rediriger HTTP vers HTTPS

5. **Protéger contre les injections**
   - Utiliser des requêtes préparées
   - Échapper les données utilisateur`,
                views: 0,
                helpful: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    /**
     * Recherche dans la base de connaissance
     * @param {string} query - Requête de recherche
     * @param {Array} filters - Filtres (catégories, tags)
     * @returns {Array} - Résultats
     */
    search(query, filters = {}) {
        let results = [...this.articles];

        // Filtrer par catégorie
        if (filters.category) {
            results = results.filter(a => a.category === filters.category);
        }

        // Filtrer par tags
        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(a =>
                filters.tags.some(tag => a.tags.includes(tag))
            );
        }

        // Recherche textuelle
        if (query && query.trim()) {
            const normalizedQuery = query.toLowerCase();
            results = results.filter(a =>
                a.title.toLowerCase().includes(normalizedQuery) ||
                a.content.toLowerCase().includes(normalizedQuery) ||
                a.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
            );
        }

        // Trier par pertinence (nombre de vues et helpful)
        results.sort((a, b) => {
            const scoreA = a.views + (a.helpful * 2);
            const scoreB = b.views + (b.helpful * 2);
            return scoreB - scoreA;
        });

        return results;
    }

    /**
     * Suggère des articles basés sur une demande
     * @param {string} title - Titre de la demande
     * @param {string} description - Description
     * @param {Array} tags - Tags
     * @returns {Array} - Articles suggérés
     */
    suggest(title, description, tags = []) {
        const query = `${title} ${description}`.toLowerCase();
        const words = query.split(/\s+/).filter(w => w.length > 3);

        let scores = this.articles.map(article => {
            let score = 0;

            // Score basé sur les tags
            if (tags && article.tags) {
                const matchingTags = tags.filter(t => article.tags.includes(t));
                score += matchingTags.length * 10;
            }

            // Score basé sur les mots-clés
            words.forEach(word => {
                if (article.title.toLowerCase().includes(word)) score += 5;
                if (article.content.toLowerCase().includes(word)) score += 2;
                if (article.tags.some(tag => tag.includes(word))) score += 3;
            });

            return { article, score };
        });

        return scores
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => s.article);
    }

    /**
     * Obtient un article par ID
     * @param {string} id - ID de l'article
     * @returns {Object|null} - Article
     */
    getArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (article) {
            article.views++;
            this.saveArticles();
        }
        return article || null;
    }

    /**
     * Crée un nouvel article
     * @param {Object} data - Données de l'article
     * @returns {Object} - Nouvel article
     */
    createArticle(data) {
        const article = {
            id: `kb-${Date.now()}`,
            title: data.title || 'Sans titre',
            category: data.category || 'General',
            tags: data.tags || [],
            content: data.content || '',
            views: 0,
            helpful: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.articles.push(article);
        this.saveArticles();
        return article;
    }

    /**
     * Met à jour un article
     * @param {string} id - ID de l'article
     * @param {Object} updates - Mises à jour
     * @returns {boolean} - Succès
     */
    updateArticle(id, updates) {
        const index = this.articles.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.articles[index] = {
            ...this.articles[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveArticles();
        return true;
    }

    /**
     * Supprime un article
     * @param {string} id - ID de l'article
     * @returns {boolean} - Succès
     */
    deleteArticle(id) {
        const index = this.articles.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.articles.splice(index, 1);
        this.saveArticles();
        return true;
    }

    /**
     * Marque un article comme utile
     * @param {string} id - ID de l'article
     */
    markHelpful(id) {
        const article = this.articles.find(a => a.id === id);
        if (article) {
            article.helpful++;
            this.saveArticles();
        }
    }

    /**
     * Crée un article depuis une demande résolue
     * @param {Object} request - Demande résolue
     * @param {string} solution - Solution
     * @returns {Object} - Nouvel article
     */
    createFromRequest(request, solution) {
        const suggestedTags = request.tags || [];

        return this.createArticle({
            title: request.title,
            category: this.suggestCategory(suggestedTags),
            tags: suggestedTags,
            content: `# ${request.title}

## Problème
${request.description}

${request.code ? `## Code concerné
\`\`\`
${request.code}
\`\`\`` : ''}

## Solution
${solution}

---
*Créé depuis la demande ${request.id} le ${Utils.formatDate(request.resolvedAt)}*`
        });
    }

    /**
     * Suggère une catégorie basée sur les tags
     * @param {Array} tags - Tags
     * @returns {string} - Catégorie suggérée
     */
    suggestCategory(tags) {
        const categoryKeywords = {
            'Frontend': ['react', 'vue', 'angular', 'css', 'html', 'ui', 'ux'],
            'Backend': ['node', 'express', 'api', 'server', 'rest'],
            'Database': ['sql', 'mongodb', 'database', 'query'],
            'DevOps': ['docker', 'deployment', 'ci/cd', 'nginx'],
            'Security': ['security', 'authentication', 'authorization', 'cors'],
            'Performance': ['performance', 'optimization', 'cache', 'speed']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (tags.some(tag => keywords.includes(tag.toLowerCase()))) {
                return category;
            }
        }

        return 'General';
    }

    /**
     * Obtient toutes les catégories
     * @returns {Array} - Catégories
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Obtient le nombre d'articles par catégorie
     * @returns {Object} - Compteurs
     */
    getCategoryCounts() {
        const counts = {};
        this.categories.forEach(cat => counts[cat] = 0);

        this.articles.forEach(article => {
            if (counts[article.category] !== undefined) {
                counts[article.category]++;
            }
        });

        return counts;
    }

    /**
     * Exporte la base de connaissance
     * @returns {string} - JSON exporté
     */
    export() {
        return JSON.stringify({
            articles: this.articles,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Importe des articles
     * @param {string} jsonData - Données JSON
     * @returns {boolean} - Succès
     */
    import(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.articles && Array.isArray(data.articles)) {
                this.articles = data.articles;
                this.saveArticles();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            return false;
        }
    }
}

// Instance globale
window.knowledgeBase = new KnowledgeBase();
