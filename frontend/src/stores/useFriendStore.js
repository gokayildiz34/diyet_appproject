/**
 * FitPlate - Friendship Store (Zustand)
 * Arkadaşlık ve istek yönetimi (frontend)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const normalizeId = (id) => String(id ?? "").trim();

export const useFriendStore = create(
  persist(
    (set, get) => ({
      profiles: {},
      friendIds: [],
      sentRequestIds: [],
      receivedRequestIds: [],
      demoInitialized: false,

      upsertProfile: (profile) => {
        const id = normalizeId(profile?.id);
        if (!id) return;
        set((state) => ({
          profiles: {
            ...state.profiles,
            [id]: {
              ...(state.profiles[id] || {}),
              ...profile,
              id,
            },
          },
        }));
      },

      upsertProfiles: (profiles) => {
        if (!Array.isArray(profiles) || profiles.length === 0) return;
        set((state) => {
          const nextProfiles = { ...state.profiles };
          profiles.forEach((profile) => {
            const id = normalizeId(profile?.id);
            if (!id) return;
            nextProfiles[id] = {
              ...(nextProfiles[id] || {}),
              ...profile,
              id,
            };
          });
          return { profiles: nextProfiles };
        });
      },

      initDemoFriendship: ({
        profiles = [],
        friendIds = [],
        receivedRequestIds = [],
      }) => {
        if (get().demoInitialized) return;
        set((state) => {
          const nextProfiles = { ...state.profiles };
          profiles.forEach((profile) => {
            const id = normalizeId(profile?.id);
            if (!id) return;
            nextProfiles[id] = {
              ...(nextProfiles[id] || {}),
              ...profile,
              id,
            };
          });

          return {
            profiles: nextProfiles,
            friendIds: [...new Set(friendIds.map(normalizeId).filter(Boolean))],
            receivedRequestIds: [
              ...new Set(receivedRequestIds.map(normalizeId).filter(Boolean)),
            ],
            demoInitialized: true,
          };
        });
      },

      sendFriendRequest: (profile) => {
        const id = normalizeId(profile?.id);
        if (!id) return;
        const state = get();
        if (state.friendIds.includes(id) || state.sentRequestIds.includes(id))
          return;

        set((prev) => ({
          profiles: {
            ...prev.profiles,
            [id]: {
              ...(prev.profiles[id] || {}),
              ...profile,
              id,
            },
          },
          sentRequestIds: [...prev.sentRequestIds, id],
        }));
      },

      cancelFriendRequest: (profileId) => {
        const id = normalizeId(profileId);
        set((state) => ({
          sentRequestIds: state.sentRequestIds.filter((x) => x !== id),
        }));
      },

      acceptFriendRequest: (profileId) => {
        const id = normalizeId(profileId);
        if (!id) return;
        set((state) => ({
          receivedRequestIds: state.receivedRequestIds.filter((x) => x !== id),
          friendIds: state.friendIds.includes(id)
            ? state.friendIds
            : [...state.friendIds, id],
        }));
      },

      declineFriendRequest: (profileId) => {
        const id = normalizeId(profileId);
        set((state) => ({
          receivedRequestIds: state.receivedRequestIds.filter((x) => x !== id),
        }));
      },

      removeFriend: (profileId) => {
        const id = normalizeId(profileId);
        set((state) => ({
          friendIds: state.friendIds.filter((x) => x !== id),
        }));
      },

      addFriendDirectly: (profile) => {
        const id = normalizeId(profile?.id);
        if (!id) return;
        set((state) => ({
          profiles: {
            ...state.profiles,
            [id]: {
              ...(state.profiles[id] || {}),
              ...profile,
              id,
            },
          },
          sentRequestIds: state.sentRequestIds.filter((x) => x !== id),
          receivedRequestIds: state.receivedRequestIds.filter((x) => x !== id),
          friendIds: state.friendIds.includes(id)
            ? state.friendIds
            : [...state.friendIds, id],
        }));
      },

      resetStore: () =>
        set({
          profiles: {},
          friendIds: [],
          sentRequestIds: [],
          receivedRequestIds: [],
          demoInitialized: false,
        }),
    }),
    {
      name: "fitplate-friends",
    },
  ),
);
