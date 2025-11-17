/**
 * Gestionnaire de thème (mode clair/sombre)
 */
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
        this.init();
    }

    /**
     * Initialise le thème
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.setupListeners();
    }

    /**
     * Récupère le thème stocké
     * @returns {string|null} - Thème stocké ou null
     */
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    /**
     * Récupère le thème préféré du système
     * @returns {string} - 'dark' ou 'light'
     */
    getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Applique un thème
     * @param {string} theme - 'dark' ou 'light'
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        // Émettre un événement personnalisé
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme }
        }));
    }

    /**
     * Bascule entre les thèmes
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Écouter les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * Obtient le thème actuel
     * @returns {string} - Thème actuel
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Instance globale
window.themeManager = new ThemeManager();
