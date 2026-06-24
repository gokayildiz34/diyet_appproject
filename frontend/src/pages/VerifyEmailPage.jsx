/**
 * FitPlate - E-posta Doğrulama Sayfası (OTP)
 */
import { useState, useRef, useEffect } from "react";
import { Typography, Button, message } from "antd";
import { ArrowRightOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Title, Text } = Typography;

export default function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const email = new URLSearchParams(location.search).get("email") || "e-postanız";

  // Focus on first input on mount
  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).replace(/[^0-9]/g, "");
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      const nextIndex = Math.min(pastedData.length, 5);
      inputs.current[nextIndex].focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      message.error("Lütfen 6 haneli kodu eksiksiz girin.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", {
        code: fullCode,
      });
      setAuth(data.user, data.token);

      // Check if we have onboarding data
      const onboardingData = location.state?.onboardingData;
      if (onboardingData) {
        await api.put("/auth/profile", onboardingData, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        
        // Update Zustand
        const userStore = useUserStore.getState();
        userStore.setDailyCalorieGoal(onboardingData.daily_calorie_goal);
        userStore.setOnboardingCompleted(true);
      }
      message.success(data.message || "E-posta başarıyla doğrulandı!");
      navigate("/feed"); // Directly to feed since onboarding is done
    } catch (err) {
      const msg = err.response?.data?.message || "Doğrulama başarısız.";
      message.error(msg);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080812",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
          }}
        >
          <MailOutlined style={{ fontSize: 32, color: "#fff" }} />
        </div>

        <Title level={3} style={{ color: "#fff", marginBottom: 8, fontWeight: 800 }}>
          E-postanızı Doğrulayın
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, display: "block", marginBottom: 32 }}>
          Lütfen <strong>{email}</strong> adresine gönderdiğimiz 6 haneli kodu girin.
        </Text>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              style={{
                width: 48,
                height: 56,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#a78bfa")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          ))}
        </div>

        <Button
          type="primary"
          loading={loading}
          onClick={handleVerify}
          icon={<ArrowRightOutlined />}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            border: "none",
          }}
        >
          Doğrula ve Başla
        </Button>

        <div style={{ marginTop: 24 }}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Kod gelmedi mi?{" "}
            <a href="#" style={{ color: "#a78bfa", fontWeight: 600 }}>
              Tekrar Gönder
            </a>
          </Text>
        </div>
      </motion.div>
    </div>
  );
}
