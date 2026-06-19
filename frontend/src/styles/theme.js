/**
 * FitPlate - Ant Design Theme Configuration
 * Dark, premium aesthetic with ghost-inspired palette
 */

const fitPlateTheme = {
  token: {
    // Primary Colors
    colorPrimary: "#7c3aed", // Violet
    colorPrimaryBg: "#1a1025", // Deep purple-black
    colorPrimaryBgHover: "#2d1b4e",
    colorPrimaryBorder: "#5b21b6",
    colorPrimaryHover: "#8b5cf6",
    colorPrimaryActive: "#6d28d9",
    colorPrimaryText: "#a78bfa",
    colorPrimaryTextHover: "#c4b5fd",
    colorPrimaryTextActive: "#8b5cf6",

    // Background Colors
    colorBgContainer: "#1a1a2e",
    colorBgElevated: "#16213e",
    colorBgLayout: "#0f0f1a",
    colorBgSpotlight: "#1a1025",

    // Text Colors
    colorText: "rgba(255, 255, 255, 0.92)",
    colorTextSecondary: "rgba(255, 255, 255, 0.65)",
    colorTextTertiary: "rgba(255, 255, 255, 0.45)",
    colorTextQuaternary: "rgba(255, 255, 255, 0.25)",

    // Border
    colorBorder: "rgba(255, 255, 255, 0.08)",
    colorBorderSecondary: "rgba(255, 255, 255, 0.06)",

    // Functional Colors
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    // Typography
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,

    // Border Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Spacing
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Box Shadow
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

export default fitPlateTheme;
