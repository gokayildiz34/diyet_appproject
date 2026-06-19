/**
 * FitPlate - Onboarding Sayfası
 * Koç seçimi ve kalori hedefi belirleme
 */
import { useState } from "react";
import {
  Card,
  Typography,
  Button,
  InputNumber,
  Steps,
  Space,
  Avatar,
} from "antd";
import { CheckOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const { Title, Text, Paragraph } = Typography;

const coachOptions = [
  {
    key: "demir",
    initial: "D",
    name: "Demir",
    subtitle: "Sert & Disiplinli",
    description:
      "Seni zorlayacak, mazeret kabul etmeyecek. Sonuç odaklı, disiplinli takipçin olsun istiyorsan Demir tam sana göre.",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.06)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  {
    key: "ipek",
    initial: "İ",
    name: "İpek",
    subtitle: "Nazik & Destekleyici",
    description:
      "Her adımını kutlayacak, seni motive edecek. Empati ve pozitiflikle ilerlemek istiyorsan İpek yanında.",
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.06)",
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  {
    key: "zen",
    initial: "Z",
    name: "Zen",
    subtitle: "Dengeli & Bilge",
    description:
      "Sakin ve bilimsel yaklaşımla dengeyi öğretir. Aşırılıklardan uzak, sürdürülebilir beslenme için Zen ideal.",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.06)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const navigate = useNavigate();
  const setCoachPersona = useUserStore((s) => s.setCoachPersona);
  const setDailyCalorieGoal = useUserStore((s) => s.setDailyCalorieGoal);
  const setOnboardingCompleted = useUserStore((s) => s.setOnboardingCompleted);

  const handleComplete = () => {
    if (selectedCoach) setCoachPersona(selectedCoach);
    setDailyCalorieGoal(calorieGoal);
    setOnboardingCompleted(true);
    navigate("/feed");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #0f0f1a 0%, #1a1025 50%, #0f0f1a 100%)",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 600 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title
            style={{
              background: "linear-gradient(135deg, #a78bfa, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            Hadi Başlayalım!
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.4)" }}>
            Deneyimini kişiselleştirelim
          </Paragraph>
          <Steps
            current={step}
            items={[
              {
                title: (
                  <Text style={{ color: "rgba(255,255,255,0.55)" }}>
                    Koçunu Seç
                  </Text>
                ),
              },
              {
                title: (
                  <Text style={{ color: "rgba(255,255,255,0.55)" }}>
                    Hedefini Belirle
                  </Text>
                ),
              },
            ]}
            style={{ maxWidth: 380, margin: "0 auto" }}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* Adım 1: Koç Seçimi */}
          {step === 0 && (
            <motion.div
              key="step-coach"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Space orientation="vertical" size={14} style={{ width: "100%" }}>
                {coachOptions.map((coach) => (
                  <motion.div
                    key={coach.key}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <Card
                      hoverable
                      onClick={() => setSelectedCoach(coach.key)}
                      style={{
                        background:
                          selectedCoach === coach.key
                            ? coach.bgColor
                            : "#1a1a2e",
                        border: `2px solid ${
                          selectedCoach === coach.key
                            ? coach.borderColor
                            : "rgba(255,255,255,0.06)"
                        }`,
                        borderRadius: 16,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "flex-start",
                        }}
                      >
                        <Avatar
                          size={48}
                          style={{
                            backgroundColor: coach.color,
                            fontSize: 20,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {coach.initial}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Space>
                            <Text
                              strong
                              style={{ color: coach.color, fontSize: 17 }}
                            >
                              {coach.name}
                            </Text>
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.35)",
                                fontSize: 13,
                              }}
                            >
                              {coach.subtitle}
                            </Text>
                            {selectedCoach === coach.key && (
                              <CheckOutlined style={{ color: coach.color }} />
                            )}
                          </Space>
                          <Paragraph
                            style={{
                              color: "rgba(255,255,255,0.55)",
                              marginBottom: 0,
                              marginTop: 6,
                              fontSize: 13,
                              lineHeight: 1.6,
                            }}
                          >
                            {coach.description}
                          </Paragraph>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </Space>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={() => setStep(1)}
                  disabled={!selectedCoach}
                  style={{
                    borderRadius: 12,
                    height: 48,
                    paddingInline: 40,
                    fontWeight: 600,
                  }}
                >
                  Devam Et
                </Button>
              </div>
            </motion.div>
          )}

          {/* Adım 2: Kalori Hedefi */}
          {step === 1 && (
            <motion.div
              key="step-goal"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card
                style={{
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  textAlign: "center",
                }}
                styles={{ body: { padding: 40 } }}
              >
                <Title level={4} style={{ color: "#fff" }}>
                  🎯 Günlük Kalori Hedefiniz
                </Title>
                <Paragraph
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}
                >
                  Koçunuz bu hedefe göre sizi yönlendirecek ve beslenme
                  önerilerinizi kişiselleştirecek.
                </Paragraph>

                <InputNumber
                  value={calorieGoal}
                  onChange={(v) => setCalorieGoal(v)}
                  min={1000}
                  max={5000}
                  step={100}
                  size="large"
                  suffix="kcal"
                  style={{
                    width: 200,
                    background: "#12122a",
                    borderRadius: 12,
                    marginTop: 16,
                    marginBottom: 28,
                  }}
                />

                <div
                  style={{ display: "flex", gap: 12, justifyContent: "center" }}
                >
                  <Button
                    size="large"
                    onClick={() => setStep(0)}
                    style={{ borderRadius: 12, height: 48 }}
                  >
                    Geri
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={handleComplete}
                    style={{
                      borderRadius: 12,
                      height: 48,
                      paddingInline: 40,
                      fontWeight: 600,
                    }}
                  >
                    Başlayalım!
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
