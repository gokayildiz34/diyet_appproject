/**
 * FitPlate - Friend Service
 * Backend API ile haberleşen arkadaşlık servisi
 */
import api from "./api";

export const friendService = {
  /**
   * Arkadaş listesini getir
   * GET /api/friends
   */
  getFriends: async () => {
    const response = await api.get("/friends");
    return response;
  },

  /**
   * Bekleyen arkadaşlık isteklerini getir
   * GET /api/friends/requests
   */
  getPendingRequests: async () => {
    const response = await api.get("/friends/requests");
    return response;
  },

  /**
   * Arkadaşlık isteği gönder
   * POST /api/friends/request
   */
  sendRequest: async (addresseeId) => {
    const response = await api.post("/friends/request", {
      addressee_id: addresseeId,
    });
    return response;
  },

  /**
   * Arkadaşlık isteğini kabul et
   * POST /api/friends/accept/{id}
   */
  acceptRequest: async (requestId) => {
    const response = await api.post(`/friends/accept/${requestId}`);
    return response;
  },

  /**
   * Arkadaşlık isteğini reddet
   * POST /api/friends/decline/{id}
   */
  declineRequest: async (requestId) => {
    const response = await api.post(`/friends/decline/${requestId}`);
    return response;
  },

  /**
   * Arkadaşı sil
   * DELETE /api/friends/{id}
   */
  removeFriend: async (friendId) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response;
  },

  /**
   * Kullanıcı ara
   * GET /api/users/search?q={query}
   */
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response;
  },
};
