import React from 'react';
import { usePost } from '../../context/PostContext';

const PostList = () => {
  const { posts } = usePost();

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Publications récentes</h3>
      
      {posts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          Aucune publication pour le moment.
        </p>
      ) : (
        <div>
          {posts.map(post => (
            <div key={post.id} style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {post.author?.name || 'Utilisateur'}
              </div>
              <p>{post.content}</p>
              <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;