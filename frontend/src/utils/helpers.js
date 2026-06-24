/**
 * FitPlate - Helper Utilities
 */

/**
 * Kalori değerini formatla
 */
export const formatCalories = (value) => {
  if (!value && value !== 0) return "0";
  return new Intl.NumberFormat("tr-TR").format(Math.round(value));
};

/**
 * Tarih formatla (reltaif)
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "Az önce";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;

  return date.toLocaleDateString("tr-TR");
};

/**
 * Dosya boyutunu formatla
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Makro nutrient renk döndürme
 */
export const getMacroColor = (type) => {
  const colors = {
    carbs: "#3b82f6",
    protein: "#10b981",
    fat: "#f59e0b",
    fiber: "#8b5cf6",
  };
  return colors[type] || "#6b7280";
};

/**
 * Kalori yüzdesine göre renk döndürme
 */
export const getCalorieColor = (percent) => {
  if (percent <= 50) return "#10b981";
  if (percent <= 80) return "#f59e0b";
  if (percent <= 100) return "#ef4444";
  return "#dc2626";
};

/**
 * Input sanitize
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().replace(/<[^>]*>/g, "");
};

/**
 * Debounce
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBase}${cleanPath}`;
};

