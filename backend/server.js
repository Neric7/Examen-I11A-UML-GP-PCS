const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de logging des requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware CORS avec configuration étendue
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Dossier uploads créé');
}

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(uploadsDir));

// Route racine avec informations complètes
app.get('/', (req, res) => {
    res.json({
        message: 'API Facebook Mini App - Backend Running!',
        version: '1.0.0',
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            root: '/',
            test: '/test',
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            posts: '/api/posts',
            friends: '/api/friends' // Ajouté
        },
        server: {
            port: PORT,
            cors_origin: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
    });
});

// Route de santé du serveur
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// Fonction utilitaire pour charger les routes de manière sécurisée AVEC DEBUG
const loadRoute = (path, name) => {
    try {
        const routePath = `./src/routes/${path}`;
        const fullPath = `${routePath}.js`;
        
        console.log(`🔍 =================================`);
        console.log(`🔍 Tentative de chargement: ${name}`);
        console.log(`🔍 Chemin relatif: ${routePath}`);
        console.log(`🔍 Chemin complet: ${fullPath}`);
        console.log(`🔍 Répertoire actuel: ${__dirname}`);
        console.log(`🔍 Chemin absolu: ${require('path').resolve(__dirname, fullPath)}`);
        
        // Vérifier si le fichier existe
        const absolutePath = require('path').resolve(__dirname, fullPath);
        const fileExists = fs.existsSync(absolutePath);
        console.log(`🔍 Fichier existe: ${fileExists}`);
        
        if (fileExists) {
            console.log(`🔍 Tentative de require...`);
            const route = require(routePath);
            console.log(`🔍 Require réussi, type: ${typeof route}`);
            
            // Mapper friendships vers friends pour l'URL
            const urlPath = path === 'friendships' ? 'friends' : path;
            app.use(`/api/${urlPath}`, route);
            console.log(`✅ Route ${name} chargée avec succès (/api/${urlPath})`);
            console.log(`🔍 =================================\n`);
            return true;
        } else {
            console.log(`❌ Fichier non trouvé: ${absolutePath}`);
            
            // Lister les fichiers dans le dossier routes
            const routesDir = require('path').resolve(__dirname, './src/routes');
            console.log(`🔍 Contenu du dossier routes (${routesDir}):`);
            
            if (fs.existsSync(routesDir)) {
                const files = fs.readdirSync(routesDir);
                files.forEach(file => {
                    console.log(`   📄 ${file}`);
                });
            } else {
                console.log(`❌ Le dossier routes n'existe pas: ${routesDir}`);
            }
            
            console.log(`🔍 =================================\n`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ERREUR lors du chargement de la route ${name}:`);
        console.log(`❌ Message: ${error.message}`);
        console.log(`❌ Code: ${error.code}`);
        console.log(`❌ Stack trace:`);
        console.log(error.stack);
        console.log(`🔍 =================================\n`);
        return false;
    }
};

const routes = [
    { path: 'auth', name: 'Auth' },
    { path: 'users', name: 'Users' },
    { path: 'posts', name: 'Posts' },
    { path: 'friendships', name: 'Friendships' },
    { path: 'comments', name: 'Comments' }, // Ajout de la route des commentaires
    { path: 'notifications', name: 'Notifications' }
];

const loadedRoutes = [];
const failedRoutes = [];

console.log(`\n🚀 DÉBUT DU CHARGEMENT DES ROUTES`);
console.log(`🚀 ===================================`);

// SUPPRESSION DE LA DUPLICATION - Une seule boucle
routes.forEach(route => {
    if (loadRoute(route.path, route.name)) {
        loadedRoutes.push(route.path);
    } else {
        failedRoutes.push(route.path);
    }
});

console.log(`🚀 FIN DU CHARGEMENT DES ROUTES`);
console.log(`🚀 ===================================\n`);

// Route de test simple
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Backend fonctionne correctement!',
        timestamp: new Date().toISOString(),
        routes: {
            loaded: loadedRoutes,
            failed: failedRoutes
        }
    });
});

// Route pour lister les routes disponibles
app.get('/api', (req, res) => {
    res.json({
        message: 'API Endpoints',
        available_routes: loadedRoutes.map(route => {
            // Mapper friendships vers friends pour l'URL
            const routeName = route === 'friendships' ? 'friends' : route;
            return `/api/${routeName}`;
        }),
        unavailable_routes: failedRoutes.map(route => {
            const routeName = route === 'friendships' ? 'friends' : route;
            return `/api/${routeName}`;
        }),
        documentation: {
            auth: 'Authentification et gestion des sessions',
            users: 'Gestion des utilisateurs',
            posts: 'Gestion des publications',
            friends: 'Gestion des amitiés et demandes d\'amis'
        }
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    res.status(err.status || 500).json({
        message: 'Erreur serveur interne',
        error: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            stack: err.stack
        } : 'Something went wrong!',
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// Route 404 pour les API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        message: 'Endpoint API non trouvé',
        path: req.originalUrl,
        available_endpoints: loadedRoutes.map(route => {
            const routeName = route === 'friendships' ? 'friends' : route;
            return `/api/${routeName}`;
        }),
        timestamp: new Date().toISOString()
    });
});

// Route 404 générale
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.originalUrl,
        suggestion: 'Consultez / pour voir les endpoints disponibles',
        timestamp: new Date().toISOString()
    });
});

// Fonction de démarrage du serveur
const startServer = () => {
    const server = app.listen(PORT, () => {
        console.log('\n🚀 ================================');
        console.log(`   SERVEUR DÉMARRÉ AVEC SUCCÈS`);
        console.log('🚀 ================================');
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📅 Démarré le: ${new Date().toLocaleString()}`);
        console.log(`✅ Routes chargées: ${loadedRoutes.join(', ') || 'Aucune'}`);
        console.log(`⚠️  Routes manquantes: ${failedRoutes.join(', ') || 'Aucune'}`);
        console.log('🚀 ================================\n');
    });

    // Gestion de l'arrêt propre du serveur
    process.on('SIGTERM', () => {
        console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
        server.close(() => {
            console.log('✅ Serveur arrêté proprement');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\n🛑 Signal SIGINT reçu, arrêt du serveur...');
        server.close(() => {
            console.log('✅ Serveur arrêté proprement');
            process.exit(0);
        });
    });
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', {
        reason: reason,
        promise: promise,
        timestamp: new Date().toISOString()
    });
    
    // Ne pas fermer le serveur immédiatement en production
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('❌ Exception non capturée:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
    
    // Fermer le serveur proprement
    process.exit(1);
});

// Démarrer le serveur
startServer();

// Exporter l'app pour les tests
module.exports = app;