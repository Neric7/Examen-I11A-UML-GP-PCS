import React, { createContext, useContext, useState } from 'react';

const PostContext = createContext();

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const addPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const updatePost = (postId, updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updatedPost } : post
    ));
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const value = {
    posts,
    setPosts,
    addPost,
    updatePost,
    deletePost,
    loading,
    setLoading
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};