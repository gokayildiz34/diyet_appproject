/**
 * FitPlate - Haftalık Check-in Sayfası
 */
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Row,
  Slider,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  LineChartOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useUserStore } from "../stores/useUserStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { checkinService } from "../services/checkinService";

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getGoalSuggestion = (current, previous) => {
  if (!current || !previous) {
    return {
      label: "İlk check-in tamamlandı",
      detail: "Bir sonraki check-in ile trend analizi başlayacak.",
      delta: 0,
      color: "blue",
    };
  }

  const weightDelta = current.weightKg - previous.weightKg;
  const adherence = current.adherenceScore;

  if (adherence >= 80 && weightDelta >= 0) {
    return {
      label: "Plateau sinyali",
      detail:
        "Disiplin iyi ama kilo düşmüyor. Hedef kaloride küçük azaltım önerilir.",
      delta: -150,
      color: "orange",
    };
  }

  if (adherence >= 80 && weightDelta <= -1.2) {
    return {
      label: "Hızlı düşüş",
      detail:
        "Kilo düşüşü hızlı. Sürdürülebilirlik için kalori bir miktar artırılabilir.",
      delta: 100,
      color: "purple",
    };
  }

  return {
    label: "Plan iyi ilerliyor",
    detail: "Mevcut hedef kalori korunabilir.",
    delta: 0,
    color: "green",
  };
};

/**
 * Backend'den gelen snake_case veriyi frontend camelCase'e dönüştür
 */
const mapBackendCheckin = (item) => ({
  id: item.id,
  date: item.date || item.checkin_tarihi,
  weightKg: Number(item.weight_kg || item.kilo_kg) || 0,
  waistCm: item.waist_cm != null ? Number(item.waist_cm) : null,
  sleepHours: Number(item.sleep_hours || item.uyku_saat) || 0,
  energyScore: Number(item.energy_score || item.enerji_puani) || 5,
  adherenceScore: Number(item.adherence_score || item.uyum_puani) || 50,
  notes: item.notes || item.notlar || "",
});

