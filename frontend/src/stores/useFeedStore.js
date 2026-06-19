/**
 * FitPlate - Feed Store (Zustand)
 */
import { create } from "zustand";

export const useFeedStore = create((set, get) => ({
  posts: [],
  selectedPost: null,
  composerOpen: false,
  composerMode: "text", // 'text' | 'photo' | 'voice'

  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, ...updates } : p,
      ),
    })),

  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),

  setSelectedPost: (post) => set({ selectedPost: post }),

  toggleComposer: () => set((state) => ({ composerOpen: !state.composerOpen })),

  setComposerMode: (mode) => set({ composerMode: mode }),

  addCommentToPost: (postId, comment) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), comment] }
          : p,
      ),
    })),

  toggleLikePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p,
      ),
    })),

  toggleSupportPost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isSupported: !p.isSupported,
              supportCount: p.isSupported
                ? Math.max((p.supportCount || 0) - 1, 0)
                : (p.supportCount || 0) + 1,
            }
          : p,
      ),
    })),
}));
