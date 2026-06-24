/**
 * FitPlate - Entry Point
 * Providers: Ant Design Theme, React Query, Toastify
 */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antTheme } from "antd";
import { ToastContainer } from "react-toastify";
import trTR from "antd/locale/tr_TR";

import App from "./App.jsx";
import { darkTheme, lightTheme } from "./styles/theme.js";
import { useThemeStore } from "./stores/useThemeStore.js";
import appLogo from "./assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";
import { initOneSignal } from "./services/oneSignalService";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

initOneSignal();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 dakika
      refetchOnWindowFocus: false,
    },
  },
});

const faviconLink =
  document.querySelector("link[rel='icon']") || document.createElement("link");
faviconLink.setAttribute("rel", "icon");
faviconLink.setAttribute("type", "image/png");
faviconLink.setAttribute("href", appLogo);
if (!faviconLink.parentNode) {
  document.head.appendChild(faviconLink);
}

// Wrapper to use theme state
const RootApp = () => {
  const mode = useThemeStore((state) => state.mode);
  
  // Set initial body class
  useEffect(() => {
    if (mode === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
  }, [mode]);

  const currentTheme = mode === "light" ? lightTheme : darkTheme;
  const currentAlgorithm = mode === "light" ? antTheme.defaultAlgorithm : antTheme.darkAlgorithm;

  return (
    <ConfigProvider
      theme={{
        ...currentTheme,
        algorithm: currentAlgorithm,
      }}
      locale={trTR}
    >
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme={mode}
        toastStyle={{
          background: "var(--bg-container)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          borderRadius: 12,
        }}
      />
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RootApp />
    </QueryClientProvider>
  </StrictMode>
);
