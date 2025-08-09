// src/controllers/friendshipController.js
const db = require('../config/database');

class FriendshipController {
    
    // Récupérer les demandes d'amis reçues
    static async getFriendRequests(req, res) {
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
                const mutualFriends = await FriendshipController.getMutualFriendsCount(userId, request.requester_id);
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
    }

    // Récupérer la liste des amis
    static async getFriendsList(req, res) {
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
    }

    // Suggestions d'amis
    static async getFriendSuggestions(req, res) {
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
                const mutualFriends = await FriendshipController.getMutualFriendsCount(userId, user.id);
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
    }

    // Envoyer une demande d'ami
    static async sendFriendRequest(req, res) {
        try {
            console.log('=== ENVOI DEMANDE D\'AMI ===');
            const { userId: targetUserId } = req.body;
            const currentUserId = req.user.userId;

            console.log('De:', currentUserId, 'Vers:', targetUserId);

            // Validation des données
            const validation = FriendshipController.validateFriendRequest(currentUserId, targetUserId);
            if (!validation.isValid) {
                return res.status(400).json({ message: validation.message });
            }

            // Vérifier si l'utilisateur cible existe
            const targetUser = await FriendshipController.findUserById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier s'il existe déjà une relation
            const existingRelation = await FriendshipController.findExistingFriendship(currentUserId, targetUserId);
            if (existingRelation) {
                return res.status(400).json({ 
                    message: FriendshipController.getExistingRelationMessage(existingRelation.status) 
                });
            }

            // Créer la demande d'ami
            const friendship = await FriendshipController.createFriendship(currentUserId, targetUserId);

            console.log('Demande d\'ami créée:', friendship);
            console.log('=== FIN ENVOI DEMANDE D\'AMI ===');

            res.status(201).json({
                message: 'Demande d\'ami envoyée avec succès',
                friendship: friendship
            });

        } catch (err) {
            console.error('Erreur envoi demande d\'ami:', err);
            res.status(500).json({ 
                message: 'Erreur serveur lors de l\'envoi de la demande d\'ami',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }

    // Accepter une demande d'ami
    static async acceptFriendRequest(req, res) {
        try {
            console.log('=== ACCEPTER DEMANDE D\'AMI ===');
            const friendshipId = req.params.id;
            const userId = req.user.userId;

            console.log('Friendship ID:', friendshipId, 'User ID:', userId);

            // Vérifier que la demande existe et est adressée à l'utilisateur actuel
            const friendship = await FriendshipController.findPendingFriendshipForUser(friendshipId, userId);
            
            if (!friendship) {
                return res.status(404).json({ 
                    message: 'Demande d\'ami non trouvée ou déjà traitée' 
                });
            }

            // Accepter la demande
            const acceptedFriendship = await FriendshipController.acceptFriendship(friendshipId);

            console.log('Demande d\'ami acceptée');
            console.log('=== FIN ACCEPTER DEMANDE D\'AMI ===');

            res.json({
                message: 'Demande d\'ami acceptée avec succès',
                friendship: acceptedFriendship
            });

        } catch (err) {
            console.error('Erreur acceptation demande d\'ami:', err);
            res.status(500).json({ 
                message: 'Erreur serveur lors de l\'acceptation de la demande d\'ami',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }

    // Refuser une demande d'ami
    static async declineFriendRequest(req, res) {
        try {
            console.log('=== REFUSER DEMANDE D\'AMI ===');
            const friendshipId = req.params.id;
            const userId = req.user.userId;

            // Vérifier que la demande existe et est adressée à l'utilisateur actuel
            const friendship = await FriendshipController.findPendingFriendshipForUser(friendshipId, userId);
            
            if (!friendship) {
                return res.status(404).json({ 
                    message: 'Demande d\'ami non trouvée ou déjà traitée' 
                });
            }

            // Supprimer la demande
            await FriendshipController.deleteFriendship(friendshipId);

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
    }

    // Supprimer un ami
    static async removeFriend(req, res) {
        try {
            console.log('=== SUPPRIMER AMI ===');
            const friendUserId = req.params.id;
            const userId = req.user.userId;

            console.log('Suppression amitié entre:', userId, 'et', friendUserId);

            // Vérifier que l'amitié existe
            const friendship = await FriendshipController.findAcceptedFriendship(userId, friendUserId);
            
            if (!friendship) {
                return res.status(404).json({ message: 'Amitié non trouvée' });
            }

            // Supprimer l'amitié
            await FriendshipController.deleteFriendship(friendship.id);

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
    }

    // Obtenir les statistiques d'amitié
    static async getFriendshipStats(req, res) {
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
    }

    // ===== MÉTHODES PRIVÉES / UTILITAIRES =====

    // Valider une demande d'ami
    static validateFriendRequest(currentUserId, targetUserId) {
        if (!targetUserId) {
            return { isValid: false, message: 'ID utilisateur cible requis' };
        }

        if (currentUserId === parseInt(targetUserId)) {
            return { 
                isValid: false, 
                message: 'Vous ne pouvez pas vous envoyer une demande d\'ami à vous-même' 
            };
        }

        return { isValid: true };
    }

    // Trouver un utilisateur par ID
    static async findUserById(userId) {
        const [users] = await db.query(
            'SELECT id, username, email FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );
        return users.length > 0 ? users[0] : null;
    }

    // Vérifier s'il existe déjà une relation d'amitié
    static async findExistingFriendship(user1Id, user2Id) {
        const [friendships] = await db.query(`
            SELECT id, status, user1_id, user2_id 
            FROM friendships 
            WHERE (
                (user1_id = ? AND user2_id = ?) OR 
                (user1_id = ? AND user2_id = ?)
            )
        `, [user1Id, user2Id, user2Id, user1Id]);
        
        return friendships.length > 0 ? friendships[0] : null;
    }

    // Obtenir le message approprié pour une relation existante
    static getExistingRelationMessage(status) {
        const messages = {
            'pending': 'Une demande d\'ami est déjà en attente',
            'accepted': 'Vous êtes déjà amis',
            'declined': 'Cette demande d\'ami a été refusée précédemment'
        };
        return messages[status] || 'Une relation existe déjà';
    }

    // Créer une nouvelle demande d'amitié
    static async createFriendship(user1Id, user2Id) {
        const [result] = await db.query(
            'INSERT INTO friendships (user1_id, user2_id, status, request_date) VALUES (?, ?, ?, NOW())',
            [user1Id, user2Id, 'pending']
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

        return {
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
    }

    // Trouver une demande d'ami en attente pour un utilisateur
    static async findPendingFriendshipForUser(friendshipId, userId) {
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

        return friendships.length > 0 ? friendships[0] : null;
    }

    // Accepter une demande d'amitié
    static async acceptFriendship(friendshipId) {
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

        return {
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
    }

    // Trouver une amitié acceptée entre deux utilisateurs
    static async findAcceptedFriendship(user1Id, user2Id) {
        const [friendships] = await db.query(`
            SELECT id, user1_id, user2_id 
            FROM friendships 
            WHERE (
                (user1_id = ? AND user2_id = ?) OR 
                (user1_id = ? AND user2_id = ?)
            ) AND status = 'accepted'
        `, [user1Id, user2Id, user2Id, user1Id]);

        return friendships.length > 0 ? friendships[0] : null;
    }

    // Supprimer une amitié
    static async deleteFriendship(friendshipId) {
        await db.query('DELETE FROM friendships WHERE id = ?', [friendshipId]);
    }

    // Compter les amis en commun entre deux utilisateurs
    static async getMutualFriendsCount(user1Id, user2Id) {
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
}

module.exports = FriendshipController;