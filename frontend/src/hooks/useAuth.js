/**
 * FitPlate - Auth Hook
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/useAuthStore";
import { authService } from "../services/authService";
import { toast } from "react-toastify";

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (res) => {
      const { user, token } = res.data;
      setAuth(user, token);
      toast.success("Giriş başarılı!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Giriş başarısız");
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (userData) => authService.register(userData),
    onSuccess: (res) => {
      const { user, token } = res.data;
      setAuth(user, token);
      toast.success("Kayıt başarılı!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Kayıt başarısız");
    },
  });
};

export const useProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authService.getProfile().then((res) => res.data),
    enabled: isAuthenticated,
  });
};
