import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      mode: "dark", // varsayılan
      toggleMode: () =>
        set((state) => {
          const nextMode = state.mode === "dark" ? "light" : "dark";
          if (nextMode === "light") {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
          } else {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
          }
          return { mode: nextMode };
        }),
      setMode: (mode) =>
        set(() => {
          if (mode === "light") {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
          } else {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
          }
          return { mode };
        }),
    }),
    {
      name: "fitplate-theme-storage",
    }
  )
);
