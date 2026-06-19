/**
 * FitPlate - Feed Service
 * Backend API ile haberleşen feed servisi
 */
import api from "./api";

export const feedService = {
  /**
   * Tüm gönderileri getir
   * GET /api/feed
   */
  getFeed: async () => {
    const response = await api.get("/feed");
    return response;
  },

  /**
   * Yeni gönderi oluştur
   * POST /api/feed
   */
  createPost: async (data) => {
    const response = await api.post("/feed", {
      content: data.content,
      image_url: data.image || data.image_url || null,
      type: data.type || "text",
    });
    return response;
  },

  /**
   * Görsel yükle
   * POST /api/upload
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  /**
   * Gönderiyi beğen
   * POST /api/feed/{postId}/like
   */
  likePost: async (postId) => {
    const response = await api.post(`/feed/${postId}/like`);
    return response;
  },

  /**
   * Beğeniyi geri al
   * DELETE /api/feed/{postId}/like
   */
  unlikePost: async (postId) => {
    const response = await api.delete(`/feed/${postId}/like`);
    return response;
  },

  /**
   * Yorum ekle
   * POST /api/feed/{postId}/comments
   */
  commentPost: async (postId, data) => {
    const response = await api.post(`/feed/${postId}/comments`, {
      content: data.content,
    });
    return response;
  },

  /**
   * Yorumları getir
   * GET /api/feed/{postId}/comments
   */
  getComments: async (postId) => {
    const response = await api.get(`/feed/${postId}/comments`);
    return response;
  },

  /**
   * Gönderiyi destekle
   * POST /api/feed/{postId}/support
   */
  supportPost: async (postId) => {
    const response = await api.post(`/feed/${postId}/support`);
    return response;
  },

  /**
   * Desteği geri al
   * DELETE /api/feed/{postId}/support
   */
  unsupportPost: async (postId) => {
    const response = await api.delete(`/feed/${postId}/support`);
    return response;
  },

  /**
   * Gönderi sil
   * DELETE /api/feed/{postId}
   */
  deletePost: async (postId) => {
    const response = await api.delete(`/feed/${postId}`);
    return response;
  },
};
