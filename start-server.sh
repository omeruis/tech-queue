#!/bin/bash

# Script de démarrage du serveur TechQueue
# Ce script démarre un serveur HTTP local sur le port 3000

echo "🚀 Démarrage du serveur TechQueue..."
echo ""

# Vérifier si le port 3000 est déjà utilisé
if lsof -i:3000 >/dev/null 2>&1; then
    echo "⚠️  Le port 3000 est déjà utilisé."
    echo "Voulez-vous arrêter le serveur existant ? (o/n)"
    read -r response
    if [[ "$response" =~ ^[Oo]$ ]]; then
        lsof -ti:3000 | xargs kill -9
        echo "✓ Serveur arrêté"
    else
        echo "❌ Abandon"
        exit 1
    fi
fi

# Démarrer le serveur (essayer différentes méthodes)
echo "Recherche d'un serveur HTTP disponible..."
echo ""

if command -v python3 &> /dev/null; then
    echo "✓ Utilisation de Python 3"
    echo "📡 Serveur démarré sur http://localhost:3000"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo "----------------------------------------"
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    echo "✓ Utilisation de Python 2"
    echo "📡 Serveur démarré sur http://localhost:3000"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo "----------------------------------------"
    python -m SimpleHTTPServer 3000
elif command -v php &> /dev/null; then
    echo "✓ Utilisation de PHP"
    echo "📡 Serveur démarré sur http://localhost:3000"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo "----------------------------------------"
    php -S localhost:3000
elif command -v npx &> /dev/null; then
    echo "✓ Utilisation de Node.js (npx serve)"
    echo "📡 Serveur démarré sur http://localhost:3000"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo "----------------------------------------"
    npx serve -p 3000
else
    echo "❌ Aucun serveur HTTP trouvé!"
    echo ""
    echo "Veuillez installer l'un des outils suivants :"
    echo "  - Python: apt-get install python3"
    echo "  - PHP: apt-get install php"
    echo "  - Node.js: apt-get install nodejs npm"
    exit 1
fi
