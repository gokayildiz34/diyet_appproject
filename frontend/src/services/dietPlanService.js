/**
 * FitPlate - Diet Plan Service
 * Backend API ile haberleşen diyet planı servisi
 */
import api from "./api";

export const dietPlanService = {
  /**
   * Yeni diyet planı oluştur
   * POST /api/diet-plans
   */
  createPlan: async (planData) => {
    const response = await api.post("/diet-plans", planData);
    return response;
  },

  /**
   * Tüm planları getir
   * GET /api/diet-plans
   */
  getPlans: async () => {
    const response = await api.get("/diet-plans");
    return response;
  },

  /**
   * Son planı getir
   * GET /api/diet-plans/latest
   */
  getLatest: async () => {
    const response = await api.get("/diet-plans/latest");
    return response;
  },
};
