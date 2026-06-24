/**
 * FitPlate - Koçlar Sayfası
 * Premium kullanıcılar koç seçer, sohbet eder, diyet planı üretip akışta paylaşır.
 */
import { useMemo, useState } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Avatar,
  Space,
  Button,
  Input,
  Divider,
  Tag,
  Empty,
} from "antd";
import {
  CrownOutlined,
  SendOutlined,
  CheckOutlined,
  RobotOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserStore } from "../stores/useUserStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useFeedStore } from "../stores/useFeedStore";
import { aiService } from "../services/aiService";
import { feedService } from "../services/feedService";
import { dietPlanService } from "../services/dietPlanService";
import {
  buildDietPlanPostContent,
  generatePersonalizedDietPlan,
} from "../utils/dietPlanGenerator";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const coachOptions = [
  {
    key: "demir",
    name: "Demir",
    subtitle: "Sert & Disiplinli",
    color: "#ef4444",
    welcome:
      "Hedef net: disiplini bozma. Bana gününü yaz, net bir plan çıkarayım.",
  },
  {
    key: "ipek",
    name: "İpek",
    subtitle: "Nazik & Destekleyici",
    color: "#ec4899",
    welcome:
      "Harika, birlikte sürdürülebilir bir plan hazırlayalım. İsteklerini yaz 🌸",
  },
  {
    key: "zen",
    name: "Zen",
    subtitle: "Dengeli & Bilge",
    color: "#10b981",
    welcome:
      "Dengeyi bulmak için buradayım. Beslenme hedefini ve rutinini paylaş.",
  },
];

