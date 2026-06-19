/**
 * FitPlate - Şifre Sıfırlama Sayfası
 */
import { useState, useEffect } from "react";
import { Input, Button, Typography, message } from "antd";
import { LockOutlined, CheckCircleFilled } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setTokenValid(false);
  }, [token]);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Zayıf", "Orta", "Güçlü"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#34d399"][strength];

  const handleReset = async () => {
    if (password.length < 6) { message.warning("Şifre en az 6 karakter olmalı."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Geçersiz veya süresi dolmuş link.";
      message.error(msg);
      if (err.response?.status === 404 || err.response?.status === 410) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, color: "#fff", height: 56, fontSize: 16,
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
            Yeni Şifre Belirle
          </Title>
        </div>

        {!tokenValid ? (
          <div style={{
            textAlign: "center", padding: "32px 24px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
            <Title level={4} style={{ color: "#fff", marginBottom: 8 }}>Link Geçersiz</Title>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Sıfırlama linki geçersiz veya süresi dolmuş.
            </Text>
            <div style={{ marginTop: 20 }}>
              <Link to="/forgot-password">
                <Button type="primary" style={{ borderRadius: 10 }}>Yeni Link İste</Button>
              </Link>
            </div>
          </div>
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: "center", padding: "32px 24px",
              background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20,
            }}
          >
            <CheckCircleFilled style={{ fontSize: 48, color: "#34d399", marginBottom: 16 }} />
            <Title level={4} style={{ color: "#fff", marginBottom: 8 }}>Şifren Sıfırlandı!</Title>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Yeni şifrenle giriş yapabilirsin.
            </Text>
            <div style={{ marginTop: 20 }}>
              <Button type="primary" onClick={() => navigate("/login")}
                style={{ borderRadius: 10, fontWeight: 700 }}>
                Giriş Yap
              </Button>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
              placeholder="Yeni şifren (en az 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            {/* Şifre güç göstergesi */}
            {password.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  {[1, 2, 3].map((lvl) => (
                    <div key={lvl} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: strength >= lvl ? strengthColor : "rgba(255,255,255,0.1)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <Text style={{ color: strengthColor, fontSize: 12 }}>{strengthLabel}</Text>
              </div>
            )}

            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
              placeholder="Şifren tekrar"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
            />

            <Button
              type="primary" block loading={loading} onClick={handleReset}
              disabled={!password || !confirm || password !== confirm}
              style={{
                height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16,
                background: "linear-gradient(135deg, #7c3aed, #9333ea)", border: "none",
              }}
            >
              Şifremi Sıfırla
            </Button>

            {confirm && password !== confirm && (
              <Text style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>
                Şifreler eşleşmiyor
              </Text>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link to="/login" style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            ← Giriş sayfasına dön
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
