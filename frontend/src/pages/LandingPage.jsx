/**
 * FitPlate - Landing Page
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button, Typography, Collapse } from "antd";
import {
  FireOutlined,
  RobotOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  StarFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import appLogo from "../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";
import heroFood from "../assets/hero_food.png";
import appMockup from "../assets/app_mockup.png";
import aiCoach from "../assets/ai_coach.png";

const { Title, Text, Paragraph } = Typography;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: <FireOutlined style={{ fontSize: 28, color: "#f59e0b" }} />,
    title: "Kalori & Makro Takibi",
    desc: "Günlük beslenmeni akıllıca takip et. Protein, karbonhidrat ve yağ dengeni koru.",
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28, color: "#a78bfa" }} />,
    title: "AI Koç",
    desc: "Kişisel yapay zeka koçun sana özel diyet planı oluşturur, sorularını yanıtlar.",
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28, color: "#34d399" }} />,
    title: "Sosyal Topluluk",
    desc: "Arkadaşlarınla bağlan, motivasyon paylaş, birbirinizi destekleyin.",
  },
  {
    icon: <CalendarOutlined style={{ fontSize: 28, color: "#60a5fa" }} />,
    title: "Haftalık Check-in",
    desc: "Her hafta kiloni ve ilerlemeni kaydet. Uzun vadeli dönüşümünü gör.",
  },
];

const stats = [
  { value: "4", label: "Farklı AI Koç", suffix: "" },
  { value: "3", label: "Üyelik Planı", suffix: "" },
  { value: "100+", label: "Takip Edilebilir Besin", suffix: "" },
  { value: "7/24", label: "AI Destek", suffix: "" },
];

const steps = [
  { num: "01", title: "Hesap Oluştur", desc: "Dakikalar içinde ücretsiz kayıt ol. E-posta yeterli." },
  { num: "02", title: "Koçunu Seç", desc: "Demir, Aylin veya Can — sana en uygun AI koç tipini belirle." },
  { num: "03", title: "Takibe Başla", desc: "Kalori, makro ve haftalık check-in ile hedefine ilerle." },
];

const testimonials = [
  {
    name: "Zeynep K.",
    role: "Yazılım Geliştiricisi",
    text: "AI koç özelliği hayatımı değiştirdi. Artık ne yediğimi gerçekten takip edebiliyorum.",
    stars: 5,
    initial: "Z",
    color: "#a78bfa",
  },
  {
    name: "Mert A.",
    role: "Spor Antrenörü",
    text: "Müşterilerime de tavsiye ediyorum. Haftalık check-in sistemi müthiş motive ediyor.",
    stars: 5,
    initial: "M",
    color: "#34d399",
  },
  {
    name: "Elif S.",
    role: "İş İnsanı",
    text: "Yoğun tempoda bile beslenme düzenimi koruyabiliyorum. Uygulama çok sezgisel.",
    stars: 5,
    initial: "E",
    color: "#f59e0b",
  },
];

const faqItems = [
  {
    key: "1",
    label: "FitPlate ücretsiz mi?",
    children: "Evet, temel özellikler tamamen ücretsiz. Kalori takibi, sosyal feed ve haftalık check-in üstsiz sunulmaktadır. AI koç ve gelişmiş özellikler için Bronze, Gold veya Diamond plan seçebilirsiniz.",
  },
  {
    key: "2",
    label: "AI koç nasıl çalışır?",
    children: "Yapay zeka modelimiz senin beslenme geçmişine ve hedeflerine göre kişisel öneriler üretir. Demir, Aylin veya Can karakterlerinden birini seçerek farklı motivasyon tarzlarını deneyimleyebilirsin.",
  },
  {
    key: "3",
    label: "Üelyiği ne zaman iptal edebilirim?",
    children: "Dilediğin zaman iptal edebilirsin. Abonelik dönemi sonuna kadar premium özelliklerden yararlanmaya devam edersin. Ekstra ücret ya da ceza uygulanmaz.",
  },
  {
    key: "4",
    label: "Verilerim güvende mi?",
    children: "Tüm veriler şifreli bağlantı (HTTPS) ile iletilir ve güvenli sunucularda saklanır. Kişisel beslenme verilerini asla üçüncü taraflarla paylaymıyoruz.",
  },
  {
    key: "5",
    label: "Birden fazla kullanıcı hesabı açabilir miyim?",
    children: "Her e-posta adresi için ayrı bir hesap oluşturulabilir. Aile üyeleri farklı hesaplarla platforma katılabilir.",
  },
];

const plans = [
  {
    name: "Free",
    price: "Ücretsiz",
    color: "#6b7280",
    features: ["Kalori takibi", "Sosyal feed", "Haftalık check-in"],
  },
  {
    name: "Bronze",
    price: "149₺/ay",
    color: "#cd7f32",
    features: ["Temel AI koç önerileri", "Haftalık özet raporu", "Topluluk akışı erişimi"],
  },
  {
    name: "Gold",
    price: "299₺/ay",
    color: "#f59e0b",
    popular: true,
    features: ["Gelişmiş AI koç yorumları", "Günlük kişiselleştirilmiş diyet planı", "Öncelikli destek"],
  },
  {
    name: "Diamond",
    price: "499₺/ay",
    color: "#38bdf8",
    features: ["Sınırsız fotoğraf analizi", "Canlı koç öneri simülasyonu", "Özel premium topluluk alanı"],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div style={{ background: "#080812", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>

      {/* SCROLL PROGRESS */}
      <motion.div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 200,
          background: "linear-gradient(90deg, #7c3aed, #a78bfa, #60a5fa)",
          transformOrigin: "0%",
          scaleX,
        }}
      />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(8,8,18,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={appLogo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.5px" }}>FitPlate</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={() => navigate("/login")} style={{ borderRadius: 8, borderColor: "rgba(167,139,250,0.4)", color: "#a78bfa", background: "transparent" }}>
            Giriş Yap
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "100px 48px 60px",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 420px" }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <Title style={{
                fontSize: "clamp(42px, 5vw, 68px)", fontWeight: 900, lineHeight: 1.1, margin: 0,
                background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 60%, #818cf8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Beslenmenizi<br />Zekice Yönetin
              </Title>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} style={{ marginTop: 20 }}>
              <Paragraph style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 480 }}>
                AI koçunuz, kalori takibiniz ve sosyal topluluğunuzla sağlıklı yaşam hedeflerinize ulaşın.
              </Paragraph>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} style={{ marginTop: 36 }}>
              <Button
                type="primary" size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate("/register")}
                style={{ height: 52, padding: "0 32px", borderRadius: 12, fontWeight: 700, fontSize: 16 }}
              >
                Ücretsiz Deneyin
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} style={{ marginTop: 32, display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["Bronze 149₺/ay", "Gold 299₺/ay", "Diamond 499₺/ay"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                  <CheckCircleFilled style={{ color: "#34d399" }} /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            style={{ flex: "1 1 380px", position: "relative" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div style={{
              borderRadius: 24, overflow: "hidden",
              boxShadow: "0 40px 120px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
            }}>
              <img src={heroFood} alt="Sağlıklı yemekler" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 460 }} />
            </div>
            {/* Floating stat card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute", bottom: -20, left: -20,
                background: "rgba(18,18,42,0.95)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(167,139,250,0.25)", borderRadius: 16,
                padding: "14px 20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>GÜNLÜK KALORİ</Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa", lineHeight: 1.2 }}>1,840</div>
              <Text style={{ color: "#34d399", fontSize: 12 }}>↓ Hedefin altında 🎯</Text>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ padding: "40px 48px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 32 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 36, fontWeight: 900, color: "#a78bfa" }}>{s.value}</div>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{s.label}</Text>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <Title level={2} style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3.5vw, 46px)" }}>
              Her şey tek yerde
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 17 }}>
              Sağlıklı yaşam için ihtiyacın olan tüm araçlar
            </Text>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 28,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{f.title}</div>
                <Text style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{f.desc}</Text>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI COACH SECTION */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" }}>
          <motion.div
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            style={{ flex: "1 1 400px" }}
          >
            <img src={aiCoach} alt="AI Koç" style={{ width: "100%", borderRadius: 24, boxShadow: "0 30px 100px rgba(124,58,237,0.3)" }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            style={{ flex: "1 1 380px" }}
          >
            <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>YAPAY ZEKA KOÇU</span>
            <Title level={2} style={{ color: "#fff", fontWeight: 800, marginTop: 12, fontSize: "clamp(28px, 3vw, 42px)" }}>
              Kişisel koçunuz<br />7/24 yanınızda
            </Title>
            <Paragraph style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.8 }}>
              Demir, Ayşe veya Can — dilediğin kişilik tipinde AI koçun sana özel beslenme planı hazırlar.
              Sorularını sor, anlık tavsiyeler al, hedeflerine daha hızlı ulaş.
            </Paragraph>

          </motion.div>
        </div>
      </section>

      {/* APP MOCKUP */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" }}>
          <motion.div
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            style={{ flex: "1 1 380px" }}
          >
            <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>AKILLI TAKİP</span>
            <Title level={2} style={{ color: "#fff", fontWeight: 800, marginTop: 12, fontSize: "clamp(28px, 3vw, 42px)" }}>
              İstatistikler ve<br />ilerleme takibi
            </Title>
            <Paragraph style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.8 }}>
              Haftalık check-in'ler, kalori grafikleri ve makro dağılımıyla sağlık yolculuğunu görselleştir.
            </Paragraph>
            {["Günlük kalori takibi", "Haftalık kilo grafiği", "Makro besin dengesi", "Streak & başarımlar"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <CheckCircleFilled style={{ color: "#60a5fa" }} />
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>{item}</Text>
              </div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            style={{ flex: "1 1 400px" }}
          >
            <img src={appMockup} alt="Uygulama" style={{ width: "100%", borderRadius: 24, boxShadow: "0 30px 100px rgba(96,165,250,0.2)" }} />
          </motion.div>
        </div>
      </section>

      {/* NASIL CALISIR */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <Title level={2} style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3.5vw, 46px)" }}>3 Adımda Başla</Title>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 17 }}>Dakikalar içinde hazırsın</Text>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
            {steps.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }} viewport={{ once: true }}
                style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
              >
                <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(167,139,250,0.2)", lineHeight: 1, flexShrink: 0 }}>{s.num}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{s.title}</div>
                  <Text style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{s.desc}</Text>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <Title level={2} style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3.5vw, 46px)" }}>Kullanıcılar ne diyor?</Title>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[...Array(t.stars)].map((_, j) => <StarFilled key={j} style={{ color: "#f59e0b", fontSize: 14 }} />)}
                </div>
                <Paragraph style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</Paragraph>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>{t.initial}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{t.name}</div>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{t.role}</Text>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <Title level={2} style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3.5vw, 46px)" }}>Sık Sorulan Sorular</Title>
          </motion.div>
          <Collapse
            items={faqItems}
            ghost
            expandIconPosition="end"
            style={{ background: "transparent" }}
            styles={{
              header: { color: "#fff", fontSize: 16, fontWeight: 600, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" },
              body: { color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.8, paddingBottom: 16 },
            }}
          />
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <Title level={2} style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3.5vw, 46px)" }}>
              Sana uygun plan
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 17 }}>7 gün ücretsiz dene, istediğin zaman iptal et</Text>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                style={{
                  background: plan.popular ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${plan.popular ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 24, padding: 32, position: "relative",
                }}
              >
                {plan.popular && (
                  <span style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                    borderRadius: 100, padding: "4px 16px", fontSize: 12, fontWeight: 700, color: "#fff",
                    whiteSpace: "nowrap",
                  }}>EN POPÜLER</span>
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 24 }}>{plan.price}</div>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <CheckCircleFilled style={{ color: plan.color }} />
                    <Text style={{ color: "rgba(255,255,255,0.65)" }}>{f}</Text>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)",
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <Title style={{
            color: "#fff", fontWeight: 900, fontSize: "clamp(32px, 4vw, 56px)",
            background: "linear-gradient(135deg, #fff 0%, #c4b5fd 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Sağlıklı yaşama bugün başla
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, marginBottom: 36 }}>
            Binlerce kullanıcıya katıl. Ücretsiz hesap oluştur.
          </Paragraph>

        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <img src={appLogo} alt="logo" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ color: "#a78bfa", fontWeight: 700 }}>FitPlate</span>
        </div>
        <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          © 2025 FitPlate — Akıllı Beslenme Platformu
        </Text>
      </footer>
    </div>
  );
}
