// src/models/Friendship.js
const db = require('../config/database');

class Friendship {
    constructor(data) {
        this.id = data.id;
        this.user1_id = data.user1_id;
        this.user2_id = data.user2_id;
        this.status = data.status; // 'pending', 'accepted', 'declined'
        this.request_date = data.request_date;
        this.accepted_date = data.accepted_date;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ===== MÉTHODES STATIQUES POUR LES REQUÊTES =====

    /**
     * Créer une nouvelle demande d'amitié
     * @param {number} user1Id - ID de l'utilisateur qui envoie la demande
     * @param {number} user2Id - ID de l'utilisateur qui reçoit la demande
     * @returns {Promise<Object>} La demande d'amitié créée avec les infos de l'utilisateur cible
     */
    static async create(user1Id, user2Id) {
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

    /**
     * Trouver une amitié par ID
     * @param {number} friendshipId 
     * @returns {Promise<Friendship|null>}
     */
    static async findById(friendshipId) {
        const [friendships] = await db.query(
            'SELECT * FROM friendships WHERE id = ?',
            [friendshipId]
        );
        
        return friendships.length > 0 ? new Friendship(friendships[0]) : null;
    }

    /**
     * Vérifier s'il existe déjà une relation d'amitié entre deux utilisateurs
     * @param {number} user1Id 
     * @param {number} user2Id 
     * @returns {Promise<Object|null>}
     */
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

    /**
     * Trouver une demande d'ami en attente pour un utilisateur spécifique
     * @param {number} friendshipId 
     * @param {number} userId - ID de l'utilisateur qui doit recevoir la demande
     * @returns {Promise<Object|null>}
     */
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

    /**
     * Trouver une amitié acceptée entre deux utilisateurs
     * @param {number} user1Id 
     * @param {number} user2Id 
     * @returns {Promise<Object|null>}
     */
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

    /**
     * Récupérer les demandes d'amis reçues par un utilisateur
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static async getFriendRequests(userId) {
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

        return requests.map(request => ({
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
            }
        }));
    }

    /**
     * Récupérer la liste des amis d'un utilisateur avec pagination
     * @param {number} userId 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getFriendsList(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

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

        return friends.map(friend => ({
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
    }

    /**
     * Récupérer des suggestions d'amis pour un utilisateur
     * @param {number} userId 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getFriendSuggestions(userId, limit = 5) {
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

        return suggestions;
    }

    /**
     * Compter les amis en commun entre deux utilisateurs
     * @param {number} user1Id 
     * @param {number} user2Id 
     * @returns {Promise<number>}
     */
    static async getMutualFriendsCount(user1Id, user2Id) {
        try {
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
            
            return mutualResult[0]?.mutual_count || 0;

        } catch (error) {
            console.error('Erreur calcul amis en commun:', error);
            return 0;
        }
    }

    /**
     * Obtenir les statistiques d'amitié d'un utilisateur
     * @param {number} userId 
     * @returns {Promise<Object>}
     */
    static async getFriendshipStats(userId) {
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

        return {
            friends_count: friendsCount[0].count,
            pending_received: pendingReceived[0].count,
            pending_sent: pendingSent[0].count
        };
    }

    // ===== MÉTHODES D'INSTANCE =====

    /**
     * Accepter une demande d'amitié
     * @returns {Promise<Object>}
     */
    async accept() {
        await db.query(
            'UPDATE friendships SET status = ?, accepted_date = NOW() WHERE id = ?',
            ['accepted', this.id]
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
        `, [this.id]);

        const updated = updatedFriendship[0];

        // Mettre à jour les propriétés de l'instance
        this.status = updated.status;
        this.accepted_date = updated.accepted_date;

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

    /**
     * Supprimer une amitié
     * @returns {Promise<void>}
     */
    async delete() {
        await db.query('DELETE FROM friendships WHERE id = ?', [this.id]);
    }

    /**
     * Supprimer une amitié par ID (méthode statique)
     * @param {number} friendshipId 
     * @returns {Promise<void>}
     */
    static async delete(friendshipId) {
        await db.query('DELETE FROM friendships WHERE id = ?', [friendshipId]);
    }

    /**
     * Marquer une demande comme refusée
     * @returns {Promise<void>}
     */
    async decline() {
        await db.query(
            'UPDATE friendships SET status = ? WHERE id = ?',
            ['declined', this.id]
        );
        this.status = 'declined';
    }

    // ===== MÉTHODES DE VALIDATION =====

    /**
     * Valider une demande d'ami
     * @param {number} currentUserId 
     * @param {number} targetUserId 
     * @returns {Object}
     */
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

    /**
     * Obtenir le message approprié pour une relation existante
     * @param {string} status 
     * @returns {string}
     */
    static getExistingRelationMessage(status) {
        const messages = {
            'pending': 'Une demande d\'ami est déjà en attente',
            'accepted': 'Vous êtes déjà amis',
            'declined': 'Cette demande d\'ami a été refusée précédemment'
        };
        return messages[status] || 'Une relation existe déjà';
    }

    // ===== CONSTANTES =====

    static get STATUS() {
        return {
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            DECLINED: 'declined'
        };
    }
}

module.exports = Friendship;