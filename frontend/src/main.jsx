/**
 * FitPlate - Entry Point
 * Providers: Ant Design Theme, React Query, Toastify
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import { ToastContainer } from "react-toastify";
import trTR from "antd/locale/tr_TR";

import App from "./App.jsx";
import fitPlateTheme from "./styles/theme.js";
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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          ...fitPlateTheme,
          algorithm: theme.darkAlgorithm,
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
          theme="dark"
          toastStyle={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
          }}
        />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
