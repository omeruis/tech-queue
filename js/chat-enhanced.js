/**
 * Gestionnaire de chat amélioré avec markdown, code highlighting, et typing indicator
 */
class EnhancedChatManager {
    constructor() {
        this.typingTimeouts = {};
        this.typingIndicators = {};
        this.fileShares = [];
    }

    /**
     * Initialise le chat amélioré
     * @param {string} chatMessagesId - ID du conteneur de messages
     * @param {string} messageInputId - ID de l'input de message
     * @param {string} sendButtonId - ID du bouton d'envoi
     */
    init(chatMessagesId, messageInputId, sendButtonId) {
        this.chatMessagesEl = document.getElementById(chatMessagesId);
        this.messageInputEl = document.getElementById(messageInputId);
        this.sendButtonEl = document.getElementById(sendButtonId);

        if (this.messageInputEl) {
            this.setupTypingIndicator();
            this.setupFileUpload();
        }
    }

    /**
     * Configure l'indicateur de saisie
     */
    setupTypingIndicator() {
        this.messageInputEl.addEventListener('input', () => {
            this.sendTypingIndicator();
        });
    }

    /**
     * Configure l'upload de fichiers
     */
    setupFileUpload() {
        // Ajouter un bouton de partage de fichier
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.multiple = true;
        fileInput.id = 'chat-file-input';

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        if (this.messageInputEl.parentNode) {
            this.messageInputEl.parentNode.insertBefore(fileInput, this.messageInputEl);
        }
    }

    /**
     * Envoie un indicateur de saisie
     */
    sendTypingIndicator() {
        const now = Date.now();
        const peerId = this.getCurrentPeerId();

        if (!peerId) return;

        // Envoyer l'indicateur seulement toutes les 2 secondes
        if (this.lastTypingSent && now - this.lastTypingSent < 2000) {
            return;
        }

        this.lastTypingSent = now;

        if (window.peerService) {
            window.peerService.sendData(peerId, {
                type: 'typing',
                userId: this.getCurrentUserId(),
                userName: this.getCurrentUserName()
            }).catch(err => console.error('Erreur envoi typing indicator:', err));
        }
    }

    /**
     * Affiche l'indicateur de saisie pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} userName - Nom de l'utilisateur
     */
    showTypingIndicator(userId, userName) {
        if (!this.chatMessagesEl) return;

        // Supprimer l'ancien indicateur s'il existe
        this.hideTypingIndicator(userId);

        // Créer le nouvel indicateur
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = `typing-${userId}`;
        indicator.innerHTML = `
            <span class="typing-user">${userName}</span> est en train d'écrire
            <span class="typing-dots">
                <span>.</span><span>.</span><span>.</span>
            </span>
        `;

        this.chatMessagesEl.appendChild(indicator);
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;

        // Cacher après 3 secondes
        clearTimeout(this.typingTimeouts[userId]);
        this.typingTimeouts[userId] = setTimeout(() => {
            this.hideTypingIndicator(userId);
        }, 3000);
    }

    /**
     * Cache l'indicateur de saisie
     * @param {string} userId - ID de l'utilisateur
     */
    hideTypingIndicator(userId) {
        const indicator = document.getElementById(`typing-${userId}`);
        if (indicator) {
            indicator.remove();
        }
        clearTimeout(this.typingTimeouts[userId]);
    }

