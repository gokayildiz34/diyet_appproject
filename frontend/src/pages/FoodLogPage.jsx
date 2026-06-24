/**
 * FitPlate — Yemek Kaydı Sayfası (UX Enhanced)
 * + Haftalık kalori özeti sidebar
 * + Son eklenenler / sık kullanılanlar
 * + Porsiyon önayarları
 * + Saate göre akıllı öğün seçimi
 * + Dünden kopyala
 * + Motivasyon mesajı
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";
import { aiService } from "../services/aiService";

const API = "/api";


const MEALS = [
  { key: "kahvalti",     label: "Kahvaltı",    icon: "🌅", color: "#f59e0b", hours: [6, 10] },
  { key: "ogle",         label: "Öğle",        icon: "☀️",  color: "#3b82f6", hours: [11, 14] },
  { key: "aksam",        label: "Akşam",       icon: "🌙", color: "#8b5cf6", hours: [17, 21] },
  { key: "atistirmalik", label: "Atıştırmalık",icon: "🍎", color: "#10b981", hours: [0, 24] },
];

const PORTION_PRESETS = [
  { label: "1 dilim",   gram: 30 },
  { label: "1 avuç",    gram: 40 },
  { label: "1 kase",    gram: 150 },
  { label: "1 bardak",  gram: 200 },
  { label: "1 porsiyon",gram: 100 },
  { label: "1 tabak",   gram: 250 },
];

/* ── Saate göre aktif öğünü tahmin et ── */
function guessActiveMeal() {
  const h = new Date().getHours();
  if (h >= 6  && h <= 10) return "kahvalti";
  if (h >= 11 && h <= 14) return "ogle";
  if (h >= 17 && h <= 21) return "aksam";
  return "atistirmalik";
}

/* ── Motivasyon mesajı ── */
function getMotivation(pct, overGoal) {
  if (overGoal)         return { msg: "Günlük hedefi aştın, yarın dikkatli ol 💪", color: "#f87171", icon: "⚠️" };
  if (pct === 0)        return { msg: "Henüz kayıt yok — hadi başlayalım!", color: "#a78bfa", icon: "🌟" };
  if (pct < 30)         return { msg: "Güne iyi başladın, devam et!", color: "#60a5fa", icon: "🚀" };
  if (pct < 60)         return { msg: "Harika gidiyorsun, ritmi koru!", color: "#34d399", icon: "🎯" };
  if (pct < 85)         return { msg: "Neredeyse hedefe ulaştın!", color: "#fbbf24", icon: "⚡" };
  return                       { msg: "Mükemmel! Hedefe çok yakınsın 🏆", color: "#10b981", icon: "🏆" };
}

/* ── localStorage ile sık kullanılanlar ── */
function getRecents() {
  try { return JSON.parse(localStorage.getItem("fp_recents") || "[]"); } catch { return []; }
}
function addToRecents(food) {
  const recents = getRecents().filter(r => r.name !== food.name);
  const updated = [{ ...food, addedAt: Date.now() }, ...recents].slice(0, 8);
  localStorage.setItem("fp_recents", JSON.stringify(updated));
}
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("fp_favorites") || "{}"); } catch { return {}; }
}
function incrementFavorite(name) {
  const favs = getFavorites();
  favs[name] = (favs[name] || 0) + 1;
  localStorage.setItem("fp_favorites", JSON.stringify(favs));
}

