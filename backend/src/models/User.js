const db = require('../config/database');

const User = {
    async create(userData) {
        try {
            const { username, email, password_hash, phone, bio, profile_picture } = userData;
            
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password_hash, phone, bio, profile_picture) VALUES (?, ?, ?, ?, ?, ?)',
                [username, email, password_hash, phone, bio, profile_picture]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, password_hash, phone, bio, profile_picture, registration_date FROM users WHERE email = ?',
                [email]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erreur lors de la recherche par email:', error);
            throw error;
        }
    },

    async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, password_hash, phone, bio, profile_picture, registration_date FROM users WHERE username = ?',
                [username]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erreur lors de la recherche par nom d\'utilisateur:', error);
            throw error;
        }
    },

    async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, phone, bio, profile_picture, registration_date FROM users WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erreur lors de la recherche par ID:', error);
            throw error;
        }
    },

    async update(id, userData) {
        try {
            const { username, email, phone, bio, profile_picture } = userData;
            
            // Construire dynamiquement la requête SQL
            let updateFields = [];
            let updateValues = [];

            if (username !== undefined) {
                updateFields.push('username = ?');
                updateValues.push(username);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }
            if (phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(phone);
            }
            if (bio !== undefined) {
                updateFields.push('bio = ?');
                updateValues.push(bio);
            }
            if (profile_picture !== undefined) {
                updateFields.push('profile_picture = ?');
                updateValues.push(profile_picture);
            }

            if (updateFields.length === 0) {
                throw new Error('Aucune donnée à mettre à jour');
            }

            updateFields.push('updated_at = NOW()');
            updateValues.push(id);

            const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            
            const [result] = await db.execute(query, updateValues);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const [result] = await db.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            throw error;
        }
    },

    async getAllUsers(limit = 50, offset = 0) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, phone, bio, profile_picture, registration_date FROM users ORDER BY registration_date DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );
            
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }
    },

    async searchUsers(searchTerm, limit = 10) {
        try {
            const searchPattern = `%${searchTerm}%`;
            const [rows] = await db.execute(
                'SELECT id, username, email, profile_picture FROM users WHERE username LIKE ? OR email LIKE ? LIMIT ?',
                [searchPattern, searchPattern, limit]
            );
            
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            throw error;
        }
    },

    async updatePassword(id, newPasswordHash) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
                [newPasswordHash, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du mot de passe:', error);
            throw error;
        }
    },

    async updateLastLogin(id) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
            throw error;
        }
    }
};

module.exports = User;