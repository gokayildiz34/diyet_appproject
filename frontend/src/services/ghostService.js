/**
 * FitPlate - Ghost Service (Mock)
 * NPC bot etkileşimleri için iskelet servis
 */

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const ghostService = {
  getGhostProfiles: async () => {
    await delay(150);
    return { data: [] };
  },

  triggerGhostInteraction: async () => {
    await delay(200);
    return { data: { success: true } };
  },

  getGhostPosts: async () => {
    await delay(150);
    return { data: [] };
  },

  getGhostComments: async () => {
    await delay(100);
    return { data: [] };
  },
};