/* ─── Halka Grafik ─────────────────────────────────────── */
function MacroRing({ protein, carbs, fat }) {
  const total = protein + carbs + fat || 1;
  const slices = [
    { pct: (protein / total) * 100, color: "#60a5fa", label: "Protein", value: Math.round(protein) },
    { pct: (carbs   / total) * 100, color: "#fbbf24", label: "Karb",    value: Math.round(carbs) },
    { pct: (fat     / total) * 100, color: "#f87171", label: "Yağ",     value: Math.round(fat) },
  ];
  const r = 36, circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={84} height={84} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
        {slices.map((s, i) => {
          const dash = circ * s.pct / 100;
          const offset = -circ * cum / 100;
          cum += s.pct;
          return (
            <circle key={i} cx={42} cy={42} r={r} fill="none"
              stroke={s.color} strokeWidth={9}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {slices.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{s.label}</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 12, marginLeft: "auto", paddingLeft: 8 }}>{s.value}g</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Su Takibi ──────────────────────────────────────────── */
function WaterTracker({ glasses, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>💧 Su Takibi</span>
        <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>{glasses} / 8 bardak</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.8 }}
            onClick={() => onChange(i < glasses ? i : i + 1)}
            title={`${i + 1}. bardak`}
            style={{
              width: 30, height: 30, borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
              background: i < glasses ? "linear-gradient(135deg,#2563eb,#60a5fa)" : "rgba(255,255,255,0.05)",
              transition: "all 0.15s",
            }}>
            {i < glasses ? "💧" : "○"}
          </motion.button>
        ))}
      </div>
      <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div animate={{ width: `${(glasses / 8) * 100}%` }} transition={{ duration: 0.4 }}
          style={{ height: "100%", background: "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 4 }} />
      </div>
      {glasses >= 8 && (
        <div style={{ color: "#34d399", fontSize: 11, marginTop: 6, fontWeight: 600 }}>
          ✅ Günlük su hedefindesin!
        </div>
      )}
    </div>
  );
}

/* ─── Ana Bileşen ───────────────────────────────────────── */
export default function FoodLogPage() {
  const token = useAuthStore((s) => s.token);
  const { dailyCalorieGoal } = useUserStore();
  const headers = { Authorization: `Bearer ${token}` };

  const [date, setDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [meals, setMeals]   = useState({});
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading]     = useState(false);
  const [glasses, setGlasses]     = useState(0);
  const [weeklySummary, setWeeklySummary] = useState({});
  const [copyingYesterday, setCopyingYesterday] = useState(false);

  // Arama
  const [activeMeal, setActiveMeal] = useState(guessActiveMeal);
  const [query, setQuery]     = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [amount, setAmount]       = useState(100);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef  = useRef(null);
  const debounceRef= useRef(null);

  // Tab: ara / son eklenenler / manuel
  const [addTab, setAddTab] = useState("search"); // "search" | "recents" | "manual"
  const [recents, setRecents] = useState(getRecents);

  // Manuel
  const [manual, setManual] = useState({ name:"", calories:"", protein:"", carbs:"", fat:"" });

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Veri yükle ── */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/food-log?date=${date}`, { headers });
      setMeals(data.meals);
      setTotals(data.totals);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [date, token]);

  const loadWater = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/water?date=${date}`, { headers });
      setGlasses(data.glasses ?? 0);
    } catch { /* ignore */ }
  }, [date, token]);

  const loadWeeklySummary = useCallback(async () => {
    try {
      const from = (() => {
        const d = new Date(); d.setDate(d.getDate() - 6);
        return d.toISOString().slice(0, 10);
      })();
      const { data } = await axios.get(`${API}/food-log/weekly?from=${from}`, { headers });
      setWeeklySummary(data.summary ?? {});
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadLogs(); loadWater(); }, [loadLogs, loadWater]);
  useEffect(() => { loadWeeklySummary(); }, [loadWeeklySummary]);

  /* ── Arama debounce ── */
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axios.get(`${API}/food-log/search?q=${encodeURIComponent(query)}`, { headers });
        setResults(data.products ?? []);
        setShowDropdown(true);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 320);
  }, [query]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Fotoğraf Yükleme ve Analiz ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Fotoğraf boyutu 5MB'dan küçük olmalıdır.", "error");
      return;
    }

    setAnalyzingImage(true);
    showToast("Fotoğraf analiz ediliyor... 📸", "success");
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          const res = await aiService.analyzeFoodImage(base64String, file.type);
          if (res.data && res.data.food_name) {
            setSelected({
              name: res.data.food_name,
              calories: res.data.calories,
              protein: res.data.protein,
              carbs: res.data.carbs,
              fat: res.data.fat,
              source: res.data.source
            });
            setQuery(res.data.food_name);
            setShowDropdown(false);
            setAmount(100);
            showToast("Analiz tamamlandı! ✨", "success");
          }
        } catch (error) {
          showToast("Analiz başarısız oldu.", "error");
        } finally {
          setAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Dosya okunamadı.", "error");
      setAnalyzingImage(false);
    }
  };

  /* ── Yemek seç ── */
  const selectFood = (food) => {
    setSelected(food);
    setQuery(food.name);
    setShowDropdown(false);
    setAmount(100);
  };

  /* ── Yemek ekle ── */
  const addFood = async () => {
    if (!activeMeal) { showToast("Lütfen bir öğün seçin.", "error"); return; }
    let foodData = selected;

    if (addTab === "manual") {
      if (!manual.name || !manual.calories) { showToast("Ad ve kalori zorunludur.", "error"); return; }
      foodData = {
        name:     manual.name,
        calories: Number(manual.calories),
        protein:  Number(manual.protein) || 0,
        carbs:    Number(manual.carbs)   || 0,
        fat:      Number(manual.fat)     || 0,
      };
    } else {
      if (!selected) { showToast("Listeden bir yemek seçin.", "error"); return; }
    }

    try {
      await axios.post(`${API}/food-log`, {
        meal: activeMeal, name: foodData.name, amount: Number(amount),
        calories: foodData.calories, protein: foodData.protein,
        carbs: foodData.carbs, fat: foodData.fat, date,
      }, { headers });

      // Sık kullanılan & recents güncelle
      addToRecents(foodData);
      incrementFavorite(foodData.name);
      setRecents(getRecents());

      showToast(`${foodData.name} eklendi ✅`);
      setSelected(null); setQuery(""); setAmount(100);
      setManual({ name:"", calories:"", protein:"", carbs:"", fat:"" });
      loadLogs();
      loadWeeklySummary();
    } catch { showToast("Eklenemedi.", "error"); }
  };

  /* ── Yemek sil ── */
  const removeFood = async (id) => {
    try {
      await axios.delete(`${API}/food-log/${id}`, { headers });
      loadLogs(); loadWeeklySummary();
    } catch { showToast("Silinemedi.", "error"); }
  };

  /* ── Dünden kopyala ── */
  const copyFromYesterday = async () => {
    setCopyingYesterday(true);
    try {
      const { data } = await axios.post(`${API}/food-log/copy-from-yesterday`, { today: date }, { headers });
      showToast(`${data.count} yemek kopyalandı 📋`);
      loadLogs(); loadWeeklySummary();
    } catch (err) {
      showToast(err.response?.data?.message || "Dünkü kayıt bulunamadı.", "error");
    } finally { setCopyingYesterday(false); }
  };

  /* ── Su güncelle ── */
  const updateWater = async (g) => {
    setGlasses(g);
    try { await axios.post(`${API}/water`, { date, glasses: g }, { headers }); }
    catch { /* ignore */ }
  };

  /* ── Hesaplamalar ── */
  const goal     = dailyCalorieGoal || 2000;
  const consumed = Math.round(totals.calories);
  const remaining= Math.max(0, goal - consumed);
  const pct      = Math.min(100, Math.round((consumed / goal) * 100));
  const overGoal = consumed > goal;
  const motiv    = getMotivation(pct, overGoal);

  const computed = selected ? {
    calories: Math.round(selected.calories * amount / 100),
    protein:  Math.round(selected.protein  * amount / 100),
    carbs:    Math.round(selected.carbs    * amount / 100),
    fat:      Math.round(selected.fat      * amount / 100),
  } : null;

  /* ── Son 7 gün ── */
  const recentDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return {
      iso, dayName: d.toLocaleDateString("tr-TR", { weekday: "short" }),
      dayNum: d.getDate(), monthShort: d.toLocaleDateString("tr-TR", { month: "short" }),
      isToday: iso === new Date().toISOString().slice(0, 10),
    };
  }), []);

  /* ── Sık kullanılanlar (favori sıralaması) ── */
  const favoritedRecents = useMemo(() => {
    const favs = getFavorites();
    return [...recents].sort((a, b) => (favs[b.name] || 0) - (favs[a.name] || 0));
  }, [recents]);

  /* ── Stiller ── */
  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: 20,
  };
  const inp = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#fff", padding: "10px 14px", fontSize: 14,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  /* ── RENDER ── */
  return (
    <div style={{ minHeight: "100vh", background: "#080812", color: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{
              position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:9999,
              background: toast.type==="success" ? "rgba(16,185,129,0.92)" : "rgba(239,68,68,0.92)",
              color:"#fff", padding:"10px 24px", borderRadius:12, fontWeight:600, fontSize:14,
              boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 16px",
        display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>

        {/* ─── SOL KOLON ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Başlık */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:900 }}>🍽️ Günlük Yemek Takibi</h1>
              <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,0.35)", fontSize:13 }}>
                {new Date(date).toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {/* Dünden Kopyala */}
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                onClick={copyFromYesterday} disabled={copyingYesterday}
                style={{
                  padding:"9px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.7)",
                  cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6,
                }}>
                {copyingYesterday ? "⏳" : "📋"} Dünden Kopyala
              </motion.button>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ ...inp, width:150, cursor:"pointer" }} />
            </div>
          </div>

          {/* Motivasyon + Kalori Özeti */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{
              background:"linear-gradient(135deg,rgba(124,58,237,0.16),rgba(139,92,246,0.06))",
              border:"1px solid rgba(124,58,237,0.28)", borderRadius:20, padding:22,
            }}>
            {/* Motivasyon */}
            <div style={{
              display:"flex", alignItems:"center", gap:8, marginBottom:16,
              background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"8px 14px",
            }}>
              <span style={{ fontSize:18 }}>{motiv.icon}</span>
              <span style={{ color:motiv.color, fontWeight:600, fontSize:13 }}>{motiv.msg}</span>
            </div>

            <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:2 }}>Tüketilen</div>
                    <div style={{ fontSize:40, fontWeight:900, color: overGoal?"#f87171":"#a78bfa", lineHeight:1 }}>
                      {consumed}
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>kcal</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:2 }}>
                      {overGoal ? "Aşım" : "Kalan"}
                    </div>
                    <div style={{ fontSize:28, fontWeight:800, color: overGoal?"#f87171":"#34d399", lineHeight:1 }}>
                      {overGoal ? `+${consumed-goal}` : remaining}
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>/ {goal} kcal</div>
                  </div>
                </div>
                <div style={{ height:8, borderRadius:8, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                    transition={{ duration:0.7, ease:"easeOut" }}
                    style={{
                      height:"100%", borderRadius:8,
                      background: overGoal
                        ? "linear-gradient(90deg,#f87171,#ef4444)"
                        : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                    }}
                  />
                </div>
                <div style={{ color:"rgba(255,255,255,0.25)", fontSize:11, marginTop:4, textAlign:"right" }}>
                  {pct}% tamamlandı
                </div>
              </div>
              <MacroRing protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
            </div>
          </motion.div>

          {/* ── Yemek Ekleme Paneli ── */}
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>➕ Yemek Ekle</h3>
              {/* Tab butonları */}
              <div style={{ display:"flex", gap:6 }}>
                {[
                  { id:"search",  label:"🔍 Ara" },
                  { id:"recents", label:`⭐ Son (${recents.length})` },
                  { id:"manual",  label:"✏️ Manuel" },
                ].map(t => (
                  <button key={t.id} onClick={() => setAddTab(t.id)}
                    style={{
                      padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                      background: addTab===t.id ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)",
                      color: addTab===t.id ? "#a78bfa" : "rgba(255,255,255,0.35)",
                      transition:"all 0.2s",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Öğün Seçimi */}
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {MEALS.map(m => (
                <button key={m.key} onClick={() => setActiveMeal(m.key)}
                  style={{
                    padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                    background: activeMeal===m.key ? `${m.color}22` : "rgba(255,255,255,0.04)",
                    color: activeMeal===m.key ? m.color : "rgba(255,255,255,0.4)",
                    border: `1px solid ${activeMeal===m.key ? m.color+"55" : "rgba(255,255,255,0.07)"}`,
                    transition:"all 0.2s", position:"relative",
                  }}>
                  {m.icon} {m.label}
                  {/* Saat ipucu */}
                  {guessActiveMeal()===m.key && (
                    <span style={{
                      position:"absolute", top:-6, right:-4,
                      background:"#10b981", color:"#fff", fontSize:8, borderRadius:4, padding:"1px 4px",
                    }}>Şimdi</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Arama Sekmesi ── */}
            {addTab === "search" && (
              <div>
                <div ref={searchRef} style={{ position:"relative", marginBottom:12 }}>
                  <input placeholder="Yemek ara veya sağdan fotoğraf ekle..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    style={{ ...inp, paddingRight:70 }} />
                  
                  <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", gap:8 }}>
                    {searching && <span style={{ fontSize:16, opacity:0.4 }}>⏳</span>}
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={analyzingImage}
                      title="Fotoğraftan Analiz Et"
                      style={{
                        background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)",
                        borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center",
                        cursor: analyzingImage ? "wait" : "pointer", color:"#a78bfa", fontSize:16,
                        opacity: analyzingImage ? 0.5 : 1, transition:"all 0.2s"
                      }}
                    >
                      {analyzingImage ? "⏳" : "📷"}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      style={{ display: "none" }} 
                      onChange={handleImageUpload} 
                    />
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showDropdown && results.length > 0 && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        style={{
                          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100,
                          background:"#13122a", border:"1px solid rgba(124,58,237,0.3)", borderRadius:12,
                          overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
                          maxHeight:300, overflowY:"auto",
                        }}>
                        {results.map((r, i) => {
                          const favCount = getFavorites()[r.name] || 0;
                          return (
                            <motion.div key={i} whileHover={{ background:"rgba(124,58,237,0.13)" }}
                              onClick={() => selectFood(r)}
                              style={{
                                padding:"11px 16px", cursor:"pointer",
                                borderBottom: i < results.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                display:"flex", justifyContent:"space-between", alignItems:"center",
                              }}>
                              <div>
                                <div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>
                                  {favCount >= 3 && <span style={{ marginRight:4 }}>⭐</span>}
                                  {r.name}
                                </div>
                                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:2 }}>
                                  P:{r.protein}g · K:{r.carbs}g · Y:{r.fat}g
                                </div>
                              </div>
                              <div style={{
                                background:"rgba(167,139,250,0.12)", color:"#a78bfa",
                                padding:"3px 10px", borderRadius:8, fontWeight:700, fontSize:13, flexShrink:0,
                              }}>
                                {r.calories} kcal
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Seçilen Yemek */}
                <AnimatePresence>
                  {selected && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                      style={{
                        background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.22)",
                        borderRadius:12, padding:16, marginBottom:12, overflow:"hidden",
                      }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                        <div>
                          <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>✨ {selected.name}</div>
                          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>
                            100g → {selected.calories} kcal · P:{selected.protein}g · K:{selected.carbs}g · Y:{selected.fat}g
                          </div>
                        </div>
                        <button onClick={() => { setSelected(null); setQuery(""); }}
                          style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:18 }}>×</button>
                      </div>

                      {/* Porsiyon Önayarları */}
                      <div style={{ marginBottom:10 }}>
                        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:6 }}>Hızlı Porsiyon:</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {PORTION_PRESETS.map(p => (
                            <button key={p.label} onClick={() => setAmount(p.gram)}
                              style={{
                                padding:"4px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
                                background: amount===p.gram ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)",
                                color: amount===p.gram ? "#a78bfa" : "rgba(255,255,255,0.45)",
                                transition:"all 0.15s",
                              }}>
                              {p.label} ({p.gram}g)
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:100 }}>
                          <label style={{ color:"rgba(255,255,255,0.4)", fontSize:11, display:"block", marginBottom:4 }}>
                            Miktar (gram)
                          </label>
                          <input type="number" value={amount} min={1}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            style={inp} />
                        </div>
                        {computed && (
                          <div style={{
                            background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 14px",
                            display:"flex", gap:14, flexShrink:0, flexWrap:"wrap",
                          }}>
                            <span style={{ color:"#a78bfa", fontWeight:800, fontSize:15 }}>{computed.calories} kcal</span>
                            <span style={{ color:"#60a5fa", fontSize:12, alignSelf:"center" }}>P:{computed.protein}g</span>
                            <span style={{ color:"#fbbf24", fontSize:12, alignSelf:"center" }}>K:{computed.carbs}g</span>
                            <span style={{ color:"#f87171", fontSize:12, alignSelf:"center" }}>Y:{computed.fat}g</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Son Eklenenler Sekmesi ── */}
            {addTab === "recents" && (
              <div>
                {favoritedRecents.length === 0 ? (
                  <div style={{
                    textAlign:"center", padding:"24px 0", color:"rgba(255,255,255,0.25)",
                    border:"1px dashed rgba(255,255,255,0.07)", borderRadius:10,
                  }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>⭐</div>
                    <div style={{ fontSize:13 }}>Henüz yemek eklemedin.<br/>Eklediğin yemekler burada belirecek.</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginBottom:4 }}>
                      Son eklenenler — sık kullanılanlar üstte ⭐
                    </div>
                    {favoritedRecents.map((r, i) => {
                      const favCount = getFavorites()[r.name] || 0;
                      return (
                        <motion.div key={i} whileHover={{ x:3 }}
                          onClick={() => { selectFood(r); setAddTab("search"); }}
                          style={{
                            display:"flex", justifyContent:"space-between", alignItems:"center",
                            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                            borderRadius:10, padding:"10px 14px", cursor:"pointer", transition:"all 0.15s",
                          }}>
                          <div>
                            <div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>
                              {favCount >= 3 ? "⭐ " : ""}{r.name}
                              {favCount >= 3 && (
                                <span style={{
                                  marginLeft:6, background:"rgba(245,158,11,0.15)", color:"#f59e0b",
                                  fontSize:10, padding:"1px 6px", borderRadius:4,
                                }}>Sık kullanılan</span>
                              )}
                            </div>
                            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:2 }}>
                              P:{r.protein}g · K:{r.carbs}g · Y:{r.fat}g
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ color:"#a78bfa", fontWeight:700, fontSize:13 }}>{r.calories} kcal</span>
                            <span style={{
                              background:"rgba(124,58,237,0.15)", color:"#a78bfa",
                              padding:"3px 8px", borderRadius:7, fontSize:11,
                            }}>Seç</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Manuel Sekmesi ── */}
            {addTab === "manual" && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={{ color:"rgba(255,255,255,0.4)", fontSize:11, display:"block", marginBottom:4 }}>Yemek Adı *</label>
                    <input placeholder="örn: Ev yapımı köfte" value={manual.name}
                      onChange={(e) => setManual({ ...manual, name:e.target.value })}
                      style={inp} />
                  </div>
                  {[
                    { key:"calories", label:"Kalori (kcal) *", ph:"250" },
                    { key:"amount",   label:"Miktar (gram)",   ph:"100", isAmount:true },
                    { key:"protein",  label:"Protein (g)",     ph:"20" },
                    { key:"carbs",    label:"Karbonhidrat (g)",ph:"30" },
                    { key:"fat",      label:"Yağ (g)",         ph:"10" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color:"rgba(255,255,255,0.4)", fontSize:11, display:"block", marginBottom:4 }}>{f.label}</label>
                      <input type="number" placeholder={f.ph}
                        value={f.isAmount ? amount : manual[f.key]}
                        onChange={(e) => f.isAmount ? setAmount(Number(e.target.value)) : setManual({ ...manual, [f.key]:e.target.value })}
                        style={inp} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Ekle Butonu */}
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={addFood}
              disabled={!activeMeal || (addTab==="search" && !selected) || (addTab==="manual" && !manual.name)}
              style={{
                width:"100%", padding:"13px 0", borderRadius:12, border:"none", cursor:"pointer",
                background: (activeMeal && (addTab==="manual" ? manual.name : selected))
                  ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(255,255,255,0.04)",
                color: (activeMeal && (addTab==="manual" ? manual.name : selected))
                  ? "#fff" : "rgba(255,255,255,0.2)",
                fontWeight:700, fontSize:15, marginTop:12,
                boxShadow: (activeMeal && (addTab==="manual" ? manual.name : selected))
                  ? "0 8px 24px rgba(124,58,237,0.3)" : "none",
                transition:"all 0.25s",
              }}>
              {activeMeal
                ? `${MEALS.find(m=>m.key===activeMeal)?.icon} ${MEALS.find(m=>m.key===activeMeal)?.label} Öğününe Ekle`
                : "Önce Öğün Seçin"}
            </motion.button>
          </div>

          {/* ── Öğün Kartları ── */}
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize:32 }}>⏳</div>
              <div style={{ marginTop:8 }}>Yükleniyor...</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {MEALS.map((meal) => {
                const mealData = meals[meal.key] || { label:meal.label, items:[] };
                const mealCal  = mealData.items.reduce((s, i) => s + i.calories, 0);
                const mealProt = mealData.items.reduce((s, i) => s + (i.protein||0), 0);
                const mealCarb = mealData.items.reduce((s, i) => s + (i.carbs||0), 0);
                const mealFat  = mealData.items.reduce((s, i) => s + (i.fat||0), 0);

                return (
                  <motion.div key={meal.key} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                    style={{
                      background:"rgba(255,255,255,0.02)",
                      border:`1px solid ${activeMeal===meal.key ? meal.color+"44" : "rgba(255,255,255,0.07)"}`,
                      borderRadius:16, padding:16, transition:"border-color 0.2s",
                    }}>
                    {/* Kart başlık */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:18 }}>{meal.icon}</span>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:13 }}>{meal.label}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {mealCal > 0 && (
                          <span style={{
                            background:`${meal.color}20`, color:meal.color,
                            padding:"2px 9px", borderRadius:7, fontSize:12, fontWeight:700,
                          }}>{Math.round(mealCal)} kcal</span>
                        )}
                        {/* Buraya öğüne hızlı ekle butonu */}
                        <button onClick={() => { setActiveMeal(meal.key); setAddTab("search"); }}
                          title="Bu öğüne ekle"
                          style={{
                            background:`${meal.color}15`, border:"none", borderRadius:7, cursor:"pointer",
                            color:meal.color, width:24, height:24, fontSize:14, display:"flex",
                            alignItems:"center", justifyContent:"center",
                          }}>+</button>
                      </div>
                    </div>

                    {/* Yemek listesi */}
                    {mealData.items.length === 0 ? (
                      <div style={{
                        textAlign:"center", padding:"14px 0", color:"rgba(255,255,255,0.18)", fontSize:12,
                        border:"1px dashed rgba(255,255,255,0.06)", borderRadius:8,
                      }}>
                        Boş öğün
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <AnimatePresence>
                          {mealData.items.map((item) => (
                            <motion.div key={item.id}
                              initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:8 }}
                              style={{
                                display:"flex", justifyContent:"space-between", alignItems:"center",
                                background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"7px 9px",
                              }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ color:"#fff", fontSize:12, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                  {item.name}
                                </div>
                                <div style={{ color:"rgba(255,255,255,0.27)", fontSize:10, marginTop:1 }}>
                                  {item.amount}g
                                  {item.protein!=null && ` · P:${Math.round(item.protein)}g`}
                                  {item.carbs!=null   && ` · K:${Math.round(item.carbs)}g`}
                                  {item.fat!=null     && ` · Y:${Math.round(item.fat)}g`}
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                                <span style={{ color:"#a78bfa", fontWeight:700, fontSize:12 }}>
                                  {Math.round(item.calories)}
                                </span>
                                <button onClick={() => removeFood(item.id)}
                                  style={{
                                    background:"rgba(239,68,68,0.1)", border:"none", borderRadius:5,
                                    cursor:"pointer", color:"#ef4444", width:22, height:22,
                                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                                  }}>×</button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Öğün makro özet */}
                        <div style={{ display:"flex", gap:8, marginTop:6, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                          {[
                            { l:"P", v:mealProt, c:"#60a5fa" },
                            { l:"K", v:mealCarb, c:"#fbbf24" },
                            { l:"Y", v:mealFat,  c:"#f87171" },
                          ].map(m => (
                            <div key={m.l} style={{ flex:1, textAlign:"center" }}>
                              <div style={{ color:m.c, fontWeight:700, fontSize:11 }}>{Math.round(m.v)}g</div>
                              <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10 }}>{m.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── SAĞ KOLON ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:24, alignSelf:"start" }}>

          {/* Haftalık Takvim — DB'den kalori gösterir */}
          <div style={card}>
            <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>📅 Haftalık Özet</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {recentDays.map((d) => {
                const isSelected = d.iso === date;
                const dayData    = weeklySummary[d.iso];
                const dayCal     = dayData?.calories ?? 0;
                const dayGoalPct = goal > 0 ? Math.min(100, Math.round((dayCal / goal) * 100)) : 0;
                const hasData    = !!dayData;

                return (
                  <motion.div key={d.iso} whileHover={{ x:3 }}
                    onClick={() => setDate(d.iso)}
                    style={{
                      padding:"10px 12px", borderRadius:10, cursor:"pointer",
                      background: isSelected ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.02)",
                      border:`1px solid ${isSelected ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.05)"}`,
                      transition:"all 0.15s",
                    }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {/* Gün kutusu */}
                      <div style={{
                        width:36, height:36, borderRadius:8, flexShrink:0,
                        background: isSelected ? "#7c3aed" : "rgba(255,255,255,0.05)",
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                      }}>
                        <span style={{ fontSize:9, color: isSelected?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.3)", lineHeight:1 }}>
                          {d.dayName}
                        </span>
                        <span style={{ fontSize:15, fontWeight:800, color:"#fff", lineHeight:1.1 }}>{d.dayNum}</span>
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                          <span style={{ color:"#fff", fontSize:12, fontWeight:600 }}>
                            {d.isToday ? "Bugün" : `${d.dayNum} ${d.monthShort}`}
                          </span>
                          {hasData ? (
                            <span style={{ color:"#a78bfa", fontWeight:700, fontSize:11 }}>
                              {dayCal} kcal
                            </span>
                          ) : (
                            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:10 }}>kayıt yok</span>
                          )}
                        </div>
                        {/* Mini kalori çubuğu */}
                        {hasData && (
                          <div style={{ height:3, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                            <div style={{
                              height:"100%", width:`${dayGoalPct}%`, borderRadius:3,
                              background: dayGoalPct >= 100 ? "#f87171" : dayGoalPct >= 70 ? "#34d399" : "#7c3aed",
                              transition:"width 0.4s",
                            }} />
                          </div>
                        )}
                        {hasData && (
                          <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10, marginTop:2 }}>
                            {dayData.food_count} yemek · %{dayGoalPct} hedefe ulaştı
                          </div>
                        )}
                      </div>

                      {d.isToday && (
                        <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", flexShrink:0 }} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Su Takibi */}
          <div style={card}>
            <WaterTracker glasses={glasses} onChange={updateWater} />
          </div>

          {/* Makro Hedef Barları */}
          <div style={card}>
            <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>📊 Makro Hedefler</h3>
            {[
              { label:"Protein",       value:totals.protein, goal:Math.round(goal*0.3/4),  color:"#60a5fa" },
              { label:"Karbonhidrat",  value:totals.carbs,   goal:Math.round(goal*0.45/4), color:"#fbbf24" },
              { label:"Yağ",           value:totals.fat,     goal:Math.round(goal*0.25/9), color:"#f87171" },
            ].map(m => {
              const p = Math.min(100, Math.round((m.value / m.goal) * 100));
              return (
                <div key={m.label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ color:"rgba(255,255,255,0.55)", fontSize:12 }}>{m.label}</span>
                    <span style={{ color: p>=100?"#34d399":m.color, fontWeight:700, fontSize:12 }}>
                      {Math.round(m.value)}g / {m.goal}g
                    </span>
                  </div>
                  <div style={{ height:6, borderRadius:6, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <motion.div animate={{ width:`${p}%` }} transition={{ duration:0.5 }}
                      style={{ height:"100%", borderRadius:6, background: p>=100?"#34d399":m.color }} />
                  </div>
                  {p >= 100 && (
                    <div style={{ color:"#34d399", fontSize:10, marginTop:3 }}>✅ Hedefe ulaştı!</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* İpucu */}
          <div style={{
            ...card,
            background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.03))",
            border:"1px solid rgba(16,185,129,0.18)",
          }}>
            <div style={{ fontSize:18, marginBottom:6 }}>💡</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, lineHeight:1.65 }}>
              <strong style={{ color:"#10b981" }}>İpuçları:</strong><br />
              • Türkçe yemek adı yaz, anında çıkar<br />
              • Sık yediklerini ⭐ listesinden ekle<br />
              • "Dünden Kopyala" ile hızlı kayıt yap<br />
              • Porsiyon önayarlarını kullan
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 300px"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"]   { grid-template-columns: 1fr !important; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.4; }
        input::placeholder { color: rgba(255,255,255,0.22) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }
        button:disabled { opacity: 0.4; cursor: not-allowed !important; }
      `}</style>
    </div>
  );
}
