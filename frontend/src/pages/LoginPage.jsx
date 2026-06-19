/**
 * FitPlate - Giriş Sayfası (Sade & Minimal)
 */
import { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";
import { authService } from "../services/authService";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) { message.warning("Tüm alanları doldurun."); return; }
    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });
      setAuth(data.user, data.token);

      const userStore = useUserStore.getState();
      if (data.user.membership_tier) userStore.setMembershipTier(data.user.membership_tier);
      if (data.user.coach_persona) userStore.setCoachPersona(data.user.coach_persona);
      if (data.user.daily_calorie_goal) userStore.setDailyCalorieGoal(data.user.daily_calorie_goal);
      if (data.user.onboarding_completed) userStore.setOnboardingCompleted(true);

      message.success("Hoş geldiniz 👋");
      navigate("/feed");
    } catch (err) {
      message.error(err.response?.data?.message || "E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    color: "#fff",
    height: 56,
    fontSize: 16,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080812",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 400, position: "relative" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{ display: "inline-block", cursor: "pointer" }}
            onClick={() => navigate("/")}>
            <img src={appLogo} alt="FitPlate" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 12 }} />
          </motion.div>
          <Title style={{
            fontWeight: 900, fontSize: 34, marginBottom: 6,
            background: "linear-gradient(135deg, #fff 0%, #c4b5fd 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            FitPlate'e Hoş Geldin
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
            Hesabına giriş yap ve devam et
          </Text>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Input
              prefix={<MailOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
              placeholder="E-posta adresin"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleLogin}
              style={inputStyle}
            />
          </div>
          <div>
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
              placeholder="Şifren"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleLogin}
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: "right", marginTop: -4 }}>
            <Link to="/forgot-password" style={{ color: "#a78bfa", fontSize: 13, fontWeight: 500 }}>
              Şifremi unuttum
            </Link>
          </div>

          <Button
            type="primary"
            block
            loading={loading}
            onClick={handleLogin}
            style={{
              height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16, marginTop: 4,
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              border: "none", boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
            }}
          >
            Giriş Yap
          </Button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>veya</Text>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Register link */}
        <div style={{ textAlign: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
            Hesabın yok mu?{" "}
            <Link to="/register" style={{ color: "#a78bfa", fontWeight: 700, fontSize: 15 }}>
              Ücretsiz Kayıt Ol
            </Link>
          </Text>
        </div>

        {/* Back to landing */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/" style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            ← Ana sayfaya dön
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <Text style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, marginTop: 40 }}>
        FitPlate © 2025 — Akıllı Beslenme Platformu
      </Text>
    </div>
  );
}
