/**
 * FitPlate - İstatistikler Sayfası
 * Kalori, makro ve ilerleme takibi
 */
import { useMemo } from "react";
import { Card, Typography, Row, Col, Progress, Space, Tag, Button } from "antd";
import {
  BarChartOutlined,
  FireOutlined,
  RiseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function StatsPage() {
  const navigate = useNavigate();
  const { dailyCalorieGoal, dailyCaloriesConsumed, weeklyCheckins } =
    useUserStore();

  // Check-in verilerinden son 7 günlük veriyi hesapla
  const weeklyData = useMemo(() => {
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0=Pazar
    // Pazartesi başlangıçlı index: Pzt=0, Sal=1, ..., Paz=6
    const mondayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    // Son 7 gün için boş template oluştur
    const days = DAY_LABELS.map((day, i) => ({
      day,
      calories: 0,
      goal: dailyCalorieGoal,
    }));

    // Bugünkü veriyi ekle
    days[mondayIndex].calories = dailyCaloriesConsumed;

    // Check-in verilerinden son 7 gündeki kayıtları eşleştir
    if (weeklyCheckins && weeklyCheckins.length > 0) {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      weeklyCheckins.forEach((checkin) => {
        const checkinDate = new Date(checkin.date);
        if (checkinDate >= oneWeekAgo && checkinDate <= today) {
          const dow = checkinDate.getDay();
          const idx = dow === 0 ? 6 : dow - 1;
          // Check-in'den kalori tahmini (varsa)
          if (days[idx].calories === 0) {
            days[idx].calories = checkin.weightKg ? Math.round(checkin.weightKg * 25) : 0;
          }
        }
      });
    }

    return days;
  }, [dailyCalorieGoal, dailyCaloriesConsumed, weeklyCheckins]);

  // Haftalık streak hesapla
  const weekStreak = useMemo(() => {
    if (!weeklyCheckins || weeklyCheckins.length === 0) return 0;
    let count = 0;
    const sorted = [...weeklyCheckins].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const checkin of sorted) {
      const d = new Date(checkin.date);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));
      if (diffDays <= (count + 1) * 7) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [weeklyCheckins]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Title level={3} style={{ color: "#fff", marginBottom: 20 }}>
          <BarChartOutlined style={{ marginRight: 10, color: "#a78bfa" }} />
          İstatistikler
        </Title>

        {/* Günlük Özet */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 14,
                textAlign: "center",
              }}
              styles={{ body: { padding: 16 } }}
            >
              <FireOutlined
                style={{ fontSize: 22, color: "#f59e0b", marginBottom: 6 }}
              />
              <br />
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {dailyCaloriesConsumed}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                Alınan (kcal)
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                border: "1px solid rgba(16,185,129,0.15)",
                borderRadius: 14,
                textAlign: "center",
              }}
              styles={{ body: { padding: 16 } }}
            >
              <RiseOutlined
                style={{ fontSize: 22, color: "#10b981", marginBottom: 6 }}
              />
              <br />
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {Math.max(dailyCalorieGoal - dailyCaloriesConsumed, 0)}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                Kalan (kcal)
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
                border: "1px solid rgba(59,130,246,0.15)",
                borderRadius: 14,
                textAlign: "center",
              }}
              styles={{ body: { padding: 16 } }}
            >
              <CalendarOutlined
                style={{ fontSize: 22, color: "#3b82f6", marginBottom: 6 }}
              />
              <br />
              <Text strong style={{ color: "#fff", fontSize: 22 }}>
                {weekStreak}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                Gün Serisi
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Haftalık Grafik (basit bar chart) */}
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
            HAFTALIK KALORİ TAKİBİ
          </Text>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              height: 150,
              marginTop: 20,
              gap: 8,
            }}
          >
            {weeklyData.map((d, idx) => {
              const heightPercent =
                d.goal > 0 ? Math.min((d.calories / d.goal) * 100, 120) : 0;
              const isOver = d.calories > d.goal;
              const isToday = idx === 6;
              return (
                <motion.div
                  key={d.day}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 10,
                      marginBottom: 4,
                    }}
                  >
                    {d.calories > 0 ? d.calories : "—"}
                  </Text>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 36,
                      height: `${heightPercent}%`,
                      minHeight: d.calories > 0 ? 8 : 2,
                      borderRadius: 6,
                      background: isToday
                        ? "rgba(124, 58, 237, 0.2)"
                        : isOver
                          ? "linear-gradient(180deg, #ef4444 0%, rgba(239,68,68,0.3) 100%)"
                          : "linear-gradient(180deg, #7c3aed 0%, rgba(124,58,237,0.3) 100%)",
                      border: isToday
                        ? "1px dashed rgba(124,58,237,0.4)"
                        : "none",
                      transition: "all 0.3s",
                    }}
                  />
                  <Text
                    style={{
                      color: isToday ? "#a78bfa" : "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      marginTop: 6,
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {d.day}
                  </Text>
                </motion.div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <Space size={4}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#7c3aed",
                }}
              />
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Hedef altı
              </Text>
            </Space>
            <Space size={4}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#ef4444",
                }}
              />
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Hedef üstü
              </Text>
            </Space>
          </div>
        </Card>

        <Card
          style={{
            background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
            marginBottom: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong style={{ color: "#fff" }}>
                Haftalık Check-in Yap
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.55)" }}>
                Kilo, uyku, enerji ve plan uyumunu girerek planını güncel tut.
              </Text>
            </div>
            <Button type="primary" onClick={() => navigate("/checkin")}>
              Check-in Ekranı
            </Button>
          </Space>
        </Card>

        {/* Makro Dağılım */}
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
            MAKRO BESİN DAĞILIMI (BUGÜN)
          </Text>
          <div style={{ marginTop: 20 }}>
            {[
              {
                label: "Karbonhidrat",
                value: 0,
                max: 250,
                color: "#3b82f6",
                emoji: "🍞",
              },
              {
                label: "Protein",
                value: 0,
                max: 120,
                color: "#10b981",
                emoji: "🥩",
              },
              {
                label: "Yağ",
                value: 0,
                max: 65,
                color: "#f59e0b",
                emoji: "🧈",
              },
            ].map((macro) => (
              <div key={macro.label} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
                  >
                    {macro.emoji} {macro.label}
                  </Text>
                  <Text
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}
                  >
                    {macro.value}g / {macro.max}g
                  </Text>
                </div>
                <Progress
                  percent={
                    macro.max > 0
                      ? Math.round((macro.value / macro.max) * 100)
                      : 0
                  }
                  strokeColor={macro.color}
                  railColor="rgba(255,255,255,0.06)"
                  showInfo={false}
                  size="small"
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
