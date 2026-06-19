/**
 * FitPlate - Constants
 */

export const APP_NAME = "FitPlate";

export const COACH_PERSONAS = {
  DEMIR: "demir",
  IPEK: "ipek",
  ZEN: "zen",
};

export const COMPOSER_MODES = {
  TEXT: "text",
  PHOTO: "photo",
  VOICE: "voice",
};

export const ROUTES = {
  HOME: "/",
  FEED: "/feed",
  LOGIN: "/login",
  REGISTER: "/register",
  ONBOARDING: "/onboarding",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  STATS: "/stats",
  CHECKIN: "/checkin",
  MEMBERSHIP: "/membership",
  COACHES: "/coaches",
  NOTIFICATIONS: "/notifications",
};

export const CALORIE_DEFAULTS = {
  MIN: 1000,
  MAX: 5000,
  DEFAULT: 2000,
  STEP: 100,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  FEED: {
    LIST: "/feed",
    CREATE: "/feed",
    UPLOAD: "/feed/upload",
    LIKE: (id) => `/feed/${id}/like`,
    COMMENTS: (id) => `/feed/${id}/comments`,
  },
  AI: {
    ANALYZE_FOOD: "/ai/analyze-food",
    ANALYZE_IMAGE: "/ai/analyze-food-image",
    COACH_CHAT: "/ai/coach-chat",
    COACH_COMMENT: (id) => `/ai/coach-comment/${id}`,
    DAILY_SUMMARY: "/ai/daily-summary",
  },
  GHOSTS: {
    PROFILES: "/ghosts/profiles",
    INTERACT: (id) => `/ghosts/interact/${id}`,
    POSTS: "/ghosts/posts",
  },
};
