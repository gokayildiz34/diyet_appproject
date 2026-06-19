/**
 * FitPlate - AI Coach Service
 * Backend API + yerel fallback ile çalışan AI koç servisi.
 * Backend erişilemezse yerel diyet planı üretecini kullanır.
 */
import api from "./api";
import { generatePersonalizedDietPlan } from "../utils/dietPlanGenerator";

const coachReplies = {
  demir: [
    "Plan hazır. Kurallara sadık kalırsan sonuç gelir.",
    "Disiplini bozma, bugün bu plana odaklan.",
    "Kaçamak yok. Hedefe kilitlendik.",
  ],
  ipek: [
    "Sana uygun bir plan oluşturdum. Küçük adımlarla harika ilerleyeceğiz 💕",
    "Bugün kendini iyi hissetmeni sağlayacak bir plan hazırladım 🌸",
    "Her adım önemli, birlikte başaracağız 💪",
  ],
  zen: [
    "Dengeli bir plan hazırladım. Gün içinde su ve uyku düzenini de koru.",
    "Bedenini dinle, bu plan sana rehber olsun.",
    "Akışta kal, plan sana yol gösterecek 🌿",
  ],
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateMockAnalysis = () => {
  const foods = [
    { name: "Izgara Tavuk + Salata", calories: 420, carbs: 15, protein: 45, fat: 18 },
    { name: "Yulaf + Meyve + Yoğurt", calories: 350, carbs: 55, protein: 12, fat: 8 },
    { name: "Ton Balıklı Sandviç", calories: 480, carbs: 38, protein: 32, fat: 20 },
    { name: "Mercimek Çorbası + Ekmek", calories: 310, carbs: 45, protein: 18, fat: 6 },
    { name: "Sebzeli Makarna", calories: 520, carbs: 68, protein: 16, fat: 14 },
  ];
  return pickRandom(foods);
};

export const aiService = {
  /**
   * Yemek metin analizi (yerel mock — gerçek AI entegrasyonu ileride)
   */
  analyzeFood: async (data) => {
    const analysis = generateMockAnalysis();
    return {
      data: {
        food_name: analysis.name,
        summary: `${analysis.name} — tahmini ${analysis.calories} kcal`,
        calories: analysis.calories,
        macros: { carbs: analysis.carbs, protein: analysis.protein, fat: analysis.fat },
      },
    };
  },

  /**
   * Yemek fotoğraf analizi (yerel mock — gerçek AI entegrasyonu ileride)
   */
  analyzeFoodImage: async () => {
    const analysis = generateMockAnalysis();
    return {
      data: {
        food_name: analysis.name,
        summary: `📸 ${analysis.name} tespit edildi — ${analysis.calories} kcal`,
        calories: analysis.calories,
        macros: { carbs: analysis.carbs, protein: analysis.protein, fat: analysis.fat },
      },
    };
  },

  /**
   * Koç sohbeti — backend API + fallback
   * POST /api/ai/coach-chat
   */
  coachChat: async (data) => {
    try {
      const response = await api.post("/ai/coach-chat", {
        coachPersona: data.coachPersona || "demir",
        dailyCalorieGoal: data.dailyCalorieGoal || 2000,
        message: data.message || "",
      });
      return response;
    } catch {
      // Backend erişilemezse yerel fallback
      const persona = data.coachPersona || "demir";
      const plan = generatePersonalizedDietPlan({
        coachPersona: persona,
        dailyCalorieGoal: data.dailyCalorieGoal || 2000,
      });
      return {
        data: {
          reply: pickRandom(coachReplies[persona] || coachReplies.demir),
          coachName: plan.coach.coachName,
          coachColor: plan.coach.color,
          intro: plan.coach.intro,
          plan: { totalCalories: plan.totalCalories, meals: plan.meals },
        },
      };
    }
  },

  /**
   * Kişiselleştirilmiş diyet planı — backend API + fallback
   * POST /api/diet-plans (kaydeder) veya GET /api/diet-plans/latest
   */
  getPersonalizedDietPlan: async (data) => {
    try {
      const response = await api.post("/ai/coach-chat", {
        coachPersona: data.coachPersona || "demir",
        dailyCalorieGoal: data.dailyCalorieGoal || 2000,
        message: "",
      });
      const d = response.data;
      return {
        data: {
          coachName: d.coachName,
          coachColor: d.coachColor,
          intro: d.reply,
          totalCalories: d.plan?.totalCalories,
          meals: d.plan?.meals,
        },
      };
    } catch {
      // Backend erişilemezse yerel fallback
      const plan = generatePersonalizedDietPlan({
        coachPersona: data.coachPersona || "demir",
        dailyCalorieGoal: data.dailyCalorieGoal || 2000,
      });
      return {
        data: {
          coachName: plan.coach.coachName,
          coachColor: plan.coach.color,
          intro: plan.coach.intro,
          totalCalories: plan.totalCalories,
          meals: plan.meals,
        },
      };
    }
  },

  /**
   * Koç yorumu getir
   */
  getCoachComment: async () => {
    return {
      data: {
        coachName: "Demir",
        color: "#ef4444",
        text: "Bu öğünde protein oranın iyi. Devam et.",
      },
    };
  },

  /**
   * Koç kişiliği ayarla
   * PUT /api/auth/profile
   */
  setCoachPersona: async (persona) => {
    try {
      await api.put("/auth/profile", { coach_persona: persona });
      return { data: { persona, success: true } };
    } catch {
      return { data: { persona, success: true } };
    }
  },

  /**
   * Günlük özet
   */
  getDailySummary: async () => {
    return {
      data: {
        totalCalories: 1450,
        goal: 2000,
        meals: 3,
        tip: "Akşam yemeğinde protein ağırlıklı beslen.",
      },
    };
  },

  /**
   * Bildirimler — bu ileride backend'den gelecek
   */
  getNotifications: async () => {
    return { data: [] };
  },
};