export default function WeeklyCheckinPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);
  const weeklyCheckins = useUserStore((s) => s.weeklyCheckins || []);
  const addWeeklyCheckin = useUserStore((s) => s.addWeeklyCheckin);
  const removeWeeklyCheckin = useUserStore((s) => s.removeWeeklyCheckin);
  const setWeeklyCheckins = useUserStore((s) => s.setWeeklyCheckins);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const addNotification = useNotificationStore((s) => s.addNotification);

  // Sayfa yüklendiğinde backend'den check-in geçmişini çek
  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        const { data } = await checkinService.getCheckins();
        const checkins = (data?.checkins || []).map(mapBackendCheckin);
        if (checkins.length > 0) {
          setWeeklyCheckins(checkins);
        }
      } catch {
        // Backend'e erişilemezse mevcut local veriyle devam et
      }
    };
    fetchCheckins();
  }, [setWeeklyCheckins]);

  const latest = weeklyCheckins[0] || null;
  const previous = weeklyCheckins[1] || null;

  const weightDelta = useMemo(() => {
    if (!latest || !previous) return 0;
    return Number((latest.weightKg - previous.weightKg).toFixed(1));
  }, [latest, previous]);

  const avgAdherence4 = useMemo(() => {
    if (weeklyCheckins.length === 0) return 0;
    const sample = weeklyCheckins.slice(0, 4);
    const total = sample.reduce(
      (acc, item) => acc + (item.adherenceScore || 0),
      0,
    );
    return Math.round(total / sample.length);
  }, [weeklyCheckins]);

  const suggestion = useMemo(
    () => getGoalSuggestion(latest, previous),
    [latest, previous],
  );

  const handleSubmit = async (values) => {
    setLoading(true);
    const payload = {
      date: new Date().toISOString(),
      weightKg: values.weightKg,
      waistCm: values.waistCm ?? null,
      sleepHours: values.sleepHours,
      energyScore: values.energyScore,
      adherenceScore: values.adherenceScore,
      notes: values.notes?.trim() || "",
    };

    try {
      const { data } = await checkinService.createCheckin(payload);
      const saved = data?.checkin ? mapBackendCheckin(data.checkin) : payload;
      addWeeklyCheckin(saved);
      toast.success("Haftalık check-in kaydedildi.");
    } catch {
      addWeeklyCheckin(payload);
      toast.success("Check-in kaydedildi (yerel).");
    }

    form.resetFields();
    setLoading(false);

    if (notificationsEnabled) {
      addNotification({
        type: "progress",
        title: "Haftalık check-in tamamlandı",
        message:
          "Trend analizi güncellendi. İstatistiklerden ilerlemeni takip et.",
        actionPath: "/checkin",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await checkinService.deleteCheckin(id);
    } catch {
      // Sessizce devam et
    }
    removeWeeklyCheckin(id);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Title level={3} style={{ color: "#fff", marginBottom: 16 }}>
          <CalendarOutlined style={{ marginRight: 10, color: "#a78bfa" }} />
          Haftalık Check-in
        </Title>

        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                Son Kilo
              </Text>
              <br />
              <Text strong style={{ color: "#fff", fontSize: 24 }}>
                {latest ? `${latest.weightKg} kg` : "—"}
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                Haftalık Değişim
              </Text>
              <br />
              <Text
                strong
                style={{
                  color: weightDelta <= 0 ? "#34d399" : "#fb7185",
                  fontSize: 24,
                }}
              >
                {latest && previous
                  ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg`
                  : "—"}
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                4 Hafta Uyum Ortalaması
              </Text>
              <br />
              <Text strong style={{ color: "#fff", fontSize: 24 }}>
                %{avgAdherence4 || 0}
              </Text>
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space>
              <LineChartOutlined style={{ color: "#a78bfa" }} />
              <Text strong style={{ color: "#fff" }}>
                Akıllı Plan Önerisi
              </Text>
              <Tag color={suggestion.color} style={{ borderRadius: 20 }}>
                {suggestion.label}
              </Tag>
            </Space>
            <Text style={{ color: "rgba(255,255,255,0.72)" }}>
              {suggestion.detail}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.55)" }}>
              Güncel hedef: <b>{dailyCalorieGoal} kcal</b>
              {suggestion.delta !== 0 && (
                <>
                  {" "}
                  • Öneri: <b>{dailyCalorieGoal + suggestion.delta} kcal</b>
                </>
              )}
            </Text>
          </Space>
        </Card>

        <Card
          style={{
            marginBottom: 16,
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Text strong style={{ color: "#fff" }}>
            Bu Haftanın Check-in Kaydı
          </Text>
          <Divider
            style={{ borderColor: "rgba(255,255,255,0.08)", margin: "12px 0" }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              energyScore: 6,
              sleepHours: 7,
              adherenceScore: 75,
            }}
          >
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                      Kilo (kg)
                    </Text>
                  }
                  name="weightKg"
                  rules={[{ required: true, message: "Kilo gerekli" }]}
                >
                  <InputNumber
                    min={30}
                    max={250}
                    step={0.1}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                      Bel Çevresi (cm)
                    </Text>
                  }
                  name="waistCm"
                >
                  <InputNumber
                    min={40}
                    max={220}
                    step={0.5}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                      Ortalama Uyku (saat)
                    </Text>
                  }
                  name="sleepHours"
                  rules={[{ required: true, message: "Uyku süresi gerekli" }]}
                >
                  <InputNumber
                    min={2}
                    max={12}
                    step={0.5}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                  <ThunderboltOutlined style={{ marginRight: 6 }} />
                  Enerji Seviyesi (1-10)
                </Text>
              }
              name="energyScore"
            >
              <Slider min={1} max={10} />
            </Form.Item>

            <Form.Item
              label={
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                  Plan Uyumu (%)
                </Text>
              }
              name="adherenceScore"
            >
              <Slider min={0} max={100} />
            </Form.Item>

            <Form.Item
              label={
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>Notlar</Text>
              }
              name="notes"
            >
              <TextArea
                rows={3}
                placeholder="Bu hafta zorlandığın veya iyi giden noktaları yaz"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Check-in Kaydet
            </Button>
          </Form>
        </Card>

        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Text strong style={{ color: "#fff" }}>
            Geçmiş Check-in Kayıtları
          </Text>
          <Divider
            style={{ borderColor: "rgba(255,255,255,0.08)", margin: "12px 0" }}
          />

          {weeklyCheckins.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                  Henüz check-in kaydı yok.
                </Text>
              }
            />
          ) : (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {weeklyCheckins.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{
                    background: "#151528",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}
                >
                  <Space
                    style={{ justifyContent: "space-between", width: "100%" }}
                    align="start"
                  >
                    <div>
                      <Text strong style={{ color: "#fff" }}>
                        {formatDate(item.date)}
                      </Text>
                      <br />
                      <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                        {item.weightKg} kg • {item.waistCm ?? "—"} cm •{" "}
                        {item.sleepHours} saat uyku
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 12,
                          }}
                        >
                          Uyum
                        </Text>
                        <Progress
                          percent={item.adherenceScore}
                          size="small"
                          showInfo={false}
                          strokeColor="#7c3aed"
                          trailColor="rgba(255,255,255,0.08)"
                        />
                      </div>
                      {item.notes && (
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 12,
                          }}
                        >
                          Not: {item.notes}
                        </Text>
                      )}
                    </div>

                    <Popconfirm
                      title="Bu kaydı silmek istiyor musun?"
                      okText="Sil"
                      cancelText="Vazgeç"
                      onConfirm={() => handleDelete(item.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
