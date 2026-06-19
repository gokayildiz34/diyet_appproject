/**
 * FitPlate - Ayarlar Sayfası
 */
import { useState } from "react";
import {
  Card,
  Typography,
  Switch,
  Divider,
  Select,
  Button,
  InputNumber,
  Input,
  Modal,
  Form,
} from "antd";
import {
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useUserStore } from "../stores/useUserStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const { Title, Text } = Typography;

const coachOptions = [
  { value: "demir", label: "🦾 Demir — Sert & Disiplinli" },
  { value: "ipek", label: "🌸 İpek — Nazik & Destekleyici" },
  { value: "zen", label: "🧘 Zen — Dengeli & Bilge" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const {
    coachPersona,
    setCoachPersona,
    dailyCalorieGoal,
    setDailyCalorieGoal,
    notificationsEnabled,
    setNotificationsEnabled,
    autoShareDietEnabled,
    setAutoShareDietEnabled,
    autoShareDietTime,
    setAutoShareDietTime,
    mealReminderEnabled,
    setMealReminderEnabled,
  } = useUserStore();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /** Koç değişince backend'e sync */
  const handleCoachChange = async (persona) => {
    setCoachPersona(persona);
    try {
      await authService.updateProfile({ coach_persona: persona });
    } catch {
      // Backend'e erişilemezse local yeterli
    }
  };

  /** Kalori hedefi değişince backend'e sync */
  const handleCalorieGoalChange = async (goal) => {
    setDailyCalorieGoal(goal);
    try {
      await authService.updateProfile({ daily_calorie_goal: goal });
    } catch {
      // Backend'e erişilemezse local yeterli
    }
  };

  /** Şifre değiştir */
  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      toast.success("Şifre başarıyla değiştirildi.");
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Şifre değiştirilemedi.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const SettingRow = ({ icon, label, description, children }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(124,58,237,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a78bfa",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <Text style={{ color: "#fff", fontSize: 14 }}>{label}</Text>
          {description && (
            <>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                {description}
              </Text>
            </>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Title level={3} style={{ color: "#fff", marginBottom: 20 }}>
          <SettingOutlined style={{ marginRight: 10, color: "#a78bfa" }} />
          Ayarlar
        </Title>

        {/* Beslenme Ayarları */}
        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 16,
          }}
          styles={{ body: { padding: "4px 24px" } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              letterSpacing: 0.5,
              display: "block",
              paddingTop: 16,
            }}
          >
            BESLENME
          </Text>

          <SettingRow
            icon={<UserOutlined />}
            label="Beslenme Koçu"
            description="Yorum tarzınızı belirler"
          >
            <Select
              value={coachPersona}
              onChange={handleCoachChange}
              options={coachOptions}
              style={{ width: 220 }}
              popupMatchSelectWidth={false}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon="🎯"
            label="Günlük Kalori Hedefi"
            description="Koçunuz bu hedefe göre yönlendirir"
          >
            <InputNumber
              value={dailyCalorieGoal}
              onChange={handleCalorieGoalChange}
              min={1000}
              max={5000}
              step={100}
              suffix="kcal"
              style={{ width: 130 }}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon="🤖"
            label="Koç Diyet Listesi Otomatik Paylaşım"
            description="Koçun günlük planı belirlediğiniz saatte otomatik paylaşılır"
          >
            <Switch
              checked={autoShareDietEnabled}
              onChange={setAutoShareDietEnabled}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon="⏰"
            label="Otomatik Paylaşım Saati"
            description="Örnek: 08:30"
          >
            <Input
              type="time"
              value={autoShareDietTime}
              onChange={(e) => setAutoShareDietTime(e.target.value)}
              disabled={!autoShareDietEnabled}
              style={{ width: 120 }}
            />
          </SettingRow>
        </Card>

        {/* Bildirim Ayarları */}
        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 16,
          }}
          styles={{ body: { padding: "4px 24px" } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              letterSpacing: 0.5,
              display: "block",
              paddingTop: 16,
            }}
          >
            BİLDİRİMLER
          </Text>

          <SettingRow
            icon={<BellOutlined />}
            label="Bildirimler"
            description="Koç yorumları ve topluluk etkileşimleri"
          >
            <Switch
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon="🍽️"
            label="Öğün Hatırlatıcı"
            description="Yemek girişi için günlük hatırlatma"
          >
            <Switch
              checked={mealReminderEnabled ?? true}
              onChange={setMealReminderEnabled}
            />
          </SettingRow>
        </Card>

        {/* Hesap */}
        <Card
          style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: "4px 24px" } }}
        >
          <Text
            strong
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              letterSpacing: 0.5,
              display: "block",
              paddingTop: 16,
            }}
          >
            HESAP
          </Text>

          <SettingRow icon={<LockOutlined />} label="Şifre Değiştir">
            <Button
              size="small"
              style={{ borderRadius: 8 }}
              onClick={() => setPasswordModalOpen(true)}
            >
              Değiştir
            </Button>
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <div style={{ padding: "16px 0" }}>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              style={{ borderRadius: 10, height: 42 }}
            >
              Çıkış Yap
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Şifre Değiştir Modalı */}
      <Modal
        title="Şifre Değiştir"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          autoComplete="off"
        >
          <Form.Item
            label="Mevcut Şifre"
            name="currentPassword"
            rules={[{ required: true, message: "Mevcut şifrenizi girin" }]}
          >
            <Input.Password placeholder="Mevcut şifre" />
          </Form.Item>

          <Form.Item
            label="Yeni Şifre"
            name="newPassword"
            rules={[
              { required: true, message: "Yeni şifrenizi girin" },
              { min: 6, message: "En az 6 karakter olmalıdır" },
            ]}
          >
            <Input.Password placeholder="Yeni şifre" />
          </Form.Item>

          <Form.Item
            label="Yeni Şifre Tekrar"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Şifreyi tekrar girin" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Şifreler eşleşmiyor"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Yeni şifre tekrar" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={passwordLoading}
            block
            style={{ borderRadius: 10 }}
          >
            Şifreyi Değiştir
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
