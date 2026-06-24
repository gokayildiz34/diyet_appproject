/**
 * FitPlate - Ant Design Theme Configuration
 * Light and Dark modes
 */

export const darkTheme = {
  token: {
    colorPrimary: "#7c3aed", // Violet
    colorPrimaryBg: "#1a1025", 
    colorPrimaryBgHover: "#2d1b4e",
    colorPrimaryBorder: "#5b21b6",
    colorPrimaryHover: "#8b5cf6",
    colorPrimaryActive: "#6d28d9",
    colorPrimaryText: "#a78bfa",
    colorPrimaryTextHover: "#c4b5fd",
    colorPrimaryTextActive: "#8b5cf6",

    colorBgContainer: "#1a1a2e",
    colorBgElevated: "#16213e",
    colorBgLayout: "#0f0f1a",
    colorBgSpotlight: "#1a1025",

    colorText: "rgba(255, 255, 255, 0.92)",
    colorTextSecondary: "rgba(255, 255, 255, 0.65)",
    colorTextTertiary: "rgba(255, 255, 255, 0.45)",
    colorTextQuaternary: "rgba(255, 255, 255, 0.25)",

    colorBorder: "rgba(255, 255, 255, 0.08)",
    colorBorderSecondary: "rgba(255, 255, 255, 0.06)",

    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,

    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
    boxShadowSecondary: "0 2px 12px rgba(0, 0, 0, 0.2)",
  },
  components: {
    Layout: {
      headerBg: "#0f0f1a",
      bodyBg: "#0f0f1a",
      siderBg: "#12122a",
      footerBg: "#0f0f1a",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemSelectedBg: "rgba(124, 58, 237, 0.15)",
      darkItemHoverBg: "rgba(124, 58, 237, 0.08)",
    },
    Card: {
      colorBgContainer: "#1a1a2e",
      boxShadowTertiary: "0 2px 16px rgba(0, 0, 0, 0.25)",
    },
    Button: {
      primaryShadow: "0 2px 8px rgba(124, 58, 237, 0.35)",
    },
    Input: {
      colorBgContainer: "#12122a",
      activeBorderColor: "#7c3aed",
      hoverBorderColor: "#5b21b6",
    },
    Modal: {
      contentBg: "#1a1a2e",
      headerBg: "#1a1a2e",
    },
  },
};

export const lightTheme = {
  token: {
    colorPrimary: "#7c3aed", 
    colorPrimaryBg: "#f3e8ff", 
    colorPrimaryBgHover: "#e9d5ff",
    colorPrimaryBorder: "#c4b5fd",
    colorPrimaryHover: "#8b5cf6",
    colorPrimaryActive: "#6d28d9",
    colorPrimaryText: "#6d28d9",
    colorPrimaryTextHover: "#5b21b6",
    colorPrimaryTextActive: "#4c1d95",

    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBgLayout: "#f8fafc",
    colorBgSpotlight: "#f1f5f9",

    colorText: "rgba(0, 0, 0, 0.88)",
    colorTextSecondary: "rgba(0, 0, 0, 0.65)",
    colorTextTertiary: "rgba(0, 0, 0, 0.45)",
    colorTextQuaternary: "rgba(0, 0, 0, 0.25)",

    colorBorder: "#e2e8f0",
    colorBorderSecondary: "#f1f5f9",

    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,

    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
    boxShadowSecondary: "0 2px 12px rgba(0, 0, 0, 0.04)",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      bodyBg: "#f8fafc",
      siderBg: "#ffffff",
      footerBg: "#ffffff",
    },
    Menu: {
      itemBg: "transparent",
      subMenuItemBg: "transparent",
      itemSelectedBg: "rgba(124, 58, 237, 0.08)",
      itemHoverBg: "rgba(124, 58, 237, 0.04)",
    },
    Card: {
      colorBgContainer: "#ffffff",
      boxShadowTertiary: "0 2px 16px rgba(0, 0, 0, 0.04)",
    },
    Button: {
      primaryShadow: "0 2px 8px rgba(124, 58, 237, 0.2)",
    },
    Input: {
      colorBgContainer: "#ffffff",
      activeBorderColor: "#7c3aed",
      hoverBorderColor: "#8b5cf6",
    },
    Modal: {
      contentBg: "#ffffff",
      headerBg: "#ffffff",
    },
  },
};

export default darkTheme;
