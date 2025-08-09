// ============================================
// src/config/database.js
// ============================================
const mysql = require('mysql2');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facebook_mini_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Promisifier le pool pour utiliser async/await
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connexion à la base de données réussie');
        connection.release();
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        process.exit(1);
    }
};

// Tester la connexion au démarrage
testConnection();

module.exports = promisePool;