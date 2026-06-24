/**
 * FitPlate - Üçyelik ve Ödeme Sayfası
 */
import { useEffect, useMemo, useState } from "react";
import { Card, Typography, Row, Col, Button, Tag, Space, Alert } from "antd";
import {
  CrownOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { paymentService } from "../services/paymentService";
import { useUserStore } from "../stores/useUserStore";
import { useAuthStore } from "../stores/useAuthStore";

const { Title, Text, Paragraph } = Typography;

const fallbackPlans = [
  {
    key: "bronze",
    name: "Bronze",
    amount: 14900,
    currency: "try",
    interval: "month",
    features: [
      "Temel AI koç önerileri",
      "Haftalık özet raporu",
      "Topluluk akışı erişimi",
    ],
    accent: "#cd7f32",
  },
  {
    key: "gold",
    name: "Gold",
    amount: 29900,
    currency: "try",
    interval: "month",
    features: [
      "Gelişmiş AI koç yorumları",
      "Günlük kişiselleştirilmiş diyet planı",
      "Öncelikli destek",
    ],
    accent: "#f59e0b",
  },
  {
    key: "diamond",
    name: "Diamond",
    amount: 49900,
    currency: "try",
    interval: "month",
    features: [
      "Sınırsız fotoğraf analizi",
      "Canlı koç öneri simülasyonu",
      "Özel premium topluluk alanı",
    ],
    accent: "#38bdf8",
  },
];

const formatPrice = (amount) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0) / 100);

export default function MembershipPage() {
  const location = useLocation();
  const [plans, setPlans] = useState(fallbackPlans);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const membershipTier = useUserStore((s) => s.membershipTier);
  const setMembershipTier = useUserStore((s) => s.setMembershipTier);
  const setIsPremium = useUserStore((s) => s.setIsPremium);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await paymentService.getPlans();
        const remotePlans = res?.data?.plans;
        if (Array.isArray(remotePlans) && remotePlans.length > 0) {
          setPlans(
            remotePlans.map((p) => ({
              ...p,
              accent:
                p.key === "bronze"
                  ? "#cd7f32"
                  : p.key === "gold"
                    ? "#f59e0b"
                    : "#38bdf8",
            })),
          );
        }
      } catch {
        // fallback list kullanılacak
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const plan = params.get("plan");

    if (status === "success" && plan) {
      setMembershipTier(plan);
      setIsPremium(plan !== "free");
      toast.success("Ödeme başarılı. Üçyelişin güncellendi.");
    }

    if (status === "cancel") {
      toast.info("Ödeme iptal edildi.");
    }
  }, [location.search, setMembershipTier, setIsPremium]);

  const currentPlanLabel = useMemo(() => {
    if (!membershipTier || membershipTier === "free") return "Free";
    const found = plans.find((p) => p.key === membershipTier);
    return found?.name || membershipTier;
  }, [membershipTier, plans]);

  const handleCheckout = async (planKey) => {
    setLoadingPlan(planKey);
    try {
      const res = await paymentService.createCheckoutSession({
        plan: planKey,
        email: user?.email,
      });
      const checkoutUrl = res?.data?.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error("Checkout URL bulunamadı");
    } catch {
      toast.error("Ödeme oturumu açılamadı. Lütfen tekrar dene.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 18,
          }}
        >
          <Space orientation="vertical" size={4}>
            <Title level={3} style={{ color: "#fff", margin: 0 }}>
              <CrownOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
              Üçyelik Planları
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.5)" }}>
              Bronze, Gold veya Diamond paketlerinden birini seç.
            </Text>
            <Tag
              color="purple"
              style={{ width: "fit-content", borderRadius: 20 }}
            >
              Aktif Plan: {currentPlanLabel}
            </Tag>
          </Space>
        </Card>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          title="Ödeme altyapısı Stripe Checkout ile çalışır"
          description="Satın al butonu seni güvenli Stripe ödeme ekranına yönlendirir."
        />

        <Row gutter={[16, 16]}>
          {plans.map((plan) => {
            const isCurrent = plan.key === membershipTier;
            const isPopular = plan.key === "gold";

            return (
              <Col xs={24} md={8} key={plan.key}>
                <Card
                  style={{
                    height: "100%",
                    background: "var(--bg-container)",
                    border: `1px solid ${isCurrent ? plan.accent : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 16,
                    position: "relative",
                  }}
                  styles={{ body: { padding: 18 } }}
                >
                  {isPopular && (
                    <Tag
                      color="gold"
                      icon={<StarOutlined />}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        borderRadius: 20,
                      }}
                    >
                      En Popüler
                    </Tag>
                  )}

                  <Text
                    style={{
                      color: plan.accent,
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {plan.name}
                  </Text>
                  <div style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text strong style={{ color: "#fff", fontSize: 28 }}>
                      {formatPrice(plan.amount)}
                    </Text>
                    <Text
                      style={{ color: "rgba(255,255,255,0.45)", marginLeft: 6 }}
                    >
                      / ay
                    </Text>
                  </div>

                  <div>
                    {(plan.features || []).map((item, idx) => (
                      <div key={idx} style={{ padding: "8px 0" }}>
                        <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                          <CheckCircleOutlined
                            style={{ color: "#10b981", marginRight: 8 }}
                          />
                          {item}
                        </Text>
                      </div>
                    ))}
                  </div>

                  <Button
                    type={isCurrent ? "default" : "primary"}
                    block
                    size="large"
                    disabled={isCurrent}
                    loading={loadingPlan === plan.key}
                    onClick={() => handleCheckout(plan.key)}
                    style={{ marginTop: 14, borderRadius: 12 }}
                  >
                    {isCurrent ? "Aktif Plan" : "Satın Al"}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>

        <Card
          style={{
            marginTop: 16,
            background: "var(--bg-container)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
        >
          <Paragraph
            style={{ color: "rgba(255,255,255,0.5)", marginBottom: 0 }}
          >
            Not: Bu sürümde abonelik aktivasyonu ödeme dönüş parametresine göre
            frontend state üzerinde güncellenir. Kalıcı üyelik doğrulaması için
            webhook event'lerinin veritabanına yazılması gerekir.
          </Paragraph>
        </Card>
      </motion.div>
    </div>
  );
}