    /**
     * Formate un message avec markdown
     * @param {string} text - Texte brut
     * @returns {string} - HTML formaté
     */
    formatMarkdown(text) {
        if (!text) return '';

        let formatted = text;

        // Code blocks avec coloration syntaxique
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Gras
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italique
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Liens
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Listes
        formatted = formatted.replace(/^\* (.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Retours à la ligne
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    /**
     * Échappe les caractères HTML
     * @param {string} text - Texte
     * @returns {string} - Texte échappé
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Applique la coloration syntaxique au code
     * @param {HTMLElement} element - Élément contenant le code
     */
    highlightCode(element) {
        const codeBlocks = element.querySelectorAll('code[class^="language-"]');
        codeBlocks.forEach(block => {
            this.highlightBlock(block);
        });
    }

    /**
     * Colore un bloc de code (simple highlighting)
     * @param {HTMLElement} block - Bloc de code
     */
    highlightBlock(block) {
        const lang = block.className.replace('language-', '');
        let code = block.textContent;

        // Coloration basique pour JavaScript/TypeScript
        if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
            code = this.highlightJavaScript(code);
        }
        // Coloration basique pour HTML
        else if (lang === 'html') {
            code = this.highlightHTML(code);
        }
        // Coloration basique pour CSS
        else if (lang === 'css') {
            code = this.highlightCSS(code);
        }

        block.innerHTML = code;
    }

    /**
     * Coloration JavaScript simple
     * @param {string} code - Code
     * @returns {string} - Code coloré
     */
    highlightJavaScript(code) {
        const keywords = ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new'];

        let highlighted = code;

        // Mots-clés
        keywords.forEach(keyword => {
            highlighted = highlighted.replace(
                new RegExp(`\\b(${keyword})\\b`, 'g'),
                '<span class="keyword">$1</span>'
            );
        });

        // Strings
        highlighted = highlighted.replace(
            /(['"`])(.*?)\1/g,
            '<span class="string">$1$2$1</span>'
        );

        // Commentaires
        highlighted = highlighted.replace(
            /(\/\/.*$)/gm,
            '<span class="comment">$1</span>'
        );

        // Nombres
        highlighted = highlighted.replace(
            /\b(\d+)\b/g,
            '<span class="number">$1</span>'
        );

        return highlighted;
    }

    /**
     * Coloration HTML simple
     * @param {string} code - Code
     * @returns {string} - Code coloré
     */
    highlightHTML(code) {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tag">$2</span>')
            .replace(/([\w-]+)=/g, '<span class="attr">$1</span>=')
            .replace(/="([^"]*)"/g, '="<span class="string">$1</span>"');
    }

    /**
     * Coloration CSS simple
     * @param {string} code - Code
     * @returns {string} - Code coloré
     */
    highlightCSS(code) {
        return code
            .replace(/([\w-]+)\s*{/g, '<span class="selector">$1</span> {')
            .replace(/([\w-]+):/g, '<span class="property">$1</span>:')
            .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;');
    }

    /**
     * Crée un élément de message amélioré
     * @param {Object} message - Message
     * @param {boolean} isSent - Message envoyé (vs reçu)
     * @returns {HTMLElement} - Élément message
     */
    createMessageElement(message, isSent) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
        messageEl.dataset.messageId = message.id;

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMarkdown(message.content);

        const meta = document.createElement('div');
        meta.className = 'message-meta';
        meta.innerHTML = `
            <span class="message-sender">${message.senderName}</span>
            <span class="message-time">${Utils.formatDate(message.timestamp)}</span>
        `;

        messageEl.appendChild(meta);
        messageEl.appendChild(content);

        // Appliquer la coloration syntaxique
        this.highlightCode(messageEl);

        // Ajouter les fichiers partagés s'il y en a
        if (message.files && message.files.length > 0) {
            const filesContainer = this.createFilesContainer(message.files);
            messageEl.appendChild(filesContainer);
        }

        return messageEl;
    }

    /**
     * Gère la sélection de fichiers
     * @param {FileList} files - Fichiers sélectionnés
     */
    async handleFileSelect(files) {
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                alert(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
                continue;
            }

            try {
                const base64 = await Utils.fileToBase64(file);
                this.fileShares.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64
                });
            } catch (error) {
                console.error('Erreur lors de la lecture du fichier:', error);
            }
        }

        this.updateFilePreview();
    }

    /**
     * Met à jour l'aperçu des fichiers à envoyer
     */
    updateFilePreview() {
        let preview = document.getElementById('file-preview');

        if (!preview && this.fileShares.length > 0) {
            preview = document.createElement('div');
            preview.id = 'file-preview';
            preview.className = 'file-preview';
            this.messageInputEl.parentNode.insertBefore(preview, this.messageInputEl);
        }

        if (preview) {
            if (this.fileShares.length === 0) {
                preview.remove();
                return;
            }

            preview.innerHTML = this.fileShares.map((file, index) => `
                <div class="file-preview-item">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${this.formatFileSize(file.size)})</span>
                    <button class="file-remove" data-index="${index}">&times;</button>
                </div>
            `).join('');

            preview.querySelectorAll('.file-remove').forEach(btn => {
                btn.onclick = () => {
                    const index = parseInt(btn.dataset.index);
                    this.fileShares.splice(index, 1);
                    this.updateFilePreview();
                };
            });
        }
    }

    /**
     * Crée un conteneur pour les fichiers partagés
     * @param {Array} files - Fichiers
     * @returns {HTMLElement} - Conteneur
     */
    createFilesContainer(files) {
        const container = document.createElement('div');
        container.className = 'shared-files';

        files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'shared-file';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.data;
                img.alt = file.name;
                img.onclick = () => window.open(file.data, '_blank');
                fileEl.appendChild(img);
            } else {
                fileEl.innerHTML = `
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                    <a href="${file.data}" download="${file.name}" class="file-download">Télécharger</a>
                `;
            }

            container.appendChild(fileEl);
        });

        return container;
    }

    /**
     * Formate la taille d'un fichier
     * @param {number} bytes - Taille en octets
     * @returns {string} - Taille formatée
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Obtient l'ID du peer actuel
     * @returns {string} - Peer ID
     */
    getCurrentPeerId() {
        // À implémenter selon le contexte
        return window.currentPeerId || null;
    }

    /**
     * Obtient l'ID de l'utilisateur actuel
     * @returns {string} - User ID
     */
    getCurrentUserId() {
        return localStorage.getItem('developerId') || localStorage.getItem('techleadId') || 'anonymous';
    }

    /**
     * Obtient le nom de l'utilisateur actuel
     * @returns {string} - Nom
     */
    getCurrentUserName() {
        return localStorage.getItem('developerName') || localStorage.getItem('techleadId') || 'Anonyme';
    }

    /**
     * Obtient les fichiers à envoyer
     * @returns {Array} - Fichiers
     */
    getFilesToSend() {
        const files = [...this.fileShares];
        this.fileShares = [];
        this.updateFilePreview();
        return files;
    }
}

// Instance globale
window.enhancedChatManager = new EnhancedChatManager();
