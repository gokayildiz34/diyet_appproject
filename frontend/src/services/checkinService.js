/**
 * FitPlate - Checkin Service
 * Backend API ile haberleşen haftalık check-in servisi
 */
import api from "./api";

export const checkinService = {
  /**
   * Kullanıcının check-in kayıtlarını getir
   * GET /api/checkins
   */
  getCheckins: async () => {
    const response = await api.get("/checkins");
    return response;
  },

  /**
   * Yeni check-in oluştur
   * POST /api/checkins
   */
  createCheckin: async (data) => {
    const response = await api.post("/checkins", {
      weight_kg: data.weight_kg ?? data.weightKg,
      waist_cm: data.waist_cm ?? data.waistCm ?? null,
      sleep_hours: data.sleep_hours ?? data.sleepHours,
      energy_score: data.energy_score ?? data.energyScore,
      adherence_score: data.adherence_score ?? data.adherenceScore,
      notes: data.notes || "",
      mood: data.mood || "🙂",
      photo_base64: data.photo_base64 || null,
      biceps_cm: data.biceps_cm ?? data.bicepsCm ?? null,
      date: data.date
        ? new Date(data.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    return response;
  },

  /**
   * Check-in sil
   * DELETE /api/checkins/{id}
   */
  deleteCheckin: async (id) => {
    const response = await api.delete(`/checkins/${id}`);
    return response;
  },
};
