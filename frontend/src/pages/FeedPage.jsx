/**
 * FitPlate - Feed Sayfası
 * Sosyal akış: besin takibi, etkileşim, koç yorumları
 * Veriler backend API'den çekilir
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Typography,
  Card,
  Progress,
  Tabs,
  Button,
  Tag,
  Avatar,
  Empty,
  Space,
  Divider,
  Input,
} from "antd";
import {
  FireOutlined,
  TrophyOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
  TeamOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import FeedComposer from "../components/feed/FeedComposer";
import FeedCard from "../components/feed/FeedCard";
import { useFeedStore } from "../stores/useFeedStore";
import { useUserStore } from "../stores/useUserStore";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useAnalyzeFoodImage } from "../hooks/useAICoach";
import {
  useCommentPost,
  useCreatePost,
  useDeletePost,
  useLikePost,
  useSupportPost,
  useUploadImage,
} from "../hooks/useFeed";
import {
  buildDietPlanPostContent,
  generatePersonalizedDietPlan,
  getTodayKey,
  isTimeReached,
} from "../utils/dietPlanGenerator";
import { toast } from "react-toastify";
import { aiService } from "../services/aiService";
import { useFriendStore } from "../stores/useFriendStore";
import { feedService } from "../services/feedService";
import { friendService } from "../services/friendService";
import { dietPlanService } from "../services/dietPlanService";
import { useNotificationStore } from "../stores/useNotificationStore";
import { userService } from "../services/userService";

import { getImageUrl } from "../../utils/helpers";

const { Title, Text, Paragraph } = Typography;

const DEMO_USERS = [];

/**
 * Backend'den gelen post verisini frontend formatına dönüştür
 */
