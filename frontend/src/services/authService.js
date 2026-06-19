/**
 * FitPlate - Auth Service
 * Backend API ile haberleşen authentication servisi
 */
import api from "./api";

export const authService = {
  /**
   * Kullanıcı girişi
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ data: { status, user, token } }>}
   */
  login: async (credentials) => {
    const response = await api.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    return response;
  },

  /**
   * Yeni kullanıcı kaydı
   * @param {{ name: string, email: string, password: string }} userData
   * @returns {Promise<{ data: { status, user, token } }>}
   */
  register: async (userData) => {
    const response = await api.post("/auth/register", {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    return response;
  },

  /**
   * Çıkış yap (client-side token temizleme)
   */
  logout: async () => {
    return { data: { success: true } };
  },

  /**
   * Mevcut kullanıcı bilgisini getir (JWT ile)
   * @returns {Promise<{ data: { status, user } }>}
   */
  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response;
  },

  /**
   * Profil güncelle
   * @param {object} data
   * @returns {Promise<{ data: { status, user } }>}
   */
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response;
  },

  /**
   * Şifre değiştir
   * @param {{ current_password: string, new_password: string }} data
   */
  changePassword: async (data) => {
    const response = await api.put("/auth/password", data);
    return response;
  },
};
