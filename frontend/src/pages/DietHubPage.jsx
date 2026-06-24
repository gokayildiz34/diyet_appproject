/**
 * FitPlate - Diyet Merkezi
 * Beslenme takibi, koç diyet planı ve ilerleme paylaşımı
 */
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  Typography,
  Progress,
  Button,
  Tag,
  Divider,
  Space,
} from "antd";
import {
  FireOutlined,
  TrophyOutlined,
  RobotOutlined,
  RiseOutlined,
  ArrowRightOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { feedService } from "../services/feedService";
import { aiService } from "../services/aiService";
import { dietPlanService } from "../services/dietPlanService";
import {
  buildDietPlanPostContent,
  generatePersonalizedDietPlan,
  getTodayKey,
} from "../utils/dietPlanGenerator";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function DietHubPage() {
  const navigate = useNavigate();

  const dailyCaloriesConsumed = useUserStore((s) => s.dailyCaloriesConsumed);
  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);
  const coachPersona = useUserStore((s) => s.coachPersona);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const setLastDietAutoShareDate = useUserStore((s) => s.setLastDietAutoShareDate);

  const addNotification = useNotificationStore((s) => s.addNotification);

  const [sharingDiet, setSharingDiet] = useState(false);
  const [sharingProgress, setSharingProgress] = useState(false);

  const caloriePercent = Math.min(
    Math.round((dailyCaloriesConsumed / dailyCalorieGoal) * 100),
    100
  );

  const todayDietPlan = useMemo(
    () => generatePersonalizedDietPlan({ coachPersona, dailyCalorieGoal }),
    [coachPersona, dailyCalorieGoal]
  );

  const pushNotif = useCallback(
    (payload) => {
      if (notificationsEnabled) addNotification(payload);
    },
    [notificationsEnabled, addNotification]
  );

  const handleShareDietPlan = async () => {
    setSharingDiet(true);
    try {
      let plan = generatePersonalizedDietPlan({ coachPersona, dailyCalorieGoal });
      try {
        const res = await aiService.getPersonalizedDietPlan({ coachPersona, dailyCalorieGoal });
        const d = res?.data;
        if (d) {
          const meals = Array.isArray(d.meals)
            ? d.meals.map((m, i) => ({
                name: m.name || m.title || `Öğün ${i + 1}`,
                targetCalories: Number(m.targetCalories || m.calories) || 0,
                menu: m.menu || m.description || "",
              }))
            : plan.meals;
          plan = {
            coach: {
              coachName: d.coachName || plan.coach.coachName,
              color: d.coachColor || plan.coach.color,
              intro: d.intro || plan.coach.intro,
            },
            totalCalories: Number(d.totalCalories) || plan.totalCalories,
            meals,
          };
        }
      } catch { /* AI yoksa fallback */ }

      await feedService.createPost({
        content: buildDietPlanPostContent(plan),
        calories: plan.totalCalories,
        metadata: { type: "coach_diet_plan" },
      });

      try {
        await dietPlanService.createPlan({
          coach_persona: coachPersona,
          total_calories: plan.totalCalories,
          meals: plan.meals,
        });
      } catch { /* sessizce devam */ }

      setLastDietAutoShareDate(getTodayKey());
      toast.success("Koç diyet planı akışa paylaşıldı!");
      pushNotif({
        type: "coach",
        title: "Koç planı paylaşıldı",
        message: `${plan.coach.coachName} koçunun planı akışa eklendi.`,
        actionPath: "/feed",
      });
    } catch {
      toast.error("Paylaşım sırasında hata oluştu.");
    } finally {
      setSharingDiet(false);
    }
  };

  const handleShareProgress = async () => {
    setSharingProgress(true);
    try {
      await feedService.createPost({
        content: `Bugünkü diyet ilerlemem: ${dailyCaloriesConsumed}/${dailyCalorieGoal} kcal (%${caloriePercent}). Hedefime devam! `,
        metadata: {
          type: "diet_progress",
          progress: { consumed: dailyCaloriesConsumed, goal: dailyCalorieGoal, percent: caloriePercent },
        },
      });
      toast.success("İlerleme akışa paylaşıldı!");
      pushNotif({
        type: "progress",
        title: "İlerleme paylaşıldı",
        message: `%${caloriePercent} tamamlandı paylaşımın akışa eklendi.`,
        actionPath: "/feed",
      });
    } catch {
      toast.error("Paylaşım sırasında hata oluştu.");
    } finally {
      setSharingProgress(false);
    }
  };

  const statusColor = caloriePercent >= 90 ? "#ef4444" : caloriePercent >= 60 ? "#10b981" : "#a78bfa";
  const statusLabel = caloriePercent >= 90 ? " Sınırda" : caloriePercent >= 60 ? "Üç& İyi gidiyorsun" : " Devam et";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Sayfa Başlığı */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{
            background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
            fontWeight: 800,
            letterSpacing: -0.5,
          }}
        >
           Diyet Merkezi
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Günlük beslenme takibi ve koç planları
        </Text>
      </motion.div>

      {/* ===== BUGÜçNKÜç BESLENMENİZ ===== */}
      <motion.div {...fadeUp(0.05)}>
        <Card
          styles={{ body: { padding: 24 } }}
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #1a1025 0%, #16213e 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Bugünkü Beslenmeniz
              </Text>
              <Title level={3} style={{ color: "#fff", margin: "6px 0 0" }}>
                <FireOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
                {dailyCaloriesConsumed} / {dailyCalorieGoal} kcal
              </Title>
              <Text style={{ color: statusColor, fontSize: 13, fontWeight: 600 }}>
                {statusLabel}
              </Text>
            </div>
            <Progress
              type="circle"
              percent={caloriePercent}
              size={84}
              strokeColor={{ "0%": "#7c3aed", "100%": caloriePercent > 90 ? "#ef4444" : "#10b981" }}
              trailColor="rgba(255,255,255,0.06)"
              format={(p) => (
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>%{p}</Text>
              )}
            />
          </div>

          <Divider style={{ borderColor: "rgba(255,255,255,0.06)", margin: "18px 0" }} />

          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Kalan", value: `${Math.max(dailyCalorieGoal - dailyCaloriesConsumed, 0)} kcal`, color: "#10b981" },
              { label: "Harcanan", value: `${dailyCaloriesConsumed} kcal`, color: "#a78bfa" },
              { label: "Seri", value: <><TrophyOutlined style={{ marginRight: 4 }} />1 gün</>, color: "#f59e0b" },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, display: "block", marginBottom: 4 }}>
                  {item.label}
                </Text>
                <Text strong style={{ color: item.color, fontSize: 16 }}>
                  {item.value}
                </Text>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate("/food-log")}
              style={{ borderRadius: 8, color: "#a78bfa", borderColor: "rgba(124,58,237,0.3)" }}
            >
              Yemek Kaydına Git
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ===== KOÇ DİYET LİSTESİ ===== */}
      <motion.div {...fadeUp(0.1)}>
        <Card
          styles={{ body: { padding: 20 } }}
          style={{
            marginBottom: 16,
            background: "linear-gradient(145deg, var(--bg-container), #16213e)",
            border: "1px solid rgba(124,58,237,0.12)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <Space align="center" style={{ marginBottom: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "rgba(124,58,237,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a78bfa",
                  }}
                >
                  <RobotOutlined />
                </div>
                <Text strong style={{ color: "#fff", fontSize: 15 }}>
                  Koç Diyet Listesi
                </Text>
              </Space>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "block", marginBottom: 10 }}>
                Bugün için hedef:{" "}
                <strong style={{ color: "#a78bfa" }}>{todayDietPlan.totalCalories} kcal</strong>
              </Text>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {todayDietPlan.meals.map((meal) => (
                  <Tag key={meal.name} color="purple" style={{ borderRadius: 20, fontSize: 12 }}>
                    {meal.name}: {meal.targetCalories} kcal
                  </Tag>
                ))}
              </div>
            </div>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleShareDietPlan}
              loading={sharingDiet}
              style={{ borderRadius: 10, whiteSpace: "nowrap" }}
            >
              Akışa Paylaş
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ===== DİYET İLERLEMENİ PAYLAŞ ===== */}
      <motion.div {...fadeUp(0.15)}>
        <Card
          styles={{ body: { padding: 20 } }}
          style={{
            marginBottom: 16,
            background: "linear-gradient(145deg, var(--bg-container), #16213e)",
            border: "1px solid rgba(16,185,129,0.18)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Space align="center" style={{ marginBottom: 6 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "rgba(16,185,129,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981",
                  }}
                >
                  <RiseOutlined />
                </div>
                <Text strong style={{ color: "#fff", fontSize: 15 }}>
                  Diyet İlerlemeni Paylaş
                </Text>
              </Space>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "block" }}>
                Bugün:{" "}
                <strong style={{ color: "#10b981" }}>
                  {dailyCaloriesConsumed}/{dailyCalorieGoal} kcal
                </strong>{" "}
                <span style={{ color: "rgba(255,255,255,0.3)" }}>(%{caloriePercent})</span>
              </Text>
            </div>
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={handleShareProgress}
              loading={sharingProgress}
              style={{
                borderRadius: 10,
                whiteSpace: "nowrap",
                background: "linear-gradient(135deg, #059669, #10b981)",
                borderColor: "transparent",
              }}
            >
              İlerlemeni Paylaş
            </Button>
          </div>
        </Card>
      </motion.div>

    </div>
  );
}
