/**
 * FitPlate - Notification Service
 * Backend API ile haberleşen bildirim servisi
 */
import api from "./api";

export const notificationService = {
  /**
   * Kullanıcının bildirimlerini getir
   * GET /api/notifications
   */
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response;
  },

  /**
   * Bildirimi okundu yap
   * PUT /api/notifications/{id}/read
   */
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response;
  },

  /**
   * Tüm bildirimleri okundu yap
   * PUT /api/notifications/read-all
   */
  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response;
  },

  /**
   * Bildirim sil
   * DELETE /api/notifications/{id}
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response;
  },
};
