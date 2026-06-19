/**
 * FitPlate - Şifremi Unuttum Sayfası
 */
import { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { MailOutlined, ArrowLeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { message.warning("E-posta adresinizi girin."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Güvenlik gereği her durumda başarılı göster
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080812",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 400, position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link to="/">
            <img src={appLogo} alt="FitPlate" style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 12 }} />
          </Link>
          <Title style={{
            fontWeight: 900, fontSize: 28, marginBottom: 6,
            background: "linear-gradient(135deg, #fff 0%, #c4b5fd 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Şifreni mi unuttun?
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
            {sent
              ? "Linki e-postana gönderdik"
              : "E-posta adresini gir, sıfırlama linkini gönderelim"}
          </Text>
        </div>

        {!sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              prefix={<MailOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
              placeholder="E-posta adresin"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleSubmit}
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, color: "#fff", height: 56, fontSize: 16,
              }}
            />
            <Button
              type="primary" block loading={loading} onClick={handleSubmit}
              style={{
                height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16,
                background: "linear-gradient(135deg, #7c3aed, #9333ea)", border: "none",
              }}
            >
              Sıfırlama Linki Gönder
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: "center", padding: "32px 24px",
              background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 20,
            }}
          >
            <CheckCircleFilled style={{ fontSize: 48, color: "#34d399", marginBottom: 16 }} />
            <Title level={4} style={{ color: "#fff", marginBottom: 8 }}>E-posta Gönderildi!</Title>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>
              <strong style={{ color: "#a78bfa" }}>{email}</strong> adresine sıfırlama linki gönderdik.
              Gelen kutunu kontrol et. Spam klasörüne de bakabilirsin.
            </Text>
            <div style={{ marginTop: 20 }}>
              <Button onClick={() => setSent(false)}
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", background: "transparent", borderRadius: 10 }}>
                Farklı e-posta dene
              </Button>
            </div>
          </motion.div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link to="/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeftOutlined /> Giriş sayfasına dön
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
