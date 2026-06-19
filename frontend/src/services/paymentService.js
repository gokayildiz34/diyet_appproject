/**
 * FitPlate - Payment Service
 * Backend API ile haberleşen ödeme servisi
 */
import api from "./api";

export const paymentService = {
  /**
   * Üyelik planlarını getir
   * GET /api/payments/plans
   */
  getPlans: async () => {
    try {
      const response = await api.get("/payments/plans");
      return response;
    } catch {
      // Backend erişilemezse yerel fallback
      return {
        data: {
          plans: [
            {
              key: "bronze", name: "Bronze", amount: 14900, currency: "try", interval: "month",
              features: ["Temel AI koç önerileri", "Haftalık özet raporu", "Topluluk akışı erişimi"],
            },
            {
              key: "gold", name: "Gold", amount: 29900, currency: "try", interval: "month",
              features: ["Gelişmiş AI koç yorumları", "Günlük kişiselleştirilmiş diyet planı", "Öncelikli destek"],
            },
            {
              key: "diamond", name: "Diamond", amount: 49900, currency: "try", interval: "month",
              features: ["Sınırsız fotoğraf analizi", "Canlı koç öneri simülasyonu", "Özel premium topluluk alanı"],
            },
          ],
        },
      };
    }
  },

  /**
   * Checkout oturumu oluştur
   * POST /api/payments/checkout-session
   */
  createCheckoutSession: async (data) => {
    try {
      const response = await api.post("/payments/checkout-session", {
        plan: data.plan,
        email: data.email,
      });
      return response;
    } catch {
      // Stripe yapılandırılmamışsa simüle et
      return {
        data: {
          checkoutUrl: `${window.location.origin}/membership?status=success&plan=${data.plan}`,
        },
      };
    }
  },
};
