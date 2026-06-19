import { useMemo } from "react";
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Button,
  Divider,
} from "antd";
import {
  UserOutlined,
  FireOutlined,
  CalendarOutlined,
  TrophyOutlined,
  EditOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";
import { useFeedStore } from "../stores/useFeedStore";

const { Title, Text, Paragraph } = Typography;

const coachInfo = {
  demir: {
    name: "Demir",
    subtitle: "Sert & Disiplinli",
    color: "#ef4444",
    initial: "D",
  },
  ipek: {
    name: "İpek",
    subtitle: "Nazik & Destekleyici",
    color: "#ec4899",
    initial: "İ",
  },
  zen: {
    name: "Zen",
    subtitle: "Dengeli & Bilge",
    color: "#10b981",
    initial: "Z",
  },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    coachPersona,
    isPremium,
    membershipTier,
    dailyCalorieGoal,
    dailyCaloriesConsumed,
    weeklyCheckins,
  } = useUserStore();
  const posts = useFeedStore((s) => s.posts);
  const coach = coachInfo[coachPersona] || coachInfo.demir;
  const membershipLabel =
    membershipTier === "diamond"
      ? "Diamond"
      : membershipTier === "gold"
        ? "Gold"
        : membershipTier === "bronze"
          ? "Bronze"
          : "Free";

  // Gün serisi hesapla (ardışık check-in sayısı)
  const streak = useMemo(() => {
    if (!weeklyCheckins || weeklyCheckins.length === 0) return 0;
    let count = 0;
    const sortedCheckins = [...weeklyCheckins].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const checkin of sortedCheckins) {
      const checkinDate = new Date(checkin.date);
      checkinDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - checkinDate) / (1000 * 60 * 60 * 24));
      // Haftaya göre ardışıklık kontrolü (7 gün tolerans)
      if (diffDays <= (count + 1) * 7) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [weeklyCheckins]);

  // Kullanıcının toplam gönderi sayısı
  const currentUserId = String(user?.id || "me");
  const myPostCount = useMemo(
    () =>
      posts.filter(
        (p) => String(p.user?.id || p.user_id || "") === currentUserId,
      ).length,
    [posts, currentUserId],
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Profil Başlığı */}
        <Card
          style={{
            background: "linear-gradient(135deg, #1a1025 0%, #16213e 100%)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            borderRadius: 20,
            marginBottom: 16,
            overflow: "hidden",
          }}
          styles={{ body: { padding: 0 } }}
        >
          {/* Kapak alanı */}
          <div
            style={{
              height: 80,
              background:
                "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
              opacity: 0.4,
            }}
          />
          <div style={{ padding: "0 28px 28px", marginTop: -36 }}>
            <Avatar
              size={72}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#7c3aed",
                border: "4px solid #1a1025",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <Title level={3} style={{ color: "#fff", marginBottom: 2 }}>
                  {user?.name || "Kullanıcı"}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                  {user?.email || "email@example.com"}
                </Text>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {isPremium && (
                    <Tag
                      icon={<CrownOutlined />}
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        border: "none",
                        color: "#fff",
                        borderRadius: 20,
                        fontWeight: 600,
                      }}
                    >
                      Premium
                    </Tag>
                  )}
                  <Tag
                    style={{
                      background: "rgba(245, 158, 11, 0.14)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      color: "#fbbf24",
                      borderRadius: 20,
                    }}
                  >
                    Plan: {membershipLabel}
                  </Tag>
                  <Tag
                    style={{
                      background: "rgba(124, 58, 237, 0.12)",
                      border: "1px solid rgba(124, 58, 237, 0.2)",
                      color: "#a78bfa",
                      borderRadius: 20,
                    }}
                  >
                    Koç: {coach.name}
                  </Tag>
                </div>
              </div>
              <Button
                type="text"
                icon={<EditOutlined />}
                style={{ color: "rgba(255,255,255,0.45)", marginTop: 8 }}
                onClick={() => navigate("/settings")}
              >
                Düzenle
              </Button>
            </div>
          </div>
        </Card>

        {/* İstatistikler */}
        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 16,
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            İSTATİSTİKLER
          </Text>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic
                title={
                  <Text
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  >
                    Günlük Hedef
                  </Text>
                }
                value={dailyCalorieGoal}
                suffix={
                  <Text
                    style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}
                  >
                    kcal
                  </Text>
                }
                prefix={<FireOutlined style={{ color: "#f59e0b" }} />}
                styles={{ content: { color: "#fff", fontSize: 20 } }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={
                  <Text
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  >
                    Hafta Serisi
                  </Text>
                }
                value={streak}
                suffix={
                  <Text
                    style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}
                  >
                    hafta
                  </Text>
                }
                prefix={<CalendarOutlined style={{ color: "#10b981" }} />}
                styles={{ content: { color: "#fff", fontSize: 20 } }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={
                  <Text
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  >
                    Gönderiler
                  </Text>
                }
                value={myPostCount}
                prefix={<TrophyOutlined style={{ color: "#a78bfa" }} />}
                styles={{ content: { color: "#fff", fontSize: 20 } }}
              />
            </Col>
          </Row>
        </Card>

        {/* Koç Bilgisi */}
        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 16,
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            BESLENME KOÇUNUZ
          </Text>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Avatar
              size={52}
              style={{
                backgroundColor: coach.color,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {coach.initial}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text strong style={{ color: "#fff", fontSize: 16 }}>
                {coach.name}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                {coach.subtitle}
              </Text>
            </div>
            <Button
              size="small"
              onClick={() => navigate("/coaches")}
              style={{
                borderRadius: 8,
                color: "#a78bfa",
                borderColor: "rgba(124, 58, 237, 0.3)",
              }}
            >
              Değiştir
            </Button>
          </div>
        </Card>

        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            AKTİVİTE ÖZETİ
          </Text>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8} style={{ textAlign: "center" }}>
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {myPostCount}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Gönderi
              </Text>
            </Col>
            <Col span={8} style={{ textAlign: "center" }}>
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {weeklyCheckins?.length || 0}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Check-in
              </Text>
            </Col>
            <Col span={8} style={{ textAlign: "center" }}>
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {dailyCaloriesConsumed}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Bugün (kcal)
              </Text>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </div>
  );
}
