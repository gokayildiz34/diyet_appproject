/**
 * FitPlate - Haftalık Check-in Sayfası (Geliştirilmiş & AI Destekli)
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
  Upload,
  Modal,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  LineChartOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  CameraOutlined,
  SmileOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useUserStore } from "../stores/useUserStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { checkinService } from "../services/checkinService";
import { getImageUrl } from "../../utils/helpers";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
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
      detail: "Disiplin iyi ama kilo düşmüyor. Hedef kaloride küçük azaltım önerilir.",
      delta: -150,
      color: "orange",
    };
  }

  if (adherence >= 80 && weightDelta <= -1.2) {
    return {
      label: "Hızlı düşüş",
      detail: "Kilo düşüşü hızlı. Sürdürülebilirlik için kalori bir miktar artırılabilir.",
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

const mapBackendCheckin = (item) => ({
  id: item.id,
  date: item.date || item.checkin_tarihi,
  weightKg: Number(item.weight_kg || item.kilo_kg) || 0,
  waistCm: item.waist_cm != null ? Number(item.waist_cm) : null,
  sleepHours: Number(item.sleep_hours || item.uyku_saat) || 0,
  energyScore: Number(item.energy_score || item.enerji_puani) || 5,
  adherenceScore: Number(item.adherence_score || item.uyum_puani) || 50,
  notes: item.notes || item.notlar || "",
  mood: item.mood || "😊",
  photoPath: item.photo_path || null,
  aiFeedback: item.ai_feedback || null,
  bicepsCm: item.biceps_cm != null ? Number(item.biceps_cm) : null,
});

const moods = [
  { emoji: "😩", label: "Stresli" },
  { emoji: "😫", label: "Yorgun" },
  { emoji: "😐", label: "Normal" },
  { emoji: "😊", label: "İyi" },
  { emoji: "🤩", label: "Harika" },
];

export default function WeeklyCheckinPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("😊");
  const [photoBase64, setPhotoBase64] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);
  const weeklyCheckins = useUserStore((s) => s.weeklyCheckins || []);
  const addWeeklyCheckin = useUserStore((s) => s.addWeeklyCheckin);
  const removeWeeklyCheckin = useUserStore((s) => s.removeWeeklyCheckin);
  const setWeeklyCheckins = useUserStore((s) => s.setWeeklyCheckins);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        const { data } = await checkinService.getCheckins();
        const checkins = (data?.checkins || []).map(mapBackendCheckin);
        if (checkins.length > 0) {
          setWeeklyCheckins(checkins);
        }
      } catch {
        // Backend'e erişilemezse
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
    const total = sample.reduce((acc, item) => acc + (item.adherenceScore || 0), 0);
    return Math.round(total / sample.length);
  }, [weeklyCheckins]);

  const suggestion = useMemo(() => getGoalSuggestion(latest, previous), [latest, previous]);

  // Son 8 kaydın grafiği için veriyi hazırlama
  const chartData = useMemo(() => {
    return [...weeklyCheckins]
      .slice(0, 8)
      .reverse()
      .map((item) => ({
        tarih: formatDate(item.date),
        Kilo: item.weightKg,
        Bel: item.waistCm || 0,
        Biceps: item.bicepsCm || 0,
      }));
  }, [weeklyCheckins]);

  const handlePhotoChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoBase64(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoBase64(null);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    const payload = {
      date: new Date().toISOString(),
      weight_kg: values.weightKg,
      waist_cm: values.waistCm ?? null,
      sleep_hours: values.sleepHours,
      energy_score: values.energyScore,
      adherence_score: values.adherenceScore,
      notes: values.notes?.trim() || "",
      mood: selectedMood,
      photo_base64: photoBase64,
      biceps_cm: values.bicepsCm ?? null,
    };

    try {
      const { data } = await checkinService.createCheckin(payload);
      const saved = data?.checkin ? mapBackendCheckin(data.checkin) : {
        ...payload,
        id: Date.now(),
        weightKg: payload.weight_kg,
        waistCm: payload.waist_cm,
        sleepHours: payload.sleep_hours,
        energyScore: payload.energy_score,
        adherenceScore: payload.adherence_score,
        bicepsCm: payload.biceps_cm,
        aiFeedback: "Yerel kayıt tamamlandı. Aktif bir internet başlantınız olduğunda yapay zeka analiziniz güncellenecektir."
      };
      addWeeklyCheckin(saved);
      toast.success("Haftalık check-in kaydedildi.");
    } catch {
      // Local fallback
      const mockSaved = {
        id: Date.now(),
        date: payload.date,
        weightKg: payload.weight_kg,
        waistCm: payload.waist_cm,
        sleepHours: payload.sleep_hours,
        energyScore: payload.energy_score,
        adherenceScore: payload.adherence_score,
        bicepsCm: payload.biceps_cm,
        notes: payload.notes,
        mood: payload.mood,
        aiFeedback: "Yerel olarak kaydedildi. Koçunuz diyor ki: İstikrarlı ilerliyorsun, veri başlantısı kurulunca detaylı analiz alacaksın!"
      };
      addWeeklyCheckin(mockSaved);
      toast.success("Check-in kaydedildi (yerel).");
    }

    form.resetFields();
    setFileList([]);
    setPhotoBase64(null);
    setLoading(false);

    if (notificationsEnabled) {
      addNotification({
        type: "progress",
        title: "Haftalık check-in tamamlandı",
        message: "Trend analizi güncellendi. İstatistiklerden ilerlemeni takip et.",
        actionPath: "/checkin",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await checkinService.deleteCheckin(id);
    } catch {
      //
    }
    removeWeeklyCheckin(id);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", paddingBottom: 40 }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Title level={3} style={{ color: "#fff", marginBottom: 16 }}>
          <CalendarOutlined style={{ marginRight: 10, color: "#a78bfa" }} />
          Haftalık Check-in & AI Analiz
        </Title>

        {/* 1. Grafik Bölümü */}
        {weeklyCheckins.length > 1 && (
          <Card
            style={{
              marginBottom: 16,
              background: "var(--bg-container)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
            }}
            title={<span style={{ color: "#fff" }}><LineChartOutlined /> Gelişim Trendi</span>}
          >
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="tarih" stroke="rgba(255,255,255,0.4)" />
                  <YAxis domain={['dataMin - 3', 'dataMax + 3']} stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-container)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" name="Kilo (kg)" dataKey="Kilo" stroke="#a78bfa" strokeWidth={3} activeDot={{ r: 8 }} />
                  {chartData.some(d => d.Bel > 0) && (
                    <Line type="monotone" name="Bel (cm)" dataKey="Bel" stroke="#34d399" strokeWidth={2} />
                  )}
                  {chartData.some(d => d.Biceps > 0) && (
                    <Line type="monotone" name="Biceps (cm)" dataKey="Biceps" stroke="#38bdf8" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card style={{ background: "var(--bg-container)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Son Kilo</Text>
              <br />
              <Text strong style={{ color: "#fff", fontSize: 24 }}>{latest ? `${latest.weightKg} kg` : ""}</Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ background: "var(--bg-container)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Haftalık Değişim</Text>
              <br />
              <Text strong style={{ color: weightDelta <= 0 ? "#34d399" : "#fb7185", fontSize: 24 }}>
                {latest && previous ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : ""}
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ background: "var(--bg-container)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>4 Hafta Uyum</Text>
              <br />
              <Text strong style={{ color: "#fff", fontSize: 24 }}>%{avgAdherence4 || 0}</Text>
            </Card>
          </Col>
        </Row>

        {/* AI Geri Bildirimi Bölümü */}
        {latest?.aiFeedback && (
          <Card
            style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, #1e1b4b 0%, #111827 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 16,
            }}
          >
            <Space align="start" size={12}>
              <RobotOutlined style={{ fontSize: 28, color: "#818cf8", marginTop: 4 }} />
              <div>
                <Text strong style={{ color: "#fff", fontSize: 15 }}>AI Coach Haftalık Değerlendirmesi</Text>
                <br />
                <Text style={{ color: "rgba(255,255,255,0.85)", display: "inline-block", marginTop: 6, lineHeight: 1.5 }}>
                  {latest.aiFeedback}
                </Text>
              </div>
            </Space>
          </Card>
        )}

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
              <ThunderboltOutlined style={{ color: "#a78bfa" }} />
              <Text strong style={{ color: "#fff" }}>Akıllı Plan Önerisi</Text>
              <Tag color={suggestion.color} style={{ borderRadius: 20 }}>{suggestion.label}</Tag>
            </Space>
            <Text style={{ color: "rgba(255,255,255,0.72)" }}>{suggestion.detail}</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)" }}>
              Güncel hedef: <b>{dailyCalorieGoal} kcal</b>
              {suggestion.delta !== 0 && (
                <> ⬢ Öneri: <b>{dailyCalorieGoal + suggestion.delta} kcal</b></>
              )}
            </Text>
          </Space>
        </Card>

        {/* Check-in Formu */}
        <Card
          style={{
            marginBottom: 16,
            background: "var(--bg-container)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Text strong style={{ color: "#fff", fontSize: 16 }}>Bu Haftanın Verilerini Girin</Text>
          <Divider style={{ borderColor: "rgba(255,255,255,0.08)", margin: "12px 0" }} />

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
              <Col xs={24} md={6}>
                <Form.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Kilo (kg)</Text>}
                  name="weightKg"
                  rules={[{ required: true, message: "Kilo gereklidir" }]}
                >
                  <InputNumber min={30} max={250} step={0.1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Bel (cm)</Text>}
                  name="waistCm"
                >
                  <InputNumber min={40} max={220} step={0.5} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Biceps (cm)</Text>}
                  name="bicepsCm"
                >
                  <InputNumber min={10} max={80} step={0.1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Uyku (saat)</Text>}
                  name="sleepHours"
                  rules={[{ required: true, message: "Uyku süresi gereklidir" }]}
                >
                  <InputNumber min={2} max={12} step={0.5} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            {/* Emojili Ruh Hali Seçici */}
            <Form.Item label={<Text style={{ color: "rgba(255,255,255,0.75)" }}><SmileOutlined /> Ruh Hali / Motivasyon</Text>}>
              <Space size={12} style={{ width: "100%", justifyContent: "space-between" }}>
                {moods.map((m) => (
                  <Button
                    key={m.emoji}
                    type={selectedMood === m.emoji ? "primary" : "default"}
                    onClick={() => setSelectedMood(m.emoji)}
                    style={{
                      fontSize: 20,
                      height: 50,
                      width: 50,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: selectedMood === m.emoji ? "none" : "1px solid rgba(255,255,255,0.1)",
                      background: selectedMood === m.emoji ? "#7c3aed" : "rgba(255,255,255,0.03)",
                    }}
                    title={m.label}
                  >
                    {m.emoji}
                  </Button>
                ))}
              </Space>
            </Form.Item>

            <Form.Item
              label={<Text style={{ color: "rgba(255,255,255,0.75)" }}><ThunderboltOutlined /> Enerji Seviyesi (1-10)</Text>}
              name="energyScore"
            >
              <Slider min={1} max={10} />
            </Form.Item>

            <Form.Item
              label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Diyet & Antrenman Planı Uyumu (%)</Text>}
              name="adherenceScore"
            >
              <Slider min={0} max={100} />
            </Form.Item>

            {/* Form Fotoğrafı Yükleme */}
            <Form.Item label={<Text style={{ color: "rgba(255,255,255,0.75)" }}><CameraOutlined /> Haftalık Form Fotoğrafı (İsteğe Bağlı)</Text>}>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handlePhotoChange}
                beforeUpload={() => false}
                maxCount={1}
              >
                {fileList.length < 1 && (
                  <div style={{ color: "rgba(255,255,255,0.65)" }}>
                    <CameraOutlined style={{ fontSize: 20 }} />
                    <div style={{ marginTop: 8 }}>Ekle</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item label={<Text style={{ color: "rgba(255,255,255,0.75)" }}>Haftalık Notlar / Yorumlar</Text>} name="notes">
              <TextArea rows={3} placeholder="Zorlandığın detaylar, kaçamaklar veya koçuna iletmek istediğin notlar..." />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large" style={{ borderRadius: 10 }}>
              Verileri Kaydet ve AI Coach Analizi Al
            </Button>
          </Form>
        </Card>

        {/* Geçmiş Kayıtlar */}
        <Card
          style={{
            background: "var(--bg-container)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Text strong style={{ color: "#fff" }}>Geçmiş Kayıtlar</Text>
          <Divider style={{ borderColor: "rgba(255,255,255,0.08)", margin: "12px 0" }} />

          {weeklyCheckins.length === 0 ? (
            <Empty description={<Text style={{ color: "rgba(255,255,255,0.45)" }}>Henüz check-in kaydı yok.</Text>} />
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
                  <Space style={{ justifyContent: "space-between", width: "100%" }} align="start">
                    <div>
                      <Space>
                        <Text strong style={{ color: "#fff" }}>{new Date(item.date).toLocaleDateString("tr-TR")}</Text>
                        <span style={{ fontSize: 16 }}>{item.mood}</span>
                      </Space>
                      <br />
                      <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                        {item.weightKg} kg ⬢ {item.waistCm ?? ""} cm bel
                        {item.bicepsCm != null ? ` ⬢ ${item.bicepsCm} cm biceps` : ""} ⬢ {item.sleepHours} saat uyku
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Uyum Derecesi</Text>
                        <Progress percent={item.adherenceScore} size="small" showInfo={false} strokeColor="#7c3aed" trailColor="rgba(255,255,255,0.08)" />
                      </div>
                      {item.notes && (
                        <div style={{ marginTop: 6 }}>
                          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}><b>Not:</b> {item.notes}</Text>
                        </div>
                      )}
                      {item.aiFeedback && (
                        <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(99,102,241,0.07)", borderLeft: "3px solid #818cf8", borderRadius: 4 }}>
                          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}><b>AI Öneri:</b> {item.aiFeedback}</Text>
                        </div>
                      )}
                    </div>

                    <Space direction="vertical" align="end">
                      {item.photoPath && (
                        <img
                          src={item.photoPath.startsWith('http') ? item.photoPath : getImageUrl(item.photoPath)}
                          alt="Checkin"
                          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                          onClick={() => {
                            setPreviewImage(item.photoPath.startsWith('http') ? item.photoPath : getImageUrl(item.photoPath));
                            setPreviewOpen(true);
                          }}
                        />
                      )}
                      <Popconfirm title="Bu kaydı silmek istiyor musun?" okText="Sil" cancelText="Vazgeç" onConfirm={() => handleDelete(item.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} style={{ marginTop: 4 }} />
                      </Popconfirm>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </motion.div>

      <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)} centered>
        <img alt="Form Fotoğrafı" style={{ width: "100%", borderRadius: 12 }} src={previewImage} />
      </Modal>
    </div>
  );
}
