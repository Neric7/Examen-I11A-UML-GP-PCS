const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database'); // Connexion MySQL directe comme pour posts

console.log('📍 Module friendships.js chargé avec succès!');

// Route de test pour vérifier que le module friends fonctionne
router.get('/test', (req, res) => {
    res.json({
        message: 'Module friendships fonctionne correctement!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/friends/requests - Récupérer les demandes d\'amis',
            'GET /api/friends/suggestions - Récupérer les suggestions d\'amis',
            'GET /api/friends/list - Récupérer la liste des amis',
            'POST /api/friends/request - Envoyer une demande d\'ami',
            'POST /api/friends/accept/:id - Accepter une demande d\'ami',
            'POST /api/friends/decline/:id - Refuser une demande d\'ami',
            'DELETE /api/friends/:id - Supprimer un ami'
        ]
    });
});

// Route de test temporaire pour créer une amitié sans auth (SUPPRIMER EN PRODUCTION)
router.post('/test-create', async (req, res) => {
    try {
        console.log('=== TEST CRÉATION AMITIÉ SANS AUTH ===');
        const { user1_id, user2_id, status = 'pending' } = req.body;
        
        if (!user1_id || !user2_id) {
            // Utiliser les premiers utilisateurs de la base pour test
            const [users] = await db.query('SELECT id, username FROM users LIMIT 2');
            
            if (users.length < 2) {
                return res.status(400).json({ 
                    message: 'Il faut au moins 2 utilisateurs en base pour test' 
                });
            }
            
            const testUser1 = users[0];
            const testUser2 = users[1];
            
            const [result] = await db.query(
                'INSERT INTO friendships (user1_id, user2_id, status) VALUES (?, ?, ?)',
                [testUser1.id, testUser2.id, status]
            );
            
            console.log('Amitié de test créée avec ID:', result.insertId);
            
            return res.json({
                message: 'Amitié de test créée!',
                friendshipId: result.insertId,
                user1: testUser1,
                user2: testUser2,
                status: status
            });
        }
        
        // Vérifier que les utilisateurs existent
        const [user1] = await db.query('SELECT id, username FROM users WHERE id = ?', [user1_id]);
        const [user2] = await db.query('SELECT id, username FROM users WHERE id = ?', [user2_id]);
        
        if (user1.length === 0 || user2.length === 0) {
            return res.status(404).json({ message: 'Un ou plusieurs utilisateurs non trouvés' });
        }
        
        const [result] = await db.query(
            'INSERT INTO friendships (user1_id, user2_id, status) VALUES (?, ?, ?)',
            [user1_id, user2_id, status]
        );
        
        res.json({
            message: 'Amitié de test créée!',
            friendshipId: result.insertId,
            user1: user1[0],
            user2: user2[0],
            status: status
        });
        
    } catch (error) {
        console.error('Erreur test amitié:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer les demandes d'amis reçues
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        console.log('=== RÉCUPÉRATION DEMANDES D\'AMIS ===');
        console.log('User ID:', req.user.userId);

        const userId = req.user.userId;

        // Récupérer les demandes d'amis reçues avec les informations de l'expéditeur
        const [requests] = await db.query(`
            SELECT 
                f.id,
                f.user1_id as requester_id,
                f.user2_id,
                f.status,
                f.request_date,
                u.id as 'requester.id',
                u.username as 'requester.username',
                u.email as 'requester.email',
                u.profile_picture as 'requester.profile_picture'
            FROM friendships f
            JOIN users u ON f.user1_id = u.id
            WHERE f.user2_id = ? AND f.status = 'pending'
            ORDER BY f.request_date DESC
        `, [userId]);
        
        console.log(`${requests.length} demandes d'amis trouvées`);

        // Ajouter le nombre d'amis en commun pour chaque demande
        const requestsWithMutual = await Promise.all(requests.map(async request => {
            const mutualFriends = await getMutualFriendsCount(userId, request.requester_id);
            return {
                id: request.id,
                user1_id: request.requester_id,
                user2_id: request.user2_id,
                status: request.status,
                request_date: request.request_date,
                requester: {
                    id: request['requester.id'],
                    username: request['requester.username'],
                    email: request['requester.email'],
                    profile_picture: request['requester.profile_picture']
                },
                mutual_friends: mutualFriends
            };
        }));
        
        console.log('=== FIN RÉCUPÉRATION DEMANDES D\'AMIS ===');
        res.json(requestsWithMutual);

    } catch (err) {
        console.error('Erreur récupération demandes d\'amis:', {
            message: err.message,
            stack: err.stack,
            user: req.user
        });

        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération des demandes d\'amis',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Récupérer la liste des amis
router.get('/list', authMiddleware, async (req, res) => {
    try {
        console.log('=== RÉCUPÉRATION LISTE AMIS ===');
        console.log('User ID:', req.user.userId);

        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Récupérer les amis acceptés (dans les deux sens)
        const [friends] = await db.query(`
            SELECT 
                f.id,
                f.accepted_date,
                CASE 
                    WHEN f.user1_id = ? THEN f.user2_id 
                    ELSE f.user1_id 
                END as friend_id,
                u.id as 'friend.id',
                u.username as 'friend.username',
                u.email as 'friend.email',
                u.profile_picture as 'friend.profile_picture',
                u.last_login as 'friend.last_login'
            FROM friendships f
            JOIN users u ON (
                (f.user1_id = ? AND u.id = f.user2_id) OR 
                (f.user2_id = ? AND u.id = f.user1_id)
            )
            WHERE (f.user1_id = ? OR f.user2_id = ?) 
            AND f.status = 'accepted'
            ORDER BY f.accepted_date DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, userId, userId, userId, limit, offset]);
        
        console.log(`${friends.length} amis trouvés`);

        // Formatter la réponse
        const formattedFriends = friends.map(friend => ({
            friendship_id: friend.id,
            accepted_date: friend.accepted_date,
            friend: {
                id: friend['friend.id'],
                username: friend['friend.username'],
                email: friend['friend.email'],
                profile_picture: friend['friend.profile_picture'],
                last_login: friend['friend.last_login']
            }
        }));
        
        console.log('=== FIN RÉCUPÉRATION LISTE AMIS ===');
        res.json(formattedFriends);

    } catch (err) {
        console.error('Erreur récupération liste amis:', {
            message: err.message,
            stack: err.stack,
            user: req.user
        });

        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération de la liste d\'amis',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Suggestions d'amis
router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        console.log('=== RÉCUPÉRATION SUGGESTIONS D\'AMIS ===');
        console.log('User ID:', req.user.userId);

        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 5;

        // Récupérer les utilisateurs qui ne sont pas déjà amis et qui ne sont pas l'utilisateur actuel
        const [suggestions] = await db.query(`
            SELECT DISTINCT
                u.id,
                u.username,
                u.email,
                u.profile_picture,
                u.created_at
            FROM users u
            WHERE u.id != ?
            AND u.is_active = TRUE
            AND u.id NOT IN (
                SELECT CASE 
                    WHEN f.user1_id = ? THEN f.user2_id 
                    ELSE f.user1_id 
                END
                FROM friendships f
                WHERE (f.user1_id = ? OR f.user2_id = ?) 
                AND f.status IN ('pending', 'accepted')
            )
            ORDER BY RAND()
            LIMIT ?
        `, [userId, userId, userId, userId, limit]);
        
        console.log(`${suggestions.length} suggestions trouvées`);

        // Ajouter le nombre d'amis en commun pour chaque suggestion
        const suggestionsWithMutual = await Promise.all(suggestions.map(async user => {
            const mutualFriends = await getMutualFriendsCount(userId, user.id);
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                created_at: user.created_at,
                mutual_friends: mutualFriends
            };
        }));
        
        console.log('=== FIN RÉCUPÉRATION SUGGESTIONS D\'AMIS ===');
        res.json(suggestionsWithMutual);

    } catch (err) {
        console.error('Erreur récupération suggestions d\'amis:', {
            message: err.message,
            stack: err.stack,
            user: req.user
        });

        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération des suggestions d\'amis',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Envoyer une demande d'ami
router.post('/request', authMiddleware, async (req, res) => {
    try {
        console.log('=== ENVOI DEMANDE D\'AMI ===');
        const { userId: targetUserId } = req.body;
        const currentUserId = req.user.userId;

        console.log('De:', currentUserId, 'Vers:', targetUserId);

        // Vérifications
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utilisateur cible requis' });
        }

        if (currentUserId === parseInt(targetUserId)) {
            return res.status(400).json({ 
                message: 'Vous ne pouvez pas vous envoyer une demande d\'ami à vous-même' 
            });
        }

        // Vérifier si l'utilisateur cible existe
        const [targetUsers] = await db.query(
            'SELECT id, username, email FROM users WHERE id = ? AND is_active = TRUE',
            [targetUserId]
        );

        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const targetUser = targetUsers[0];

        // Vérifier s'il existe déjà une relation (dans les deux sens)
        const [existingFriendships] = await db.query(`
            SELECT id, status, user1_id, user2_id 
            FROM friendships 
            WHERE (
                (user1_id = ? AND user2_id = ?) OR 
                (user1_id = ? AND user2_id = ?)
            )
        `, [currentUserId, targetUserId, targetUserId, currentUserId]);

        if (existingFriendships.length > 0) {
            const existing = existingFriendships[0];
            let message = 'Une relation existe déjà';
            
            if (existing.status === 'pending') {
                message = 'Une demande d\'ami est déjà en attente';
            } else if (existing.status === 'accepted') {
                message = 'Vous êtes déjà amis';
            } else if (existing.status === 'declined') {
                message = 'Cette demande d\'ami a été refusée précédemment';
            }
            
            return res.status(400).json({ message });
        }

        // Créer la demande d'ami
        const [result] = await db.query(
            'INSERT INTO friendships (user1_id, user2_id, status, request_date) VALUES (?, ?, ?, NOW())',
            [currentUserId, targetUserId, 'pending']
        );

        const friendshipId = result.insertId;

        // Récupérer la demande créée avec les informations de l'utilisateur cible
        const [newFriendship] = await db.query(`
            SELECT 
                f.id,
                f.user1_id,
                f.user2_id,
                f.status,
                f.request_date,
                u.id as 'target.id',
                u.username as 'target.username',
                u.email as 'target.email',
                u.profile_picture as 'target.profile_picture'
            FROM friendships f
            JOIN users u ON f.user2_id = u.id
            WHERE f.id = ?
        `, [friendshipId]);

        const friendship = newFriendship[0];

        const formattedFriendship = {
            id: friendship.id,
            user1_id: friendship.user1_id,
            user2_id: friendship.user2_id,
            status: friendship.status,
            request_date: friendship.request_date,
            target_user: {
                id: friendship['target.id'],
                username: friendship['target.username'],
                email: friendship['target.email'],
                profile_picture: friendship['target.profile_picture']
            }
        };

        console.log('Demande d\'ami créée:', formattedFriendship);
        console.log('=== FIN ENVOI DEMANDE D\'AMI ===');

        res.status(201).json({
            message: 'Demande d\'ami envoyée avec succès',
            friendship: formattedFriendship
        });

    } catch (err) {
        console.error('Erreur envoi demande d\'ami:', err);
        res.status(500).json({ 
            message: 'Erreur serveur lors de l\'envoi de la demande d\'ami',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Accepter une demande d'ami
router.post('/accept/:id', authMiddleware, async (req, res) => {
    try {
        console.log('=== ACCEPTER DEMANDE D\'AMI ===');
        const friendshipId = req.params.id;
        const userId = req.user.userId;

        console.log('Friendship ID:', friendshipId, 'User ID:', userId);

        // Vérifier que la demande existe et est adressée à l'utilisateur actuel
        const [friendships] = await db.query(`
            SELECT 
                f.id,
                f.user1_id,
                f.user2_id,
                f.status,
                u.username as requester_username
            FROM friendships f
            JOIN users u ON f.user1_id = u.id
            WHERE f.id = ? AND f.user2_id = ? AND f.status = 'pending'
        `, [friendshipId, userId]);

        if (friendships.length === 0) {
            return res.status(404).json({ 
                message: 'Demande d\'ami non trouvée ou déjà traitée' 
            });
        }

        const friendship = friendships[0];

        // Mettre à jour le statut et la date d'acceptation
        await db.query(
            'UPDATE friendships SET status = ?, accepted_date = NOW() WHERE id = ?',
            ['accepted', friendshipId]
        );

        // Récupérer la demande mise à jour
        const [updatedFriendship] = await db.query(`
            SELECT 
                f.id,
                f.user1_id,
                f.user2_id,
                f.status,
                f.request_date,
                f.accepted_date,
                u.id as 'requester.id',
                u.username as 'requester.username',
                u.email as 'requester.email',
                u.profile_picture as 'requester.profile_picture'
            FROM friendships f
            JOIN users u ON f.user1_id = u.id
            WHERE f.id = ?
        `, [friendshipId]);

        const updated = updatedFriendship[0];

        const formattedFriendship = {
            id: updated.id,
            user1_id: updated.user1_id,
            user2_id: updated.user2_id,
            status: updated.status,
            request_date: updated.request_date,
            accepted_date: updated.accepted_date,
            requester: {
                id: updated['requester.id'],
                username: updated['requester.username'],
                email: updated['requester.email'],
                profile_picture: updated['requester.profile_picture']
            }
        };

        console.log('Demande d\'ami acceptée');
        console.log('=== FIN ACCEPTER DEMANDE D\'AMI ===');

        res.json({
            message: 'Demande d\'ami acceptée avec succès',
            friendship: formattedFriendship
        });

    } catch (err) {
        console.error('Erreur acceptation demande d\'ami:', err);
        res.status(500).json({ 
            message: 'Erreur serveur lors de l\'acceptation de la demande d\'ami',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Refuser une demande d'ami
router.post('/decline/:id', authMiddleware, async (req, res) => {
    try {
        console.log('=== REFUSER DEMANDE D\'AMI ===');
        const friendshipId = req.params.id;
        const userId = req.user.userId;

        // Vérifier que la demande existe et est adressée à l'utilisateur actuel
        const [friendships] = await db.query(
            'SELECT id, user1_id, user2_id, status FROM friendships WHERE id = ? AND user2_id = ? AND status = ?',
            [friendshipId, userId, 'pending']
        );

        if (friendships.length === 0) {
            return res.status(404).json({ 
                message: 'Demande d\'ami non trouvée ou déjà traitée' 
            });
        }

        // Option 1: Supprimer complètement la demande (comme dans votre code original)
        await db.query('DELETE FROM friendships WHERE id = ?', [friendshipId]);

        // Option 2: Ou marquer comme 'declined' si vous voulez garder un historique
        // await db.query('UPDATE friendships SET status = ? WHERE id = ?', ['declined', friendshipId]);

        console.log('Demande d\'ami refusée et supprimée');
        console.log('=== FIN REFUSER DEMANDE D\'AMI ===');

        res.json({
            message: 'Demande d\'ami refusée avec succès'
        });

    } catch (err) {
        console.error('Erreur refus demande d\'ami:', err);
        res.status(500).json({ 
            message: 'Erreur serveur lors du refus de la demande d\'ami',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Supprimer un ami
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('=== SUPPRIMER AMI ===');
        const friendUserId = req.params.id;
        const userId = req.user.userId;

        console.log('Suppression amitié entre:', userId, 'et', friendUserId);

        // Vérifier que l'amitié existe (dans les deux sens possibles)
        const [friendships] = await db.query(`
            SELECT id, user1_id, user2_id 
            FROM friendships 
            WHERE (
                (user1_id = ? AND user2_id = ?) OR 
                (user1_id = ? AND user2_id = ?)
            ) AND status = 'accepted'
        `, [userId, friendUserId, friendUserId, userId]);

        if (friendships.length === 0) {
            return res.status(404).json({ message: 'Amitié non trouvée' });
        }

        const friendship = friendships[0];

        // Supprimer l'amitié
        await db.query('DELETE FROM friendships WHERE id = ?', [friendship.id]);

        console.log('Amitié supprimée avec ID:', friendship.id);
        console.log('=== FIN SUPPRIMER AMI ===');

        res.json({
            message: 'Ami supprimé avec succès'
        });

    } catch (err) {
        console.error('Erreur suppression ami:', err);
        res.status(500).json({ 
            message: 'Erreur serveur lors de la suppression de l\'ami',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Fonction helper pour compter les amis en commun
async function getMutualFriendsCount(user1Id, user2Id) {
    try {
        console.log(`Calcul amis en commun entre ${user1Id} et ${user2Id}`);

        // Requête optimisée pour compter les amis en commun
        const [mutualResult] = await db.query(`
            SELECT COUNT(*) as mutual_count
            FROM (
                SELECT CASE 
                    WHEN f1.user1_id = ? THEN f1.user2_id 
                    ELSE f1.user1_id 
                END as friend_id
                FROM friendships f1
                WHERE (f1.user1_id = ? OR f1.user2_id = ?) 
                AND f1.status = 'accepted'
            ) friends1
            INNER JOIN (
                SELECT CASE 
                    WHEN f2.user1_id = ? THEN f2.user2_id 
                    ELSE f2.user1_id 
                END as friend_id
                FROM friendships f2
                WHERE (f2.user1_id = ? OR f2.user2_id = ?) 
                AND f2.status = 'accepted'
            ) friends2 ON friends1.friend_id = friends2.friend_id
        `, [user1Id, user1Id, user1Id, user2Id, user2Id, user2Id]);
        
        const mutualCount = mutualResult[0]?.mutual_count || 0;
        
        console.log(`${mutualCount} amis en commun trouvés`);
        return mutualCount;

    } catch (error) {
        console.error('Erreur calcul amis en commun:', error);
        return 0; // Retourner 0 en cas d'erreur
    }
}

// Route pour obtenir les statistiques d'amitié d'un utilisateur
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Compter les amis acceptés
        const [friendsCount] = await db.query(`
            SELECT COUNT(*) as count
            FROM friendships
            WHERE (user1_id = ? OR user2_id = ?) AND status = 'accepted'
        `, [userId, userId]);

        // Compter les demandes reçues en attente
        const [pendingReceived] = await db.query(`
            SELECT COUNT(*) as count
            FROM friendships
            WHERE user2_id = ? AND status = 'pending'
        `, [userId]);

        // Compter les demandes envoyées en attente
        const [pendingSent] = await db.query(`
            SELECT COUNT(*) as count
            FROM friendships
            WHERE user1_id = ? AND status = 'pending'
        `, [userId]);

        res.json({
            friends_count: friendsCount[0].count,
            pending_received: pendingReceived[0].count,
            pending_sent: pendingSent[0].count
        });

    } catch (error) {
        console.error('Erreur récupération stats amitié:', error);
        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération des statistiques',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Récupérer uniquement les amis acceptés (alias pour /list avec filtre)
router.get('/accepted', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Même requête que /list mais sans pagination
        const [friends] = await db.query(`
            SELECT 
                f.id,
                f.accepted_date,
                CASE 
                    WHEN f.user1_id = ? THEN f.user2_id 
                    ELSE f.user1_id 
                END as friend_id,
                u.id as 'friend.id',
                u.username as 'friend.username',
                u.profile_picture as 'friend.profile_picture',
                u.last_login as 'friend.last_login'
            FROM friendships f
            JOIN users u ON (
                (f.user1_id = ? AND u.id = f.user2_id) OR 
                (f.user2_id = ? AND u.id = f.user1_id)
            )
            WHERE (f.user1_id = ? OR f.user2_id = ?) 
            AND f.status = 'accepted'
            ORDER BY f.accepted_date DESC
        `, [userId, userId, userId, userId, userId]);

        const formattedFriends = friends.map(friend => ({
            friendship_id: friend.id,
            friend: {
                id: friend['friend.id'],
                username: friend['friend.username'],
                profile_picture: friend['friend.profile_picture'],
                last_login: friend['friend.last_login'],
                is_online: isUserOnline(friend['friend.last_login']) // Ajoutez cette fonction si nécessaire
            }
        }));

        res.json(formattedFriends);
    } catch (err) {
        console.error('Erreur récupération amis acceptés:', err);
        res.status(500).json({ 
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Helper pour vérifier si un utilisateur est en ligne
function isUserOnline(lastLogin) {
    if (!lastLogin) return false;
    const now = new Date();
    const last = new Date(lastLogin);
    return (now - last) < 15 * 60 * 1000; // En ligne si dernière activité < 15 min
}
module.exports = router;