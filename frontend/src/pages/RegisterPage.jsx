/**
 * FitPlate - Kayıt Sayfası (Lose It! tarzı - tam ekran adım adım)
 */
import { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";
import { authService } from "../services/authService";
import axios from "axios";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Title, Text } = Typography;

const GOALS = [
  { key: "lose", emoji: "🔥", title: "Kilo Vermek", sub: "Yağ yakarak ideal kiloma ulaşmak istiyorum" },
  { key: "gain", emoji: "💪", title: "Kas Kazanmak", sub: "Kas kütlemi artırıp güçlenmek istiyorum" },
  { key: "maintain", emoji: "⚖️", title: "Formda Kalmak", sub: "Kilomi koruyup sağlıklı yaşamak istiyorum" },
  { key: "health", emoji: "🥗", title: "Sağlıklı Beslenmek", sub: "Genel beslenme düzenimi iyileştirmek istiyorum" },
];

const GENDERS = [
  { key: "male", emoji: "👨", title: "Erkek" },
  { key: "female", emoji: "👩", title: "Kadın" },
  { key: "other", emoji: "🧑", title: "Belirtmek İstemiyorum" },
];

const ACTIVITY = [
  { key: "sedentary", title: "Hareketsiz", sub: "Çoğunlukla masa başında çalışırım" },
  { key: "light", title: "Az Hareketli", sub: "Haftada 1-2 kez hafif egzersiz yaparım" },
  { key: "moderate", title: "Orta Derecede Aktif", sub: "Haftada 3-4 kez egzersiz yaparım" },
  { key: "active", title: "Çok Aktif", sub: "Neredeyse her gün yoğun egzersiz yaparım" },
];

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  color: "#fff",
  height: 56,
  fontSize: 16,
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    goal: "", gender: "", age: "", height: "", weight: "", targetWeight: "", activity: "",
    name: "", email: "", password: "",
  });
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const TOTAL_STEPS = 7;

  const go = (d) => { setDir(d); setStep((s) => s + d); };
  const set = (key, val) => setData((p) => ({ ...p, [key]: val }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Hesap oluştur
      const { data: res } = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setAuth(res.user, res.token);

      // 2. Kalori hesapla
      const calMap = { sedentary: 1800, light: 2000, moderate: 2200, active: 2500 };
      const dailyCalorie = calMap[data.activity] || 2000;

      // 3. Tüm wizard verilerini backend'e kaydet
      const token = useAuthStore.getState().token;
      await axios.put(
        "http://localhost:8000/api/auth/profile",
        {
          goal:             data.goal,
          gender:           data.gender,
          age:              data.age ? parseInt(data.age) : null,
          height:           data.height ? parseFloat(data.height) : null,
          weight:           data.weight ? parseFloat(data.weight) : null,
          target_weight:    data.targetWeight ? parseFloat(data.targetWeight) : null,
          activity_level:   data.activity,
          daily_calorie_goal: dailyCalorie,
          onboarding_completed: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 4. Zustand store güncelle
      const userStore = useUserStore.getState();
      userStore.setDailyCalorieGoal(dailyCalorie);
      userStore.setOnboardingCompleted(true);

      message.success("Hoş geldiniz! 🎉");
      navigate("/feed");
    } catch (err) {
      const msg = err.response?.data?.errors?.join(" ") || err.response?.data?.message || "Kayıt başarısız.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  const OptionCard = ({ selected, onClick, emoji, title, sub, fullWidth }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      style={{
        padding: sub ? "20px 24px" : "28px 16px",
        borderRadius: 16, cursor: "pointer",
        textAlign: sub ? "left" : "center",
        display: "flex", alignItems: "center", gap: sub ? 16 : 0,
        flexDirection: sub ? "row" : "column",
        background: selected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
        border: `2px solid ${selected ? "#a78bfa" : "rgba(255,255,255,0.08)"}`,
        transition: "all 0.2s", width: fullWidth ? "100%" : "auto",
        marginBottom: sub ? 12 : 0,
      }}>
      {emoji && <div style={{ fontSize: sub ? 28 : 36, flexShrink: 0 }}>{emoji}</div>}
      <div>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: sub ? 16 : 15, marginTop: sub ? 0 : 8 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{sub}</div>}
      </div>
      {selected && sub && (
        <div style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 12 }}>✓</span>
        </div>
      )}
    </motion.div>
  );

  const steps = [
    // Step 0: Hedef
    {
      question: "Hedefin nedir?",
      sub: "Sana en uygun planı oluşturalım",
      canNext: !!data.goal,
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {GOALS.map((g) => (
            <OptionCard key={g.key} selected={data.goal === g.key} onClick={() => set("goal", g.key)}
              emoji={g.emoji} title={g.title} sub={g.sub} />
          ))}
        </div>
      ),
    },
    // Step 1: Cinsiyet
    {
      question: "Cinsiyetin nedir?",
      sub: "Kalori hesabını kişiselleştirmek için kullanılır",
      canNext: !!data.gender,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {GENDERS.map((g) => (
            <OptionCard key={g.key} selected={data.gender === g.key} onClick={() => set("gender", g.key)}
              emoji={g.emoji} title={g.title} sub="" fullWidth />
          ))}
        </div>
      ),
    },
    // Step 2: Yaş
    {
      question: "Kaç yaşındasın?",
      sub: "Günlük kalori ihtiyacını hesaplamak için",
      canNext: !!data.age && Number(data.age) > 0,
      content: (
        <div style={{ maxWidth: 260, margin: "0 auto", textAlign: "center" }}>
          <Input type="number" value={data.age} onChange={(e) => set("age", e.target.value)}
            placeholder="Örn. 25" suffix={<span style={{ color: "rgba(255,255,255,0.3)" }}>yaş</span>}
            style={{ ...inputStyle, fontSize: 28, textAlign: "center", height: 72 }} />
        </div>
      ),
    },
    // Step 3: Boy & Kilo
    {
      question: "Boyun ve kilonu gir",
      sub: "Günlük kalori hedefini hesaplayalım",
      canNext: !!data.height && !!data.weight,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 360, margin: "0 auto" }}>
          <div>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8, display: "block" }}>Boy</Text>
            <Input type="number" value={data.height} onChange={(e) => set("height", e.target.value)}
              placeholder="175" suffix={<span style={{ color: "rgba(255,255,255,0.3)" }}>cm</span>} style={inputStyle} />
          </div>
          <div>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8, display: "block" }}>Mevcut Kilo</Text>
            <Input type="number" value={data.weight} onChange={(e) => set("weight", e.target.value)}
              placeholder="75" suffix={<span style={{ color: "rgba(255,255,255,0.3)" }}>kg</span>} style={inputStyle} />
          </div>
        </div>
      ),
    },
    // Step 4: Hedef kilo
    {
      question: "Hedef kilonuz ne?",
      sub: "Ulaşmak istediğin kilo",
      canNext: !!data.targetWeight,
      content: (
        <div style={{ maxWidth: 260, margin: "0 auto", textAlign: "center" }}>
          <Input type="number" value={data.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
            placeholder={data.weight || "68"} suffix={<span style={{ color: "rgba(255,255,255,0.3)" }}>kg</span>}
            style={{ ...inputStyle, fontSize: 28, textAlign: "center", height: 72 }} />
          {data.weight && data.targetWeight && (
            <div style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <Text style={{ color: "#a78bfa", fontWeight: 600 }}>
                {Number(data.weight) > Number(data.targetWeight)
                  ? `${(Number(data.weight) - Number(data.targetWeight)).toFixed(1)} kg vermek istiyorsun 💪`
                  : `${(Number(data.targetWeight) - Number(data.weight)).toFixed(1)} kg almak istiyorsun 🏋️`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    // Step 5: Aktivite
    {
      question: "Aktivite seviyeni seç",
      sub: "Günlük yaşam tarzın nasıl?",
      canNext: !!data.activity,
      content: (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ACTIVITY.map((a) => (
            <OptionCard key={a.key} selected={data.activity === a.key} onClick={() => set("activity", a.key)}
              title={a.title} sub={a.sub} fullWidth />
          ))}
        </div>
      ),
    },
    // Step 6: Hesap bilgileri
    {
      question: "Hesabını oluştur",
      sub: "Son adım — neredeyse tamam!",
      canNext: !!data.name && !!data.email && data.password.length >= 6,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 380, margin: "0 auto" }}>
          <Input prefix={<UserOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
            placeholder="Adınız Soyadınız" value={data.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
          <Input prefix={<MailOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
            placeholder="E-posta adresiniz" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} />
          <Input.Password prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
            placeholder="Şifre (en az 6 karakter)" value={data.password} onChange={(e) => set("password", e.target.value)} style={inputStyle} />
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
            Kayıt olarak{" "}
            <span style={{ color: "#a78bfa" }}>Kullanım Koşulları</span>nı kabul etmiş olursunuz.
          </Text>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div style={{
      minHeight: "100vh", background: "#080812", display: "flex", flexDirection: "column",
      color: "#fff",
    }}>
      {/* TOP BAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={appLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: 7 }} />
          <span style={{ fontWeight: 800, color: "#a78bfa", fontSize: 18 }}>FitPlate</span>
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1, margin: "0 32px", maxWidth: 400 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6, overflow: "hidden" }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 4 }} />
          </div>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4, display: "block", textAlign: "center" }}>
            {step + 1} / {TOTAL_STEPS}
          </Text>
        </div>

        <Link to="/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Giriş Yap
        </Link>
      </div>

      {/* STEP CONTENT */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Question */}
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <Title style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", marginBottom: 8 }}>
                  {current.question}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
                  {current.sub}
                </Text>
              </div>

              {/* Step content */}
              {current.content}

              {/* Navigation */}
              <div style={{ display: "flex", gap: 12, marginTop: 36, justifyContent: "center" }}>
                {step > 0 && (
                  <Button onClick={() => go(-1)}
                    style={{ height: 52, borderRadius: 14, borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "transparent", width: 52 }}
                    icon={<ArrowLeftOutlined />} />
                )}

                {step < TOTAL_STEPS - 1 ? (
                  <Button type="primary" disabled={!current.canNext} onClick={() => go(1)}
                    style={{ height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16, flex: 1, maxWidth: 320 }}
                    icon={<ArrowRightOutlined />}>
                    Devam Et
                  </Button>
                ) : (
                  <Button type="primary" disabled={!current.canNext} loading={loading} onClick={handleFinish}
                    style={{ height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16, flex: 1, maxWidth: 320 }}>
                    🎉 Hesabımı Oluştur
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