const mapBackendPost = (post) => {
  let metadata = null;
  let coachComment = null;
  if (post.metadata) {
    try {
      metadata = typeof post.metadata === 'string' ? JSON.parse(post.metadata) : post.metadata;
      if (metadata && metadata.coachComment) {
        coachComment = metadata.coachComment;
      }
    } catch (e) {
      console.error("Error parsing post metadata", e);
    }
  }

  return {
    id: post.id,
    user: {
      id: String(post.user_id),
      name: post.user_name || "Anonim",
      avatar: getImageUrl(post.user_avatar),
    },
    content: post.content,
    image: getImageUrl(post.image_url),
    calories: null,
    macros: null,
    isLiked: post.is_liked || false,
    likeCount: Number(post.like_count) || 0,
    isSupported: post.is_supported || false,
    supportCount: Number(post.support_count) || 0,
    timeAgo: formatTimeAgo(post.created_at),
    comments: [],
    coachComment: coachComment,
    metadata: metadata,
  };
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} gün önce`;
};

const getPostUserId = (post) =>
  String(post?.user?.id || post?.user_id || post?.authorId || "");

export default function FeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storePosts = useFeedStore((s) => s.posts);
  const setPosts = useFeedStore((s) => s.setPosts);
  const addPost = useFeedStore((s) => s.addPost);
  const toggleSupportPost = useFeedStore((s) => s.toggleSupportPost);
  const dailyCaloriesConsumed = useUserStore((s) => s.dailyCaloriesConsumed);
  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);
  const coachPersona = useUserStore((s) => s.coachPersona);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const autoShareDietEnabled = useUserStore((s) => s.autoShareDietEnabled);
  const autoShareDietTime = useUserStore((s) => s.autoShareDietTime);
  const lastDietAutoShareDate = useUserStore((s) => s.lastDietAutoShareDate);
  const setLastDietAutoShareDate = useUserStore(
    (s) => s.setLastDietAutoShareDate,
  );
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const profiles = useFriendStore((s) => s.profiles);
  const friendIds = useFriendStore((s) => s.friendIds);
  const sentRequestIds = useFriendStore((s) => s.sentRequestIds);
  const receivedRequestIds = useFriendStore((s) => s.receivedRequestIds);
  const upsertProfiles = useFriendStore((s) => s.upsertProfiles);
  const initDemoFriendship = useFriendStore((s) => s.initDemoFriendship);
  const sendFriendRequest = useFriendStore((s) => s.sendFriendRequest);
  const cancelFriendRequest = useFriendStore((s) => s.cancelFriendRequest);
  const acceptFriendRequest = useFriendStore((s) => s.acceptFriendRequest);
  const declineFriendRequest = useFriendStore((s) => s.declineFriendRequest);
  const removeFriend = useFriendStore((s) => s.removeFriend);

  const analyzeFoodImage = useAnalyzeFoodImage();
  const createPost = useCreatePost();
  const uploadImage = useUploadImage();
  const likePost = useLikePost();
  const commentPost = useCommentPost();
  const supportPost = useSupportPost();
  const deletePostMutation = useDeletePost();

  const [activeTab, setActiveTab] = useState(
    location.pathname === "/discover" ? "discover" : "feed",
  );
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [backendFriendIds, setBackendFriendIds] = useState([]);
  const previousCoachRef = useRef(coachPersona);

  // Backend'den postları ve yorumlarını çek
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await feedService.getFeed();
        const backendPosts = (data?.posts || []).map(mapBackendPost);
        if (backendPosts.length > 0) {
          setPosts(backendPosts);

          // Her post için yorumları paralel olarak çek
          const commentResults = await Promise.allSettled(
            backendPosts.map((post) =>
              feedService.getComments(post.id).then((res) => ({
                postId: post.id,
                comments: res?.data?.comments || [],
              }))
            )
          );

          // Yorumları store'a yaz
          commentResults.forEach((result) => {
            if (result.status === "fulfilled" && result.value.comments.length > 0) {
              const { postId, comments } = result.value;
              const mappedComments = comments.map((c) => ({
                id: c.id,
                content: c.content,
                user: {
                  id: String(c.user_id),
                  name: c.user_name || "Kullanıcı",
                  avatar: getImageUrl(c.user_avatar),
                },
                timeAgo: formatTimeAgo(c.created_at),
                createdAt: c.created_at,
              }));
              useFeedStore.getState().updatePost(postId, { comments: mappedComments });
            }
          });
        }
      } catch {
        // Backend'e erişilemezse mevcut local veriyle devam et
      }
    };
    fetchPosts();
  }, [setPosts]);

  // Backend'den arkadaşları çek ve hem store'a hem local state'e yaz
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await friendService.getFriends();
        const friends = res?.data?.friends || [];
        const friendProfiles = friends.map((f) => ({
          id: String(f.id),
          name: f.name || f.ad || "Kullanıcı",
          avatar: f.avatar || null,
          bio: f.bio || "",
        }));
        if (friendProfiles.length > 0) {
          upsertProfiles(friendProfiles);
          friendProfiles.forEach((p) => {
            if (!useFriendStore.getState().friendIds.includes(p.id)) {
              useFriendStore.getState().addFriendDirectly(p);
            }
          });
        }
        // Local state'e yaz  filter anında geçerli olsun
        setBackendFriendIds(friendProfiles.map((p) => p.id));
      } catch {
        // sessizce devam; store'daki mevcut friendIds kullanılır
      }
    };
    fetchFriends();
  }, [upsertProfiles]);

  const posts = storePosts;
  const currentUserId = String(user?.id || "me");

  const normalizedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        user: {
          ...(post.user || {}),
          id: getPostUserId(post) || `ghost-${post.id}`,
        },
      })),
    [posts],
  );

  useEffect(() => {
    const currentUserProfile = {
      id: currentUserId,
      name: user?.name || "Sen",
      avatar: user?.avatar || null,
      bio: "FitPlate kullanıcısı",
    };

    const postProfiles = normalizedPosts.map((post) => ({
      id: post.user?.id,
      name: post.user?.name,
      avatar: post.user?.avatar || null,
    }));

    upsertProfiles([currentUserProfile, ...postProfiles]);
  }, [
    currentUserId,
    user,
    normalizedPosts,
    upsertProfiles,
  ]);

  useEffect(() => {
    setActiveTab(location.pathname === "/discover" ? "discover" : "feed");
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === "discover" ? "/discover" : "/feed");
  };

  // Akış: kendi + arkadaş gönderileri (backend'den yüklenen friendIds birleştirilir)
  const allFriendIds = useMemo(
    () => [...new Set([...friendIds, ...backendFriendIds])],
    [friendIds, backendFriendIds]
  );

  const feedPosts = useMemo(
    () =>
      normalizedPosts.filter((post) => {
        const id = String(post.user?.id || "");
        return id === currentUserId || allFriendIds.includes(id);
      }),
    [normalizedPosts, allFriendIds, currentUserId]
  );

  const discoverPosts = useMemo(
    () =>
      normalizedPosts.filter((post) => {
        const id = String(post.user?.id || "");
        return id !== currentUserId && !allFriendIds.includes(id);
      }),
    [normalizedPosts, allFriendIds, currentUserId],
  );

  const feedOtherPosts = useMemo(
    () =>
      normalizedPosts.filter((post) => {
        const id = String(post.user?.id || "");
        return id !== currentUserId && !friendIds.includes(id);
      }),
    [normalizedPosts, friendIds, currentUserId],
  );

  const discoverFriendPosts = useMemo(
    () =>
      normalizedPosts.filter((post) => {
        const id = String(post.user?.id || "");
        return id !== currentUserId && friendIds.includes(id);
      }),
    [normalizedPosts, friendIds, currentUserId],
  );

  const resolvedFeedFriendPosts = feedPosts;

  const profileList = useMemo(() => Object.values(profiles), [profiles]);

  const suggestedPeople = useMemo(
    () =>
      profileList.filter((profile) => {
        const id = String(profile.id || "");
        return (
          id &&
          id !== currentUserId &&
          !friendIds.includes(id) &&
          !receivedRequestIds.includes(id)
        );
      }),
    [profileList, currentUserId, friendIds, receivedRequestIds],
  );

  const normalizedSearchTerm = useMemo(
    () => friendSearchTerm.trim().toLocaleLowerCase("tr-TR"),
    [friendSearchTerm],
  );

  const searchablePeople = useMemo(
    () =>
      profileList.filter((profile) => {
        const id = String(profile.id || "");
        return id && id !== currentUserId && !friendIds.includes(id);
      }),
    [profileList, currentUserId, friendIds],
  );

  const searchedPeople = useMemo(() => {
    if (!normalizedSearchTerm) return [];

    return searchablePeople.filter((profile) => {
      const name = String(profile.name || "").toLocaleLowerCase("tr-TR");
      const bio = String(profile.bio || "").toLocaleLowerCase("tr-TR");
      return (
        name.includes(normalizedSearchTerm) ||
        bio.includes(normalizedSearchTerm)
      );
    });
  }, [searchablePeople, normalizedSearchTerm]);

  // Backend'den kullanıcı arama
  const [backendSearchResults, setBackendSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!normalizedSearchTerm || normalizedSearchTerm.length < 2) {
      setBackendSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await userService.searchUsers(normalizedSearchTerm);
        const remoteUsers = (data?.users || []).map((u) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          avatar: null,
          bio: u.coach_persona
            ? `Koç: ${u.coach_persona}`
            : "FitPlate kullanıcısı",
        }));
        // Local'de zaten bulunan profillerle çakışmaları çıkar
        const localIds = new Set(searchedPeople.map((p) => String(p.id)));
        const uniqueRemote = remoteUsers.filter(
          (u) => !localIds.has(u.id) && u.id !== currentUserId,
        );
        setBackendSearchResults(uniqueRemote);
        // Profil store'a da ekle ki arkadaşlık işlemleri çalışsın
        if (uniqueRemote.length > 0) {
          upsertProfiles(uniqueRemote);
        }
      } catch {
        setBackendSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [normalizedSearchTerm, searchedPeople, currentUserId, upsertProfiles]);

  // Local + Backend sonuçlarını birleştir
  const combinedSearchResults = useMemo(() => {
    const localResults = searchedPeople;
    const allResults = [...localResults, ...backendSearchResults];
    // Benzersiz ID'lere göre filtrele
    const seen = new Set();
    return allResults.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [searchedPeople, backendSearchResults]);

  const incomingRequests = useMemo(
    () => receivedRequestIds.map((id) => profiles[id]).filter(Boolean),
    [receivedRequestIds, profiles],
  );

  const friends = useMemo(
    () => friendIds.map((id) => profiles[id]).filter(Boolean),
    [friendIds, profiles],
  );

  const caloriePercent = Math.min(
    Math.round((dailyCaloriesConsumed / dailyCalorieGoal) * 100),
    100,
  );

  const pushNotification = useCallback(
    (payload) => {
      if (!notificationsEnabled) return;
      addNotification(payload);
    },
    [notificationsEnabled, addNotification],
  );

  const todayDietPlan = useMemo(
    () =>
      generatePersonalizedDietPlan({
        coachPersona,
        dailyCalorieGoal,
      }),
    [coachPersona, dailyCalorieGoal],
  );

  const createLocalPost = (payload) => {
    const localPost = {
      id: Date.now(),
      user: {
        id: currentUserId,
        name: user?.name || "Sen",
        avatar: user?.avatar || null,
      },
      content: payload.content,
      image: payload.image || null,
      calories: payload.calories || null,
      macros: payload.macros || null,
      isLiked: false,
      likeCount: 0,
      isSupported: false,
      supportCount: 0,
      timeAgo: "Az önce",
      comments: [],
      coachComment: payload.coachComment || null,
      metadata: payload.metadata || null,
    };
    addPost(localPost);
  };

  const publishPost = async (payload, options = {}) => {
    const { ensureVisibleInFeed = false } = options;

    let createdPost = null;

    if (ensureVisibleInFeed) {
      createLocalPost(payload);
      try {
        const res = await feedService.createPost(payload);
        createdPost = res?.data?.post || res?.data;
      } catch {
        toast.info("Sunucuya erişilemedi, gönderi yerelde kaydedildi.");
      }
    } else {
      try {
        const res = await createPost.mutateAsync(payload);
        createdPost = res?.data?.post || res?.data;
      } catch {
        createLocalPost(payload);
        toast.info("Sunucuya erişilemedi, gönderi yerelde kaydedildi.");
      }
    }

    // AI Koç yorumunu tetikle (Eğer resim varsa)
    if (createdPost && createdPost.id && (payload.photo_base64 || payload.image_url)) {
      const imgUrlForAi = createdPost.image_url;
      if (imgUrlForAi) {
        toast.info("Koç fotoğrafını inceliyor...");
        aiService.generateCoachCommentForFeed(createdPost.id, imgUrlForAi, coachPersona)
          .then(() => {
            // Yorum eklendikten sonra feed'i güncelle
            queryClient.invalidateQueries({ queryKey: ["feed"] });
          })
          .catch((err) => {
             console.error("AI yorum üretemedi", err);
          });
      }
    }

    return createdPost;
  };

  const handleSubmit = async (data) => {
    const baseContent = data.content?.trim();

    if (data.mode === "photo" && data.image) {
      // Dosyayı base64'e çevir
      let base64Image = null;
      try {
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(data.image);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      } catch (err) {
        console.error("Fotoğraf dönüştürme hatası:", err);
      }

      let analyzedData = {};
      try {
        const analysisRes = await analyzeFoodImage.mutateAsync(base64Image);
        analyzedData = analysisRes?.data || {};
      } catch {
        analyzedData = {};
      }

      const calories = analyzedData.calories ?? null;
      const macros = analyzedData.macros || null;
      await publishPost({
        content: baseContent || "",
        photo_base64: base64Image,
        image: data.imagePreview || base64Image,
        image_url: null, // Sunucuya gereksiz base64 göndermemek için
        visibility: data.visibility || "public",
        calories,
        macros,
        metadata: {
          type: "food_analysis",
          progress: buildProgressMeta(
            dailyCaloriesConsumed + (Number(calories) || 0),
          ),
        },
      });

      pushNotification({
        type: "interaction",
        title: "Fotoğraf analizi paylaşıldı",
        message: "Kalori ve makro analizi içeren gönderin akışa eklendi.",
        actionPath: "/feed",
      });
      return;
    }

    await publishPost({
      content: baseContent,
      visibility: data.visibility || "public",
    });

    pushNotification({
      type: "interaction",
      title: "Yeni gönderin yayınlandı",
      message: "Topluluk akışında görünür durumda.",
      actionPath: "/feed",
    });
  };

  const handleLike = (postId, isLiked) => {
    likePost.mutate({ postId, isLiked });

    if (!isLiked) {
      pushNotification({
        type: "interaction",
        title: "Beğeni gönderildi",
        message: "Gönderiyi beğendin. Güzel destek!",
        actionPath: "/feed",
      });
    }
  };

  const handleComment = (postId, content) => {
    commentPost.mutate({ postId, content });

    if (content?.trim()) {
      pushNotification({
        type: "interaction",
        title: "Yorumun paylaşıldı",
        message: "Yorumun gönderi altında yayınlandı.",
        actionPath: "/feed",
      });
    }
  };

  const handleSupport = (postId) => {
    const post = storePosts.find((p) => p.id === postId);
    supportPost.mutate({ postId, isSupported: post?.isSupported || false });
    pushNotification({
      type: "interaction",
      title: "Destek verdin",
      message: "Gönderiye motivasyon desteği eklendi.",
      actionPath: "/feed",
    });
  };

  const handleDeletePost = (postId) => {
    deletePostMutation.mutate(postId);
  };

  const buildProgressMeta = (consumed = dailyCaloriesConsumed) => ({
    consumed,
    goal: dailyCalorieGoal,
    percent: Math.min(Math.round((consumed / dailyCalorieGoal) * 100), 100),
  });

  const handleAddFriendFromPost = async (postUser) => {
    if (!postUser?.id) return;
    const profile = {
      id: String(postUser.id),
      name: postUser.name,
      avatar: postUser.avatar || null,
    };

    sendFriendRequest(profile);
    toast.success("Arkadaşlık isteği gönderildi.");
    try {
      await friendService.sendRequest(Number(postUser.id));
    } catch {
      // Backend'e erişilemezse local state yeterli
    }
    pushNotification({
      type: "friend",
      title: "Arkadaşlık isteği gönderildi",
      message: `${postUser.name || "Kullanıcı"} kişisine istek gönderildi.`,
      actionPath: "/discover",
    });
  };

  const handleSendFriendRequest = async (profile) => {
    if (!profile?.id) return;
    sendFriendRequest(profile);
    toast.success("Arkadaşlık isteği gönderildi.");
    try {
      await friendService.sendRequest(Number(profile.id));
    } catch {
      // Backend'e erişilemezse local state yeterli
    }
    pushNotification({
      type: "friend",
      title: "Arkadaşlık isteği gönderildi",
      message: `${profile.name || "Kullanıcı"} kişisine istek gönderildi.`,
      actionPath: "/discover",
    });
  };

  const handleRemoveFriendFromPost = async (postUser) => {
    if (!postUser?.id) return;
    removeFriend(String(postUser.id));
    toast.info(
      `${postUser.name || "Kullanıcı"} arkadaş listesinden çıkarıldı.`,
    );
    try {
      await friendService.removeFriend(Number(postUser.id));
    } catch {
      // Backend'e erişilemezse local state yeterli
    }
    pushNotification({
      type: "friend",
      title: "Arkadaşlıktan çıkarıldı",
      message: `${postUser.name || "Kullanıcı"} artık arkadaş listende değil.`,
      actionPath: "/discover",
    });
  };

  const handleAcceptFriendRequest = async (profile) => {
    acceptFriendRequest(profile.id);
    try {
      await friendService.acceptRequest(Number(profile.request_id || profile.id));
    } catch {
      // Backend'e erişilemezse local state yeterli
    }
    pushNotification({
      type: "friend",
      title: "Arkadaşlık isteği kabul edildi",
      message: `${profile.name || "Kullanıcı"} artık arkadaş listende.`,
      actionPath: "/feed",
    });
  };

  const handleDeclineFriendRequest = async (profile) => {
    declineFriendRequest(profile.id);
    try {
      await friendService.declineRequest(Number(profile.request_id || profile.id));
    } catch {
      // Backend'e erişilemezse local state yeterli
    }
    pushNotification({
      type: "friend",
      title: "İstek reddedildi",
      message: `${profile.name || "Kullanıcı"} isteği reddedildi.`,
      actionPath: "/discover",
    });
  };

  const shareCoachDietPlan = useCallback(
    async (isAuto = false) => {
      let plan = generatePersonalizedDietPlan({
        coachPersona,
        dailyCalorieGoal,
      });

      try {
        const res = await aiService.getPersonalizedDietPlan({
          coachPersona,
          dailyCalorieGoal,
        });
        const data = res?.data;
        const meals = Array.isArray(data?.meals)
          ? data.meals.map((meal, idx) => ({
              name: meal.name || meal.title || `Öğün ${idx + 1}`,
              targetCalories: Number(meal.targetCalories || meal.calories) || 0,
              menu: meal.menu || meal.description || "",
            }))
          : plan.meals;

        plan = {
          coach: {
            coachName: data?.coachName || plan.coach.coachName,
            color: data?.coachColor || plan.coach.color,
            intro: data?.intro || plan.coach.intro,
          },
          totalCalories: Number(data?.totalCalories) || plan.totalCalories,
          meals,
        };
      } catch {
        // Endpoint yoksa fallback plan kullanılacak
      }

      await publishPost(
        {
          content: buildDietPlanPostContent(plan),
          calories: plan.totalCalories,
          coachComment: {
            coachName: plan.coach.coachName,
            color: plan.coach.color,
            text: isAuto
              ? "Günlük planını otomatik olarak akışta paylaştım. Takip etmeyi unutma."
              : "Planını paylaşman harika! Bugün buna sadık kalırsak hedefe yakınız.",
          },
          metadata: {
            type: "coach_diet_plan",
            autoShared: isAuto,
            progress: buildProgressMeta(),
          },
        },
        { ensureVisibleInFeed: true },
      );

      const today = getTodayKey();
      setLastDietAutoShareDate(today);

      // Diyet planını DB'ye kaydet
      try {
        await dietPlanService.createPlan({
          coach_persona: coachPersona,
          total_calories: plan.totalCalories,
          meals: plan.meals,
        });
      } catch {
        // Backend'e erişilemezse sessizce devam et
      }

      toast.success(
        isAuto
          ? "Koç diyet listesi otomatik paylaşıldı."
          : "Koç diyet listesi paylaşıldı.",
      );

      pushNotification({
        type: "coach",
        title: isAuto
          ? "Koç planı otomatik paylaşıldı"
          : "Koç planı paylaşıldı",
        message: `${plan.coach.coachName} koçunun güncel diyet planı akışa eklendi.`,
        actionPath: "/feed",
      });
    },
    [
      coachPersona,
      dailyCalorieGoal,
      setLastDietAutoShareDate,
      pushNotification,
    ],
  );

  useEffect(() => {
    pushNotification({
      type: "system",
      title: "Bildirim merkezi aktif",
      message:
        "Arkadaşlık, etkileşim, koç planı ve hedef ilerleme güncellemelerini burada görebilirsin.",
      actionPath: "/notifications",
      dedupeKey: "notifications-welcome",
    });
  }, [pushNotification]);

  useEffect(() => {
    incomingRequests.forEach((profile) => {
      if (!profile?.id) return;
      pushNotification({
        type: "friend",
        title: "Yeni arkadaşlık isteği",
        message: `${profile.name || "Bir kullanıcı"} seni arkadaş olarak eklemek istiyor.`,
        actionPath: "/discover",
        dedupeKey: `incoming-request-${profile.id}`,
      });
    });
  }, [incomingRequests, pushNotification]);

  useEffect(() => {
    if (caloriePercent < 90) return;

    pushNotification({
      type: "progress",
      title: "Hedefe çok yakınsın",
      message: `${dailyCaloriesConsumed}/${dailyCalorieGoal} kcal ile bugün hedefinin %${caloriePercent} seviyesindesin.`,
      actionPath: "/stats",
      dedupeKey: `goal-90-${getTodayKey()}`,
    });
  }, [
    caloriePercent,
    dailyCaloriesConsumed,
    dailyCalorieGoal,
    pushNotification,
  ]);

  useEffect(() => {
    if (!autoShareDietEnabled) return;

    const maybeAutoShare = () => {
      const today = getTodayKey();
      if (lastDietAutoShareDate === today) return;
      if (!isTimeReached(autoShareDietTime)) return;
      void shareCoachDietPlan(true);
    };

    maybeAutoShare();
    const timer = window.setInterval(maybeAutoShare, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [
    autoShareDietEnabled,
    autoShareDietTime,
    lastDietAutoShareDate,
    shareCoachDietPlan,
  ]);

  useEffect(() => {
    if (!autoShareDietEnabled) {
      previousCoachRef.current = coachPersona;
      return;
    }

    if (previousCoachRef.current !== coachPersona) {
      previousCoachRef.current = coachPersona;
      void shareCoachDietPlan(true);
      toast.info("Koç değişti. Yeni koç için diyet listesi oluşturuldu.");
    }
  }, [coachPersona, autoShareDietEnabled, shareCoachDietPlan]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: "feed", label: " Akış" },
          { key: "discover", label: " Keşfet" },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* ===== AKIŞ SEKMESI: Kendi + Arkadaş Gönderileri ===== */}
      {activeTab === "feed" && (
        <>
          <FeedComposer
            onSubmit={handleSubmit}
            isLoading={
              createPost.isPending ||
              uploadImage.isPending ||
              analyzeFoodImage.isPending
            }
          />

          {feedPosts.length === 0 ? (
            <Card
              style={{
                background: "var(--bg-container)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                marginTop: 8,
              }}
            >
              <Empty
                description={
                  <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                    Akışta henüz gönderi yok. Arkadaş edinmek için
                    Keşfet sekmesine göz at!
                  </Text>
                }
              />
            </Card>
          ) : (
            feedPosts.map((post, index) => {
              const postUserId = String(post.user?.id || "");
              const isOwnPost = postUserId === currentUserId;
              const isFriendPost = friendIds.includes(postUserId);
              const requestSent = sentRequestIds.includes(postUserId);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.3 }}
                >
                  <FeedCard
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onSupport={handleSupport}
                    isOwnPost={isOwnPost}
                    isFriend={isFriendPost}
                    requestSent={requestSent}
                    onAddFriend={handleAddFriendFromPost}
                    onRemoveFriend={handleRemoveFriendFromPost}
                    onDelete={handleDeletePost}
                  />
                </motion.div>
              );
            })
          )}
        </>
      )}

      {/* ===== KEŞFET SEKMESI: Arkadaş Olmayan Kullanıcılar ===== */}
      {activeTab === "discover" && (
        <>
          {/* Arama */}
          <Card
            style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
              border: "1px solid rgba(124,58,237,0.15)",
              borderRadius: 16,
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Title level={4} style={{ color: "#fff", margin: "0 0 4px" }}>
              <CompassOutlined style={{ marginRight: 8, color: "#a78bfa" }} />
              Keşfet
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              Topluluktan diğer kullanıcıları gör, arkadaşlık isteği gönder.
            </Text>
            <Input.Search
              value={friendSearchTerm}
              onChange={(e) => setFriendSearchTerm(e.target.value)}
              onSearch={(v) => setFriendSearchTerm(v)}
              placeholder="Kullanıcı adı veya bio ile ara"
              allowClear
              enterButton="Ara"
              style={{ marginTop: 12 }}
            />
          </Card>

          {/* Arama Sonuçları */}
          {normalizedSearchTerm && (
            <Card
              style={{
                marginBottom: 16,
                background: "var(--bg-container)",
                border: "1px solid rgba(124,58,237,0.12)",
                borderRadius: 16,
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Text strong style={{ color: "#fff" }}>
                Arama Sonuçları ({combinedSearchResults.length})
                {isSearching && " ⏳"}
              </Text>
              <Divider style={{ borderColor: "rgba(255,255,255,0.08)", margin: "12px 0" }} />
              {combinedSearchResults.length === 0 ? (
                <Empty
                  description={
                    <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                      Kullanıcı bulunamadı.
                    </Text>
                  }
                />
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  {combinedSearchResults.map((profile) => {
                    const isSent = sentRequestIds.includes(profile.id);
                    const isFriend = friendIds.includes(profile.id);
                    return (
                      <div
                        key={`search-${profile.id}`}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
                      >
                        <Space>
                          <Avatar src={profile.avatar}>{profile.name?.[0] || "K"}</Avatar>
                          <div>
                            <Text style={{ color: "#fff" }}>{profile.name}</Text>
                            <br />
                            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                              {profile.bio || "FitPlate kullanıcısı"}
                            </Text>
                          </div>
                        </Space>
                        {isFriend ? (
                          <Tag color="green" style={{ borderRadius: 12, margin: 0 }}>Arkadaşın</Tag>
                        ) : isSent ? (
                          <Button onClick={() => cancelFriendRequest(profile.id)} icon={<CloseOutlined />} style={{ borderRadius: 10 }}>
                            İsteği Geri Al
                          </Button>
                        ) : (
                          <Button type="primary" icon={<UserAddOutlined />} onClick={() => handleSendFriendRequest(profile)} style={{ borderRadius: 10 }}>
                            Arkadaş Ekle
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </Space>
              )}
            </Card>
          )}

          {/* Gönderiler */}
          {discoverPosts.length === 0 ? (
            <Card
              style={{
                background: "var(--bg-container)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
              }}
            >
              <Empty
                description={
                  <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                    Keşfedilecek gönderi yok. Herkes arkadaşın olmuş olabilir!
                  </Text>
                }
              />
            </Card>
          ) : (
            discoverPosts.map((post, index) => {
              const postUserId = String(post.user?.id || "");
              const isOwnPost = postUserId === currentUserId;
              const isFriendPost = friendIds.includes(postUserId);
              const requestSent = sentRequestIds.includes(postUserId);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.28 }}
                >
                  <FeedCard
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onSupport={handleSupport}
                    isOwnPost={isOwnPost}
                    isFriend={isFriendPost}
                    requestSent={requestSent}
                    onAddFriend={handleAddFriendFromPost}
                    onRemoveFriend={handleRemoveFriendFromPost}
                    onDelete={handleDeletePost}
                  />
                </motion.div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
