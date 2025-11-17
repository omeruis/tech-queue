/**
 * Gestionnaire d'installation PWA
 */
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = this.checkIfInstalled();
        this.init();
    }

    /**
     * Initialise le gestionnaire PWA
     */
    init() {
        // Enregistrer le service worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Écouter l'événement beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Écouter l'installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installée avec succès');
            this.isInstalled = true;
            this.hideInstallButton();

            if (window.notificationManager) {
                window.notificationManager.show('success', '✨ Application installée avec succès!');
            }
        });

        // Vérifier les mises à jour
        this.checkForUpdates();
    }

    /**
     * Enregistre le service worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');

            console.log('Service Worker enregistré:', registration.scope);

            // Vérifier les mises à jour toutes les heures
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

            // Gérer les mises à jour du service worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            return registration;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
            return null;
        }
    }

    /**
     * Vérifie si l'app est installée
     * @returns {boolean} - Installée ou non
     */
    checkIfInstalled() {
        // Vérifier si l'app est en mode standalone
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }

        // Vérifier si l'app est lancée depuis l'écran d'accueil
        if (window.navigator.standalone === true) {
            return true;
        }

        return false;
    }

    /**
     * Affiche le bouton d'installation
     */
    showInstallButton() {
        let installBtn = document.getElementById('pwa-install-btn');

        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-button';
            installBtn.innerHTML = '📱 Installer l\'application';
            installBtn.onclick = () => this.install();

            // Ajouter au DOM
            document.body.appendChild(installBtn);
        }

        installBtn.style.display = 'block';
    }

    /**
     * Cache le bouton d'installation
     */
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    /**
     * Lance l'installation de la PWA
     */
    async install() {
        if (!this.deferredPrompt) {
            console.log('Pas de prompt d\'installation disponible');
            return;
        }

        // Afficher le prompt d'installation
        this.deferredPrompt.prompt();

        // Attendre la réponse de l'utilisateur
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`Résultat de l'installation: ${outcome}`);

        if (outcome === 'accepted') {
            console.log('L\'utilisateur a accepté l\'installation');
        } else {
            console.log('L\'utilisateur a refusé l\'installation');
        }

        // Réinitialiser le prompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    /**
     * Vérifie les mises à jour de l'application
     */
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();

            if (registration) {
                registration.update();
            }
        }
    }

    /**
     * Affiche une notification de mise à jour
     */
    showUpdateNotification() {
        const updateBar = document.createElement('div');
        updateBar.id = 'pwa-update-bar';
        updateBar.className = 'pwa-update-notification';
        updateBar.innerHTML = `
            <div class="update-message">
                ✨ Une nouvelle version est disponible!
            </div>
            <button id="pwa-update-btn" class="update-button">Mettre à jour</button>
            <button id="pwa-update-close" class="update-close">&times;</button>
        `;

        document.body.appendChild(updateBar);

        // Bouton de mise à jour
        document.getElementById('pwa-update-btn').onclick = () => {
            this.applyUpdate();
        };

        // Bouton de fermeture
        document.getElementById('pwa-update-close').onclick = () => {
            updateBar.remove();
        };
    }

    /**
     * Applique la mise à jour
     */
    async applyUpdate() {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration && registration.waiting) {
            // Demander au service worker en attente de prendre le contrôle
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });

            // Recharger la page une fois que le nouveau SW est actif
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }

    /**
     * Active le mode hors ligne
     */
    enableOfflineMode() {
        window.addEventListener('online', () => {
            this.updateOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.updateOnlineStatus(false);
        });

        // Vérifier l'état initial
        this.updateOnlineStatus(navigator.onLine);
    }

    /**
     * Met à jour l'indicateur de statut en ligne
     * @param {boolean} isOnline - En ligne ou non
     */
    updateOnlineStatus(isOnline) {
        let statusBar = document.getElementById('online-status-bar');

        if (!isOnline) {
            if (!statusBar) {
                statusBar = document.createElement('div');
                statusBar.id = 'online-status-bar';
                statusBar.className = 'offline-status-bar';
                statusBar.innerHTML = '📡 Mode hors ligne - Les modifications seront synchronisées quand vous serez en ligne';
                document.body.insertBefore(statusBar, document.body.firstChild);
            }
        } else {
            if (statusBar) {
                statusBar.textContent = '✅ De nouveau en ligne - Synchronisation...';
                statusBar.className = 'online-status-bar';

                setTimeout(() => {
                    statusBar.remove();
                }, 3000);

                // Synchroniser les données
                this.syncOfflineData();
            }
        }
    }

    /**
     * Synchronise les données hors ligne
     */
    async syncOfflineData() {
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-data');
                console.log('Synchronisation programmée');
            } catch (error) {
                console.error('Erreur lors de la programmation de la synchronisation:', error);
            }
        }
    }

    /**
     * Obtient les capacités de l'installation
     * @returns {Object} - Capacités
     */
    getCapabilities() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            pushNotifications: 'Notification' in window && 'PushManager' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype,
            periodicSync: 'serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype,
            installable: this.deferredPrompt !== null,
            installed: this.isInstalled
        };
    }
}

// Instance globale et initialisation automatique
window.pwaInstaller = new PWAInstaller();
window.pwaInstaller.enableOfflineMode();
