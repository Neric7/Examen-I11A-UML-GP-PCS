-- Schéma amélioré avec support des commentaires imbriqués et fonctionnalités avancées

CREATE DATABASE IF NOT EXISTS facebook_mini_app;
USE facebook_mini_app;

-- Table des utilisateurs avec rôles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    phone VARCHAR(20),
    dateOfBirth DATE,
    city VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    occupation VARCHAR(100),
    relationship ENUM('single', 'in_a_relationship', 'married', 'complicated'),
    interests TEXT,
    bio TEXT,
    profile_picture VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);


-- Table des posts
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    author_id INT NOT NULL,
    publication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_publication_date (publication_date),
    INDEX idx_active (is_active)
);

-- Table des commentaires avec support des réponses (commentaires imbriqués)
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    post_id INT NOT NULL,
    parent_comment_id INT NULL, -- Pour les réponses aux commentaires
    comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_post (post_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_date (comment_date),
    INDEX idx_active (is_active)
);

-- Table des likes pour les posts
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    like_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_like (user_id, post_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
);

-- Table des likes pour les commentaires
CREATE TABLE comment_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    comment_id INT NOT NULL,
    like_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_like (user_id, comment_id),
    INDEX idx_comment (comment_id),
    INDEX idx_user (user_id)
);

-- Table des amitiés
CREATE TABLE friendships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'blocked') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user1_id, user2_id),
    CHECK (user1_id != user2_id),
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_status (status)
);

-- Table des signalements
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_item_type ENUM('post', 'comment', 'user') NOT NULL,
    reported_item_id INT NOT NULL,
    reason ENUM('spam', 'harassment', 'inappropriate', 'fake', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reporter (reporter_id),
    INDEX idx_reported_item (reported_item_type, reported_item_id),
    INDEX idx_status (status)
);

-- Table des notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('like', 'comment', 'friend_request', 'friend_accepted', 'mention', 'reply') NOT NULL,
    related_user_id INT,
    related_item_type ENUM('post', 'comment') NULL,
    related_item_id INT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_unread (user_id, is_read),
    INDEX idx_type (type)
);

-- Triggers pour maintenir les compteurs

-- Trigger pour post_likes
DELIMITER //
CREATE TRIGGER update_post_likes_count_insert 
AFTER INSERT ON post_likes 
FOR EACH ROW 
BEGIN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
END//

CREATE TRIGGER update_post_likes_count_delete 
AFTER DELETE ON post_likes 
FOR EACH ROW 
BEGIN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
END//

-- Trigger pour comment_likes
CREATE TRIGGER update_comment_likes_count_insert 
AFTER INSERT ON comment_likes 
FOR EACH ROW 
BEGIN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
END//

CREATE TRIGGER update_comment_likes_count_delete 
AFTER DELETE ON comment_likes 
FOR EACH ROW 
BEGIN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
END//

-- Trigger pour comments
CREATE TRIGGER update_comments_count_insert 
AFTER INSERT ON comments 
FOR EACH ROW 
BEGIN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    IF NEW.parent_comment_id IS NOT NULL THEN
        UPDATE comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_comment_id;
    END IF;
END//

CREATE TRIGGER update_comments_count_delete 
AFTER DELETE ON comments 
FOR EACH ROW 
BEGIN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    IF OLD.parent_comment_id IS NOT NULL THEN
        UPDATE comments SET replies_count = replies_count - 1 WHERE id = OLD.parent_comment_id;
    END IF;
END//

DELIMITER ;