export default function CoachesPage() {
  const navigate = useNavigate();
  const isPremium = useUserStore((s) => s.isPremium);
  const membershipTier = useUserStore((s) => s.membershipTier);
  const coachPersona = useUserStore((s) => s.coachPersona);
  const setCoachPersona = useUserStore((s) => s.setCoachPersona);
  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);

  const user = useAuthStore((s) => s.user);
  const addPost = useFeedStore((s) => s.addPost);
  const [isPosting, setIsPosting] = useState(false);

  const canUseCoaches = isPremium || membershipTier !== "free";

  const selectedCoach =
    coachOptions.find((c) => c.key === coachPersona) || coachOptions[0];

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: selectedCoach.welcome,
    },
  ]);
  const [input, setInput] = useState("");
  const [latestPlan, setLatestPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canShare = useMemo(() => !!latestPlan, [latestPlan]);

  const addLocalCoachPost = (payload) => {
    const localPost = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user: {
        id: String(user?.id || "me"),
        name: user?.name || "Sen",
        avatar: user?.avatar || null,
      },
      content: payload.content,
      image: payload.image || null,
      calories: payload.calories || null,
      macros: payload.macros || null,
      coachComment: payload.coachComment || null,
      metadata: payload.metadata || null,
      isLiked: false,
      likeCount: 0,
      supportCount: 0,
      isSupported: false,
      timeAgo: "Az önce",
      comments: [],
    };

    addPost(localPost);
    return localPost;
  };

  const syncCoachPostToBackend = async (payload) => {
    try {
      await feedService.createPost(payload);
    } catch {
      // backend sync başarısız olsa da yerelde post görünmeye devam eder
    }
  };

  const switchCoach = (coachKey) => {
    const coach = coachOptions.find((c) => c.key === coachKey);
    if (!coach) return;
    setCoachPersona(coachKey);
    setLatestPlan(null);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: coach.welcome,
      },
    ]);
  };

  const generatePlan = async (userMessage) => {
    let plan = generatePersonalizedDietPlan({
      coachPersona,
      dailyCalorieGoal,
    });

    try {
      const res = await aiService.coachChat({
        coachPersona,
        dailyCalorieGoal,
        message: userMessage,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
      });

      const data = res?.data || {};
      const meals = Array.isArray(data?.plan?.meals)
        ? data.plan.meals.map((meal, idx) => ({
            name: meal.name || `Öğün ${idx + 1}`,
            targetCalories: Number(meal.targetCalories || meal.calories) || 0,
            menu: meal.menu || meal.description || "",
          }))
        : plan.meals;

      plan = {
        coach: {
          ...plan.coach,
          coachName: data?.coachName || plan.coach.coachName,
          color: data?.coachColor || plan.coach.color,
          intro: data?.intro || plan.coach.intro,
        },
        totalCalories: Number(data?.plan?.totalCalories) || plan.totalCalories,
        meals,
      };

      return {
        plan,
        reply:
          data?.reply ||
          `${plan.coach.coachName} planını hazırladım. Planı profilinize ekledim, oradan takip edebilirsiniz.`,
      };
    } catch {
      const fallbackReply =
        coachPersona === "demir"
          ? "Plan hazır. Kurallara sadık kalırsan sonuç gelir."
          : coachPersona === "ipek"
            ? "Sana uygun bir plan oluşturdum. Küçük adımlarla harika ilerleyeceğiz 🌸"
            : "Dengeli bir plan hazırladım. Gün içinde su ve uyku düzenini de koru.";

      return { plan, reply: fallbackReply };
    }
  };

  const handleSend = async () => {
    const value = input.trim();
    if (!value || isGenerating) return;

    const userMsg = { id: Date.now(), role: "user", text: value };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    const { plan, reply } = await generatePlan(value);
    setLatestPlan(plan);

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

    toast.success("Diyet listen hazırlandı ve profilinize eklendi.");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "assistant",
        text: reply,
      },
    ]);

    setIsGenerating(false);
  };

  const handleSharePlan = async () => {
    if (!latestPlan) return;

    setIsPosting(true);

    const payload = {
      content: buildDietPlanPostContent(latestPlan),
      calories: latestPlan.totalCalories,
      coachComment: {
        coachName: latestPlan.coach.coachName,
        color: latestPlan.coach.color,
        text: "Bu planı koçla birlikte hazırladım. Bugün bu plana sadık kalacağım.",
      },
      metadata: {
        type: "coach_chat_plan",
        source: "coaches_page",
      },
    };

    addLocalCoachPost(payload);
    await syncCoachPostToBackend(payload);

    // Diyet planını DB'ye kaydet
    try {
      await dietPlanService.createPlan({
        coach_persona: coachPersona,
        total_calories: latestPlan.totalCalories,
        meals: latestPlan.meals,
      });
    } catch {
      // Backend'e erişilemezse sessizce devam et
    }

    toast.success("Diyet planı akışta paylaşıldı.");
    setIsPosting(false);
    navigate("/feed");
  };

  if (!canUseCoaches) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Card
          style={{
            background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 16,
          }}
        >
          <Space direction="vertical" size={8}>
            <Title level={3} style={{ color: "#fff", margin: 0 }}>
              <CrownOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
              Koçlarla Sohbet Premium Özelliktir
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.5)" }}>
              Bu sayfaya erişmek için Bronze, Gold veya Diamond üyelik gerekir.
            </Text>
            <Button type="primary" onClick={() => navigate("/membership")}>
              Üçyelik Planlarını Gör
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #1a1025 0%, #16213e 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
          }}
        >
          <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
            <RobotOutlined style={{ marginRight: 8, color: "#a78bfa" }} />
            Koçlarla Diyet Planı
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.45)" }}>
            Koçunu seç, hedefini anlat, planını oluştur ve akışta paylaş.
          </Text>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <Card
              style={{
                background: "var(--bg-container)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
              }}
            >
              <Text strong style={{ color: "#fff" }}>
                Koç Seçimi
              </Text>
              <Divider
                style={{
                  margin: "12px 0",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                {coachOptions.map((coach) => {
                  const active = coach.key === coachPersona;
                  return (
                    <Button
                      key={coach.key}
                      block
                      onClick={() => switchCoach(coach.key)}
                      style={{
                        height: "auto",
                        textAlign: "left",
                        borderRadius: 12,
                        padding: 12,
                        borderColor: active
                          ? coach.color
                          : "rgba(255,255,255,0.15)",
                        background: active
                          ? "rgba(124,58,237,0.08)"
                          : "transparent",
                      }}
                    >
                      <Space>
                        <Avatar style={{ backgroundColor: coach.color }}>
                          {coach.name[0]}
                        </Avatar>
                        <div>
                          <Text style={{ color: "#fff", fontWeight: 600 }}>
                            {coach.name}
                          </Text>
                          <br />
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.45)",
                              fontSize: 12,
                            }}
                          >
                            {coach.subtitle}
                          </Text>
                        </div>
                        {active && (
                          <CheckOutlined style={{ color: coach.color }} />
                        )}
                      </Space>
                    </Button>
                  );
                })}
              </Space>

              <Divider
                style={{
                  margin: "14px 0",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
              <Tag color="purple" style={{ borderRadius: 20 }}>
                Günlük Hedef: {dailyCalorieGoal} kcal
              </Tag>
            </Card>
          </Col>

          <Col xs={24} lg={15}>
            <Card
              style={{
                background: "var(--bg-container)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}
              >
                {messages.length === 0 ? (
                  <Empty description="Sohbet başlat" />
                ) : (
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={10}
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf:
                            msg.role === "user" ? "flex-end" : "flex-start",
                          background:
                            msg.role === "user"
                              ? "rgba(124,58,237,0.16)"
                              : "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          padding: "10px 12px",
                        }}
                      >
                        <Text style={{ color: "rgba(255,255,255,0.88)" }}>
                          {msg.text}
                        </Text>
                      </div>
                    ))}
                  </Space>
                )}
              </div>

              <Divider
                style={{
                  margin: "12px 0",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Örn: Haftada 4 gün spor yapıyorum, akşam tatlı krizim oluyor. Bana 1900 kcal plan hazırlar mısın?"
                autoSize={{ minRows: 3, maxRows: 5 }}
                style={{
                  background: "#12122a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={isGenerating}
                  onClick={handleSend}
                  style={{ borderRadius: 10 }}
                >
                  Koça Gönder
                </Button>
              </div>
            </Card>

            {latestPlan && (
              <Card
                style={{
                  background: "var(--bg-container)",
                  border: "1px solid rgba(16,185,129,0.28)",
                  borderRadius: 14,
                }}
              >
                <Text strong style={{ color: "#fff" }}>
                  Hazırlanan Diyet Listesi ({latestPlan.totalCalories} kcal)
                </Text>
                <div style={{ marginTop: 8, marginBottom: 10 }}>
                  {latestPlan.meals.map((meal) => (
                    <Tag
                      key={meal.name}
                      color="green"
                      style={{ borderRadius: 16, marginBottom: 6 }}
                    >
                      {meal.name}: {meal.targetCalories} kcal
                    </Tag>
                  ))}
                </div>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {buildDietPlanPostContent(latestPlan)}
                </Paragraph>
                <Button
                  type="primary"
                  icon={<ShareAltOutlined />}
                  onClick={handleSharePlan}
                  loading={isPosting}
                  disabled={!canShare}
                  style={{ borderRadius: 10 }}
                >
                  Akışta Paylaş
                </Button>
              </Card>
            )}
          </Col>
        </Row>
      </motion.div>
    </div>
  );
}
