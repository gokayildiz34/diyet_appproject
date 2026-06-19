/**
 * FitPlate - Auth Store (Zustand)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  setOneSignalExternalUserId,
  removeOneSignalExternalUserId,
} from "../services/oneSignalService";
import { useUserStore } from "./useUserStore";
import { useNotificationStore } from "./useNotificationStore";
import { useFriendStore } from "./useFriendStore";
import { useFeedStore } from "./useFeedStore";

/** Tüm kullanıcıya özel store'ları sıfırla */
const resetAllUserStores = () => {
  useUserStore.getState().resetStore();
  useNotificationStore.getState().resetStore();
  useFriendStore.getState().resetStore();
  useFeedStore.getState().setPosts([]);
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        // Önceki kullanıcıdan farklıysa store'ları temizle
        const prevUser = get().user;
        if (prevUser && String(prevUser.id) !== String(user?.id)) {
          resetAllUserStores();
        }

        if (user?.id) {
          setOneSignalExternalUserId(user.id);
        }
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        removeOneSignalExternalUserId();
        resetAllUserStores();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "fitplate-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
