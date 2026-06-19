/**
 * FitPlate - AI Coach Hook
 * Mock servislerle entegre çalışır, backend gerekmez.
 */
import { useMutation } from "@tanstack/react-query";
import { aiService } from "../services/aiService";
import { useUserStore } from "../stores/useUserStore";
import { toast } from "react-toastify";

export const useAnalyzeFood = () => {
  const addCalories = useUserStore((s) => s.addCalories);

  return useMutation({
    mutationFn: (data) => aiService.analyzeFood(data),
    onSuccess: (res) => {
      const { calories } = res.data;
      if (calories) addCalories(calories);
      toast.success(`Analiz tamamlandı: ~${calories} kcal`);
    },
    onError: () => {
      toast.error("Yemek analizi başarısız");
    },
  });
};

export const useAnalyzeFoodImage = () => {
  const addCalories = useUserStore((s) => s.addCalories);

  return useMutation({
    mutationFn: (file) => aiService.analyzeFoodImage(file),
    onSuccess: (res) => {
      const { calories } = res.data;
      if (calories) addCalories(calories);
      toast.success(`Fotoğraf analiz edildi: ~${calories} kcal`);
    },
    onError: () => {
      toast.error("Fotoğraf analizi başarısız");
    },
  });
};

export const useCoachComment = (postId) => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

export const useDailySummary = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};
