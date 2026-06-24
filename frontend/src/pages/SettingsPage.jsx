/**
 * FitPlate - Ayarlar Sayfası
 */
import React, { useState, useEffect } from "react";
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
  Avatar,
  Upload,
  message,
} from "antd";
import {
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useUserStore } from "../stores/useUserStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { getImageUrl } from "../../utils/helpers";

const { Title, Text, Paragraph } = Typography;

const coachOptions = [
  { value: "demir", label: " Demir  Sert & Disiplinli" },
  { value: "ipek", label: "R İpek  Nazik & Destekleyici" },
  { value: "zen", label: " Zen  Dengeli & Bilge" },
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
    profileVisibility,
    setProfileVisibility,
    waterReminderEnabled,
    setWaterReminderEnabled,
    weeklyReportEmail,
    setWeeklyReportEmail,
    mealReminderEnabled,
    setMealReminderEnabled,
  } = useUserStore();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameForm] = Form.useForm();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAvatarUpload = async (info) => {
    if (info.file.status === "uploading") return;
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Str = reader.result;
        const res = await authService.updateProfile({ photo_base64: base64Str });
        if (res.data?.user) {
          setUser(res.data.user);
          toast.success("Profil fotoğrafı güncellendi.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Profil fotoğrafı yüklenemedi.");
      }
    };
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
      toast.error(err?.response?.data?.message || "Şifre değiştirilemedi.");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    // Ayarlar sayfası açıldığında en güncel profil verisini al
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Profil güncellenemedi", err);
      }
    };
    fetchProfile();
  }, [setUser]);

  const handleChangeUsername = async (values) => {
    setUsernameLoading(true);
    try {
      const res = await authService.updateProfile({
        username: values.username,
      });
      if (res.data?.user) {
        setUser(res.data.user);
        toast.success("Kullanıcı adınız başarıyla güncellendi");
        setUsernameModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Kullanıcı adı güncellenemedi");
    } finally {
      setUsernameLoading(false);
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

        {/* Profil Kartı */}
        <Card
          style={{
            background: "var(--bg-container)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 16,
            textAlign: "center",
            padding: "20px 0",
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar
              size={80}
              src={getImageUrl(user?.profile_photo)}
              icon={!user?.profile_photo && <UserOutlined />}
              style={{ border: "2px solid #a78bfa" }}
            />
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarUpload}
              accept="image/*"
            >
              <Button
                shape="circle"
                icon={<CameraOutlined />}
                size="small"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#7c3aed",
                  color: "#fff",
                  border: "none",
                }}
              />
            </Upload>
          </div>
          <Title level={4} style={{ color: "#fff", marginTop: 12, marginBottom: 4 }}>
            {user?.name}
          </Title>
          <Text style={{ color: "#a78bfa", display: 'block', marginBottom: 4 }}>
            @{user?.username}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            {user?.email}
          </Text>
        </Card>

        {/* Beslenme Ayarları */}
        <Card
          style={{
            background: "var(--bg-container)",
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
            icon=""
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
            icon={<EyeInvisibleOutlined />}
            label="Profil Gizliliği"
            description="Sadece arkadaşlarım görsün"
          >
            <Switch
              checked={profileVisibility === "private"}
              onChange={(checked) => setProfileVisibility(checked ? "private" : "public")}
            />
          </SettingRow>
        </Card>

        {/* Bildirim Ayarları */}
        <Card
          style={{
            background: "var(--bg-container)",
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
            icon="️"
            label="Öğün Hatırlatıcı"
            description="Yemek girişi için günlük hatırlatma"
          >
            <Switch
              checked={mealReminderEnabled ?? true}
              onChange={setMealReminderEnabled}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon=""
            label="Su İçme Hatırlatıcısı"
            description="Gün içinde su içmeniz için bildirim gönderir"
          >
            <Switch
              checked={waterReminderEnabled ?? true}
              onChange={setWaterReminderEnabled}
            />
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

          <SettingRow
            icon={<MailOutlined />}
            label="Haftalık Rapor E-postası"
            description="Gelişiminizi her pazar e-postanıza göndeririz"
          >
            <Switch
              checked={weeklyReportEmail ?? true}
              onChange={setWeeklyReportEmail}
            />
          </SettingRow>
        </Card>

        {/* Hesap */}
        <Card
          style={{
            background: "var(--bg-container)",
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

          <SettingRow icon={<UserOutlined />} label="Kullanıcı Adı">
            <Button
              size="small"
              style={{ borderRadius: 8 }}
              onClick={() => {
                usernameForm.setFieldsValue({ username: user?.username });
                setUsernameModalOpen(true);
              }}
            >
              Değiştir
            </Button>
          </SettingRow>

          <Divider
            style={{ margin: 0, borderColor: "rgba(255,255,255,0.04)" }}
          />

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

      {/* Kullanıcı Adı Değiştir Modalı */}
      <Modal
        title="Kullanıcı Adı Değiştir"
        open={usernameModalOpen}
        onCancel={() => setUsernameModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={usernameForm}
          layout="vertical"
          onFinish={handleChangeUsername}
          autoComplete="off"
        >
          <Form.Item
            label="Yeni Kullanıcı Adı"
            name="username"
            rules={[
              { required: true, message: "Kullanıcı adı girin" },
              { min: 3, message: "En az 3 karakter olmalıdır" },
              { pattern: /^[a-zA-Z0-9_]+$/, message: "Sadece harf, rakam ve alt çizgi kullanabilirsiniz" }
            ]}
            extra="Sadece İngilizce harfler, rakamlar ve alt çizgi (_) kullanabilirsiniz."
          >
            <Input placeholder="Kullanıcı adı (örn: cool_user99)" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={usernameLoading}
            block
            style={{ borderRadius: 8, height: 40 }}
          >
            Kaydet
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
