/**
 * Gestionnaire de raccourcis clavier
 */
class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = this.getDefaultShortcuts();
        this.enabled = true;
        this.init();
    }

    /**
     * Initialise les raccourcis clavier
     */
    init() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            // Ne pas intercepter si on est dans un input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Sauf pour certains raccourcis spéciaux
                if (!e.ctrlKey && !e.metaKey) return;
            }

            this.handleKeyPress(e);
        });
    }

    /**
     * Obtient les raccourcis par défaut
     * @returns {Array} - Raccourcis
     */
    getDefaultShortcuts() {
        return [
            {
                key: '?',
                description: 'Afficher l\'aide des raccourcis',
                action: () => this.showHelp()
            },
            {
                key: 'n',
                description: 'Nouvelle demande',
                action: () => this.focusNewRequest()
            },
            {
                key: 'c',
                description: 'Ouvrir/fermer le chat',
                action: () => this.toggleChat()
            },
            {
                key: 'Escape',
                description: 'Fermer les modales',
                action: () => this.closeModals()
            },
            {
                key: 'k',
                ctrl: true,
                description: 'Recherche rapide (Ctrl+K)',
                action: () => this.openQuickSearch()
            },
            {
                key: 's',
                ctrl: true,
                description: 'Sauvegarder / Soumettre (Ctrl+S)',
                action: (e) => {
                    e.preventDefault();
                    this.submit();
                }
            },
            {
                key: 't',
                description: 'Basculer le thème',
                action: () => this.toggleTheme()
            },
            {
                key: 'h',
                description: 'Aller à l\'accueil',
                action: () => this.goHome()
            },
            {
                key: 'ArrowUp',
                description: 'Demande précédente',
                action: () => this.navigateRequests(-1)
            },
            {
                key: 'ArrowDown',
                description: 'Demande suivante',
                action: () => this.navigateRequests(1)
            },
            {
                key: 'Enter',
                ctrl: true,
                description: 'Envoyer le message (Ctrl+Enter)',
                action: () => this.sendMessage()
            },
            {
                key: '/',
                description: 'Rechercher',
                action: () => this.focusSearch()
            }
        ];
    }

    /**
     * Gère l'appui sur une touche
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyPress(e) {
        const shortcut = this.shortcuts.find(s => {
            const keyMatch = s.key === e.key;
            const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
            const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
            const altMatch = s.alt ? e.altKey : !e.altKey;

            return keyMatch && ctrlMatch && shiftMatch && altMatch;
        });

        if (shortcut) {
            e.preventDefault();
            shortcut.action(e);
        }
    }

    /**
     * Affiche l'aide des raccourcis
     */
    showHelp() {
        const helpModal = document.getElementById('shortcuts-help-modal') || this.createHelpModal();
        helpModal.style.display = 'flex';
    }

    /**
     * Crée la modale d'aide
     * @returns {HTMLElement} - Modale
     */
    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'shortcuts-help-modal';
        modal.className = 'modal';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="modal-content shortcuts-help">
                <div class="modal-header">
                    <h3>Raccourcis clavier</h3>
                    <button class="close-modal" onclick="document.getElementById('shortcuts-help-modal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-list">
                        ${this.shortcuts.map(s => `
                            <div class="shortcut-item">
                                <kbd>${this.formatKey(s)}</kbd>
                                <span>${s.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Formate la représentation d'une touche
     * @param {Object} shortcut - Raccourci
     * @returns {string} - Touche formatée
     */
    formatKey(shortcut) {
        let keys = [];

        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.alt) keys.push('Alt');
        keys.push(shortcut.key);

        return keys.join('+');
    }

    /**
     * Focus sur le formulaire de nouvelle demande
     */
    focusNewRequest() {
        const titleInput = document.getElementById('request-title');
        if (titleInput) {
            titleInput.focus();
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Bascule le chat
     */
    toggleChat() {
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.classList.toggle('active');
        }
    }

    /**
     * Ferme toutes les modales
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });

        document.querySelectorAll('.chat-panel.active').forEach(panel => {
            panel.classList.remove('active');
        });
    }

    /**
     * Ouvre la recherche rapide
     */
    openQuickSearch() {
        // Créer ou afficher la barre de recherche rapide
        let searchBar = document.getElementById('quick-search');

        if (!searchBar) {
            searchBar = this.createQuickSearch();
            document.body.appendChild(searchBar);
        }

        searchBar.style.display = 'flex';
        searchBar.querySelector('input').focus();
    }

    /**
     * Crée la barre de recherche rapide
     * @returns {HTMLElement} - Barre de recherche
     */
    createQuickSearch() {
        const searchBar = document.createElement('div');
        searchBar.id = 'quick-search';
        searchBar.className = 'quick-search';
        searchBar.style.display = 'none';

        searchBar.innerHTML = `
            <div class="quick-search-content">
                <input type="text" placeholder="Rechercher... (techleads, demandes, base de connaissance)">
                <div class="quick-search-results"></div>
            </div>
        `;

        const input = searchBar.querySelector('input');
        const results = searchBar.querySelector('.quick-search-results');

        input.addEventListener('input', (e) => {
            this.performQuickSearch(e.target.value, results);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchBar.style.display = 'none';
            }
        });

        searchBar.onclick = (e) => {
            if (e.target === searchBar) {
                searchBar.style.display = 'none';
            }
        };

        return searchBar;
    }

    /**
     * Effectue une recherche rapide
     * @param {string} query - Requête
     * @param {HTMLElement} resultsEl - Élément des résultats
     */
    performQuickSearch(query, resultsEl) {
        if (!query.trim()) {
            resultsEl.innerHTML = '';
            return;
        }

        let results = [];

        // Rechercher dans la base de connaissance
        if (window.knowledgeBase) {
            const articles = window.knowledgeBase.search(query).slice(0, 3);
            results.push(...articles.map(a => ({
                type: 'article',
                title: a.title,
                subtitle: a.category,
                action: () => this.openArticle(a.id)
            })));
        }

        // Rechercher dans les demandes
        if (window.storageManager) {
            const requests = window.storageManager.searchRequests(query).slice(0, 3);
            results.push(...requests.map(r => ({
                type: 'request',
                title: r.title,
                subtitle: r.developerName,
                action: () => this.openRequest(r.id)
            })));
        }

        resultsEl.innerHTML = results.map(r => `
            <div class="search-result-item" data-type="${r.type}">
                <div class="result-title">${r.title}</div>
                <div class="result-subtitle">${r.subtitle}</div>
            </div>
        `).join('');

        resultsEl.querySelectorAll('.search-result-item').forEach((el, index) => {
            el.onclick = () => {
                results[index].action();
                document.getElementById('quick-search').style.display = 'none';
            };
        });
    }

    /**
     * Soumet le formulaire actif
     */
    submit() {
        const submitBtn = document.querySelector('button[type="submit"]:not([disabled])') ||
                         document.getElementById('submit-request') ||
                         document.getElementById('submit-feedback');

        if (submitBtn) {
            submitBtn.click();
        }
    }

    /**
     * Bascule le thème
     */
    toggleTheme() {
        if (window.themeManager) {
            window.themeManager.toggle();
        }
    }

    /**
     * Retourne à l'accueil
     */
    goHome() {
        window.location.href = 'index.html';
    }

    /**
     * Navigue dans les demandes
     * @param {number} direction - Direction (-1 ou 1)
     */
    navigateRequests(direction) {
        const requests = document.querySelectorAll('.request-item');
        const activeRequest = document.querySelector('.request-item.active');

        if (!requests.length) return;

        let index = Array.from(requests).indexOf(activeRequest);

        if (index === -1) {
            index = 0;
        } else {
            index = (index + direction + requests.length) % requests.length;
        }

        requests[index].click();
        requests[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Envoie un message
     */
    sendMessage() {
        const sendBtn = document.getElementById('send-message');
        if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
        }
    }

    /**
     * Focus sur la recherche
     */
    focusSearch() {
        const searchInput = document.getElementById('techlead-search') ||
                           document.querySelector('input[type="search"]') ||
                           document.querySelector('.search-input');

        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * Ouvre un article
     * @param {string} articleId - ID de l'article
     */
    openArticle(articleId) {
        // À implémenter selon l'interface
        console.log('Ouvrir article:', articleId);
    }

    /**
     * Ouvre une demande
     * @param {string} requestId - ID de la demande
     */
    openRequest(requestId) {
        // À implémenter selon l'interface
        console.log('Ouvrir demande:', requestId);
    }

    /**
     * Active/désactive les raccourcis
     * @param {boolean} enabled - État
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Instance globale
window.keyboardShortcutsManager = new KeyboardShortcutsManager();
