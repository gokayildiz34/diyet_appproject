/**
 * FitPlate - Feed Hook
 * Backend API servisleriyle entegre çalışır.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "../services/feedService";
import { useFeedStore } from "../stores/useFeedStore";
import { toast } from "react-toastify";

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const addPost = useFeedStore((s) => s.addPost);

  return useMutation({
    mutationFn: (data) => feedService.createPost(data),
    onSuccess: (res) => {
      const post = res?.data?.post || res?.data;
      if (post) addPost(post);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Gönderi paylaşıldı!");
    },
    onError: () => {
      toast.error("Gönderi paylaşılamadı");
    },
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: (file) => feedService.uploadImage(file),
  });
};

export const useLikePost = () => {
  const toggleLikePost = useFeedStore((s) => s.toggleLikePost);

  return useMutation({
    mutationFn: ({ postId, isLiked }) =>
      isLiked ? feedService.unlikePost(postId) : feedService.likePost(postId),
    onMutate: ({ postId }) => {
      toggleLikePost(postId);
    },
    onError: (_, { postId }) => {
      toggleLikePost(postId);
    },
  });
};

export const useCommentPost = () => {
  const addCommentToPost = useFeedStore((s) => s.addCommentToPost);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }) =>
      feedService.commentPost(postId, { content }),
    onSuccess: (res, { postId }) => {
      const comment = res?.data?.comment || res?.data;
      if (comment) addCommentToPost(postId, comment);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useSupportPost = () => {
  const toggleSupportPost = useFeedStore((s) => s.toggleSupportPost);

  return useMutation({
    mutationFn: ({ postId, isSupported }) =>
      isSupported
        ? feedService.unsupportPost(postId)
        : feedService.supportPost(postId),
    onMutate: ({ postId }) => {
      toggleSupportPost(postId);
    },
    onError: (_, { postId }) => {
      toggleSupportPost(postId);
    },
  });
};

export const useDeletePost = () => {
  const removePost = useFeedStore((s) => s.removePost);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => feedService.deletePost(postId),
    onSuccess: (_, postId) => {
      removePost(postId);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Gönderi silindi.");
    },
    onError: () => {
      toast.error("Gönderi silinemedi.");
    },
  });
};
