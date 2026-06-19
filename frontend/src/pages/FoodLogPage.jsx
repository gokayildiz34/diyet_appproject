/**
 * FitPlate - Yemek Kaydı Sayfası
 * Open Food Facts API ile yemek arama + öğün bazlı günlük takip
 */
import { useState, useEffect, useCallback } from "react";
import { Typography, Input, Button, Spin, Progress, message } from "antd";
import {
  SearchOutlined, PlusOutlined, DeleteOutlined,
  FireOutlined, CalendarOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore } from "../stores/useUserStore";

const { Title, Text } = Typography;
const API = "http://localhost:8000/api";

const MEALS = [
  { key: "kahvalti",     label: "Kahvaltı",      icon: "🌅" },
  { key: "ogle",         label: "Öğle",           icon: "☀️" },
  { key: "aksam",        label: "Akşam",          icon: "🌙" },
  { key: "atistirmalik", label: "Atıştırmalık",   icon: "🍎" },
];

const WATER_GOAL = 8;

function MacroBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}g</div>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</Text>
    </div>
  );
}

export default function FoodLogPage() {
  const token = useAuthStore((s) => s.token);
  const { dailyCalorieGoal } = useUserStore();

  const [date, setDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [meals, setMeals]           = useState({});
  const [totals, setTotals]         = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading]       = useState(false);

  // Search
  const [activeMeal, setActiveMeal] = useState(null);
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [amount, setAmount]         = useState(100);
  const [selected, setSelected]     = useState(null);

  // Water
  const [glasses, setGlasses]       = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  // Günlük kayıtları yükle
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/food-log?date=${date}`, { headers });
      setMeals(data.meals);
      setTotals(data.totals);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [date, token]);

  // Su kaydını yükle
  const loadWater = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/water?date=${date}`, { headers });
      setGlasses(data.glasses);
    } catch { /* ignore */ }
  }, [date, token]);

  useEffect(() => { loadLogs(); loadWater(); }, [loadLogs, loadWater]);

  // Yemek arama
  const searchFood = async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`${API}/food-log/search?q=${encodeURIComponent(q)}`, { headers });
      setResults(data.products || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => searchFood(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  // Yemek ekle
  const addFood = async () => {
    if (!selected || !activeMeal) return;
    try {
      await axios.post(`${API}/food-log`, {
        meal: activeMeal,
        name: selected.name,
        amount: Number(amount),
        calories: selected.calories,
        protein: selected.protein,
        carbs: selected.carbs,
        fat: selected.fat,
        date,
      }, { headers });
      message.success(`${selected.name} eklendi ✅`);
      setSelected(null);
      setQuery("");
      setResults([]);
      setAmount(100);
      setActiveMeal(null);
      loadLogs();
    } catch { message.error("Eklenemedi."); }
  };

  // Yemek sil
  const removeFood = async (id) => {
    try {
      await axios.delete(`${API}/food-log/${id}`, { headers });
      loadLogs();
    } catch { message.error("Silinemedi."); }
  };

  // Su güncelle
  const updateWater = async (newVal) => {
    const val = Math.max(0, Math.min(WATER_GOAL, newVal));
    setGlasses(val);
    await axios.post(`${API}/water`, { date, glasses: val }, { headers });
  };

  const caloriePercent = dailyCalorieGoal > 0
    ? Math.min(100, Math.round((totals.calories / dailyCalorieGoal) * 100))
    : 0;

  const remaining = Math.max(0, (dailyCalorieGoal || 2000) - totals.calories);

  return (
    <div style={{ minHeight: "100vh", background: "#080812", color: "#fff", padding: "24px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
              🍽️ Yemek Kaydı
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.4)" }}>Günlük besin takibi</Text>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color: "#fff", width: 160,
            }}
          />
        </div>

        {/* Kalori Özeti */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(147,51,234,0.1))",
            border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: 24, marginBottom: 20,
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Tüketilen</Text>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#a78bfa", lineHeight: 1.1 }}>
                {Math.round(totals.calories)}
              </div>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>kcal</Text>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Kalan</Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: remaining > 0 ? "#34d399" : "#f87171" }}>
                {Math.round(remaining)}
              </div>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>/ {dailyCalorieGoal || 2000} kcal</Text>
            </div>
          </div>

          <Progress
            percent={caloriePercent}
            showInfo={false}
            strokeColor={{ "0%": "#7c3aed", "100%": caloriePercent >= 100 ? "#f87171" : "#a78bfa" }}
            trailColor="rgba(255,255,255,0.08)"
            strokeWidth={10}
          />

          {/* Makrolar */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <MacroBadge label="Protein" value={Math.round(totals.protein)} color="#60a5fa" />
            <MacroBadge label="Karbonhidrat" value={Math.round(totals.carbs)} color="#fbbf24" />
            <MacroBadge label="Yağ" value={Math.round(totals.fat)} color="#f87171" />
          </div>
        </motion.div>

        {/* Su Takibi */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 20, marginBottom: 20,
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>💧 Su Takibi</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{glasses}/{WATER_GOAL} bardak</Text>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <motion.div key={i} whileTap={{ scale: 0.9 }}
                onClick={() => updateWater(i < glasses ? i : i + 1)}
                style={{
                  width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                  background: i < glasses ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${i < glasses ? "#38bdf8" : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, transition: "all 0.2s",
                }}>
                💧
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Öğünler */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          MEALS.map((meal, mi) => {
            const mealData = meals[meal.key] || { label: meal.label, items: [] };
            const mealCal  = mealData.items.reduce((s, i) => s + i.calories, 0);

            return (
              <motion.div key={meal.key}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.08 }}
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, marginBottom: 16, overflow: "hidden",
                }}>
                {/* Öğün başlık */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{meal.icon}</span>
                    <Text style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{meal.label}</Text>
                    {mealCal > 0 && (
                      <span style={{ fontSize: 12, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "2px 8px", borderRadius: 8 }}>
                        {Math.round(mealCal)} kcal
                      </span>
                    )}
                  </div>
                  <Button size="small" type="text" icon={<PlusOutlined />}
                    onClick={() => setActiveMeal(activeMeal === meal.key ? null : meal.key)}
                    style={{ color: "#a78bfa", borderColor: "rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)" }}>
                    Ekle
                  </Button>
                </div>

                {/* Kayıtlı yemekler */}
                {mealData.items.map((item) => (
                  <div key={item.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}>
                    <div>
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{item.name}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginLeft: 8 }}>
                        {item.amount}g
                      </Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Text style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>
                        {Math.round(item.calories)} kcal
                      </Text>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />}
                        onClick={() => removeFood(item.id)} />
                    </div>
                  </div>
                ))}

                {/* Arama paneli */}
                <AnimatePresence>
                  {activeMeal === meal.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ padding: "16px 20px" }}>
                        <Input
                          prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.3)" }} />}
                          suffix={searching && <Spin size="small" />}
                          placeholder="Yemek ara... (örn. elma, tavuk, yoğurt)"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          autoFocus
                          style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10, color: "#fff", marginBottom: 12,
                          }}
                        />

                        {/* Arama sonuçları */}
                        {results.length > 0 && !selected && (
                          <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
                            {results.map((r, ri) => (
                              <div key={ri} onClick={() => setSelected(r)}
                                style={{
                                  padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text style={{ color: "#fff", fontSize: 14 }}>{r.name}</Text>
                                  <Text style={{ color: "#a78bfa", fontWeight: 700 }}>{r.calories} kcal/100g</Text>
                                </div>
                                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                                  P: {r.protein}g · K: {r.carbs}g · Y: {r.fat}g
                                </Text>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Seçilen yemek + miktar */}
                        {selected && (
                          <div style={{
                            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
                            borderRadius: 12, padding: 14, marginBottom: 12,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                              <Text style={{ color: "#fff", fontWeight: 600 }}>{selected.name}</Text>
                              <Button type="text" size="small" onClick={() => setSelected(null)}
                                style={{ color: "rgba(255,255,255,0.4)" }}>✕</Button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 4 }}>Miktar (gram)</Text>
                                <Input
                                  type="number"
                                  value={amount}
                                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                                  style={{
                                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 8, color: "#fff",
                                  }}
                                />
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, display: "block" }}>Toplam</Text>
                                <Text style={{ color: "#a78bfa", fontWeight: 800, fontSize: 20 }}>
                                  {Math.round(selected.calories * amount / 100)} kcal
                                </Text>
                              </div>
                            </div>
                          </div>
                        )}

                        {selected && (
                          <Button type="primary" block onClick={addFood}
                            style={{ borderRadius: 10, fontWeight: 700, height: 44 }}>
                            <FireOutlined /> Kaydet
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
