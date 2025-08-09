const db = require('../config/database'); // Instance mysql2/promise

class Post {
  static async create({ content, image_url, author_id }) {
    if ((!content || content.trim() === '') && !image_url) {
      throw new Error('Contenu ou image requis');
    }

    const [result] = await db.execute(
      `INSERT INTO posts (content, image_url, author_id, publication_date, is_active) VALUES (?, ?, ?, NOW(), TRUE)`,
      [content, image_url, author_id]
    );

    return result.insertId;
  }

  static async findAll(limit = 10, offset = 0) {
    const [rows] = await db.execute(
      `SELECT p.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.is_active = TRUE
      ORDER BY p.publication_date DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    await db.execute(
      `UPDATE posts SET is_active = FALSE, updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }
}

module.exports = Post;
