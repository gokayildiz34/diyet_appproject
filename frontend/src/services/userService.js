/**
 * FitPlate - User Service
 * Backend API ile haberleşen kullanıcı servisi
 */
import api from "./api";

export const userService = {
  /**
   * Kullanıcı arama
   * GET /api/users/search?q=xxx
   */
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response;
  },
};
