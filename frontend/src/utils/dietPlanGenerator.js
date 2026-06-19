/**
 * Koç personası ve günlük kalori hedefine göre örnek diyet planı üretir.
 * Frontend fallback olarak kullanılır.
 */

const coachMeta = {
  demir: {
    coachName: "Demir",
    color: "#ef4444",
    intro: "Disiplinli plan hazır. Saatlere sadık kal, kaçamak yok.",
  },
  ipek: {
    coachName: "İpek",
    color: "#ec4899",
    intro: "Sana uygun, sürdürülebilir ve nazik bir plan hazırladım 💕",
  },
  zen: {
    coachName: "Zen",
    color: "#10b981",
    intro: "Dengeli ve sade bir gün planı hazırladım. Akışta kal.",
  },
};

const mealTemplates = [
  {
    key: "Kahvaltı",
    options: [
      "Yulaf + yoğurt + meyve + ceviz",
      "2 haşlanmış yumurta + avokadolu tam tahıllı tost",
      "Omlet + lor peyniri + roka + tam buğday ekmeği",
    ],
  },
  {
    key: "Öğle",
    options: [
      "Izgara tavuk + bulgur + zeytinyağlı salata",
      "Ton balıklı salata + kefir",
      "Hindi fümeli sandviç + ayran + yeşillik",
    ],
  },
  {
    key: "Ara Öğün",
    options: ["Badem + 1 porsiyon meyve", "Kefir + chia", "Yoğurt + tarçın"],
  },
  {
    key: "Akşam",
    options: [
      "Fırın somon + sebze + yoğurt",
      "Izgara köfte + zeytinyağlı sebze",
      "Bakliyat salatası + cacık",
    ],
  },
];

const getDistribution = (goal) => {
  const breakfast = Math.round(goal * 0.25);
  const lunch = Math.round(goal * 0.35);
  const snack = Math.round(goal * 0.1);
  const dinner = Math.max(goal - breakfast - lunch - snack, 0);
  return [breakfast, lunch, snack, dinner];
};

const pick = (arr, seed) => arr[seed % arr.length];

export const generatePersonalizedDietPlan = ({
  coachPersona,
  dailyCalorieGoal,
  date = new Date(),
}) => {
  const coach = coachMeta[coachPersona] || coachMeta.demir;
  const calories = Math.max(Number(dailyCalorieGoal) || 2000, 1200);
  const [b, l, s, d] = getDistribution(calories);
  const daySeed = date.getDate() + date.getMonth() + date.getFullYear();

  const meals = mealTemplates.map((meal, idx) => {
    const target = [b, l, s, d][idx];
    return {
      name: meal.key,
      targetCalories: target,
      menu: pick(meal.options, daySeed + idx),
    };
  });

  return {
    coach,
    totalCalories: calories,
    meals,
  };
};

export const buildDietPlanPostContent = (plan) => {
  const list = plan.meals
    .map((meal) => `• ${meal.name} (${meal.targetCalories} kcal): ${meal.menu}`)
    .join("\n");

  return `${plan.coach.intro}\n\n📋 Günlük Diyet Listem (${plan.totalCalories} kcal)\n${list}`;
};

export const getTodayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const isTimeReached = (timeText, date = new Date()) => {
  const [h, m] = (timeText || "08:30").split(":").map(Number);
  const target = new Date(date);
  target.setHours(
    Number.isFinite(h) ? h : 8,
    Number.isFinite(m) ? m : 30,
    0,
    0,
  );
  return date >= target;
};
