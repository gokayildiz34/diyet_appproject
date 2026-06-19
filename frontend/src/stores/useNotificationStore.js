/**
 * FitPlate - Notification Store (Zustand)
 * Uygulama içi bildirim merkezi
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const createNotification = (payload = {}) => ({
  id: String(
    payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ),
  type: payload.type || "system",
  title: payload.title || "Yeni bildirim",
  message: payload.message || "",
  actor: payload.actor || null,
  actionPath: payload.actionPath || null,
  dedupeKey: payload.dedupeKey || null,
  priority: payload.priority || "normal",
  read: Boolean(payload.read),
  createdAt: payload.createdAt || new Date().toISOString(),
});

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      items: [],

      addNotification: (payload) => {
        const next = createNotification(payload);

        if (next.dedupeKey) {
          const exists = get().items.some(
            (item) => item.dedupeKey && item.dedupeKey === next.dedupeKey,
          );
          if (exists) return;
        }

        set((state) => ({
          items: [next, ...state.items].slice(0, 100),
        }));
      },

      handlePushReceived: (pushData) => {
        get().addNotification({
          type: pushData.type || "system",
          title: pushData.title || "Yeni bildirim",
          message: pushData.body || pushData.message || "",
          actionPath: pushData.url || pushData.actionPath || null,
          priority: pushData.priority || "normal",
        });
      },

      seedNotifications: (payloads = []) => {
        if (!Array.isArray(payloads) || payloads.length === 0) return;
        payloads.forEach((payload) => get().addNotification(payload));
      },

      markAsRead: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearRead: () =>
        set((state) => ({
          items: state.items.filter((item) => !item.read),
        })),

      resetStore: () => set({ items: [] }),
    }),
    {
      name: "fitplate-notifications",
    },
  ),
);
