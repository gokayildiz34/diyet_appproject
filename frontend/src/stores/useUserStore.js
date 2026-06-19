/**
 * FitPlate - User/Preferences Store (Zustand)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      // Coach persona: 'demir' (strict), 'ipek' (gentle), 'zen' (balanced)
      coachPersona: "demir",
      isPremium: false,
      membershipTier: "free",
      dailyCalorieGoal: 2000,
      dailyCaloriesConsumed: 0,
      notificationsEnabled: true,
      mealReminderEnabled: true,
      autoShareDietEnabled: false,
      autoShareDietTime: "08:30",
      lastDietAutoShareDate: null,
      recentLikeActivities: [],
      recentCommentActivities: [],
      weeklyCheckins: [],
      onboardingCompleted: false,

      setCoachPersona: (persona) =>
        set({
          coachPersona: persona,
          // Koç değişince yeni koç planı aynı gün tekrar üretilebilsin
          lastDietAutoShareDate: null,
        }),
      setIsPremium: (isPremium) => set({ isPremium }),
      setMembershipTier: (membershipTier) =>
        set({
          membershipTier,
          isPremium: membershipTier !== "free",
        }),
      setDailyCalorieGoal: (goal) => set({ dailyCalorieGoal: goal }),
      addCalories: (calories) =>
        set((state) => ({
          dailyCaloriesConsumed: state.dailyCaloriesConsumed + calories,
        })),
      resetDailyCalories: () => set({ dailyCaloriesConsumed: 0 }),
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),
      setMealReminderEnabled: (enabled) =>
        set({ mealReminderEnabled: enabled }),
      setAutoShareDietEnabled: (enabled) =>
        set({ autoShareDietEnabled: enabled }),
      setAutoShareDietTime: (time) => set({ autoShareDietTime: time }),
      setLastDietAutoShareDate: (date) => set({ lastDietAutoShareDate: date }),
      addLikeActivity: (activity) =>
        set((state) => ({
          recentLikeActivities: [
            activity,
            ...(state.recentLikeActivities || []),
          ].slice(0, 30),
        })),
      addCommentActivity: (activity) =>
        set((state) => ({
          recentCommentActivities: [
            activity,
            ...(state.recentCommentActivities || []),
          ].slice(0, 30),
        })),
      addWeeklyCheckin: (checkin) =>
        set((state) => ({
          weeklyCheckins: [
            {
              id: String(
                checkin?.id ||
                  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ),
              date: checkin?.date || new Date().toISOString(),
              weightKg: Number(checkin?.weightKg) || 0,
              waistCm:
                checkin?.waistCm === null || checkin?.waistCm === undefined
                  ? null
                  : Number(checkin.waistCm),
              sleepHours: Number(checkin?.sleepHours) || 0,
              energyScore: Number(checkin?.energyScore) || 5,
              adherenceScore: Number(checkin?.adherenceScore) || 50,
              notes: checkin?.notes || "",
            },
            ...(state.weeklyCheckins || []),
          ].slice(0, 52),
        })),
      setWeeklyCheckins: (checkins) => set({ weeklyCheckins: checkins }),
      removeWeeklyCheckin: (id) =>
        set((state) => ({
          weeklyCheckins: (state.weeklyCheckins || []).filter(
            (item) => item.id !== id,
          ),
        })),
      clearRecentActivities: () =>
        set({ recentLikeActivities: [], recentCommentActivities: [] }),
      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      resetStore: () =>
        set({
          coachPersona: "demir",
          isPremium: false,
          membershipTier: "free",
          dailyCalorieGoal: 2000,
          dailyCaloriesConsumed: 0,
          notificationsEnabled: true,
          mealReminderEnabled: true,
          autoShareDietEnabled: false,
          autoShareDietTime: "08:30",
          lastDietAutoShareDate: null,
          recentLikeActivities: [],
          recentCommentActivities: [],
          weeklyCheckins: [],
          onboardingCompleted: false,
        }),
    }),
    {
      name: "fitplate-user",
    },
  ),
);
