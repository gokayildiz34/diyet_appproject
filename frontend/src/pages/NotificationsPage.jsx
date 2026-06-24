/**
 * FitPlate - Bildirimler Sayfası
 */
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Empty,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  FireOutlined,
  HeartOutlined,
  MessageOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useNotificationStore } from "../stores/useNotificationStore";
import { notificationService } from "../services/notificationService";

const { Title, Text } = Typography;

const TYPE_LABELS = {
  all: "Tümü",
  unread: "Okunmamış",
  friend: "Arkadaşlık",
  interaction: "Etkileşim",
  coach: "Koç",
  progress: "İlerleme",
  system: "Sistem",
};

const getTypeIcon = (type) => {
  switch (type) {
    case "friend":
      return <TeamOutlined style={{ color: "#60a5fa" }} />;
    case "interaction":
      return <HeartOutlined style={{ color: "#f87171" }} />;
    case "coach":
      return <MessageOutlined style={{ color: "#c084fc" }} />;
    case "progress":
      return <TrophyOutlined style={{ color: "#f59e0b" }} />;
    default:
      return <FireOutlined style={{ color: "#34d399" }} />;
  }
};

const formatRelativeTime = (iso) => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / (1000 * 60));

  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.floor(hour / 24);
  return `${day} gün önce`;
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearRead = useNotificationStore((s) => s.clearRead);

  const [activeFilter, setActiveFilter] = useState("all");

  // Backend'den bildirimleri çek ve store'a merge et
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationService.getNotifications();
        const remote = data?.notifications || [];
        if (remote.length > 0) {
          const store = useNotificationStore.getState();
          remote.forEach((n) => {
            store.addNotification({
              id: `db-${n.id}`,
              type: n.type || "system",
              title: n.title,
              message: n.message,
              read: n.is_read,
              createdAt: n.created_at,
              dedupeKey: `db-${n.id}`,
            });
          });
        }
      } catch {
        // Backend erişilemezse mevcut local veriyle devam et
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    markAsRead(id);
    try {
      // db- prefix'li ID'lerin gerçek backend ID'sine dönüştür
      const dbId = String(id).replace("db-", "");
      if (String(id).startsWith("db-") && !isNaN(Number(dbId))) {
        await notificationService.markAsRead(Number(dbId));
      }
    } catch {
      // Sessizce devam et
    }
  };

  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    try {
      await notificationService.markAllAsRead();
    } catch {
      // Sessizce devam et
    }
  };

  const handleRemoveNotification = async (id) => {
    removeNotification(id);
    try {
      const dbId = String(id).replace("db-", "");
      if (String(id).startsWith("db-") && !isNaN(Number(dbId))) {
        await notificationService.deleteNotification(Number(dbId));
      }
    } catch {
      // Sessizce devam et
    }
  };

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <Card
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #1a1025 0%, #172036 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                <BellOutlined style={{ marginRight: 10, color: "#a78bfa" }} />
                Bildirimler
              </Title>
              <Badge count={unreadCount} overflowCount={99} />
            </Space>

            <Text style={{ color: "rgba(255,255,255,0.55)" }}>
              İdeal bildirim yapısı: arkadaşlık hareketleri, gönderi
              etkileşimleri, koç plan/yorum güncellemeleri, hedef ilerleme
              uyarıları ve sistem duyuruları.
            </Text>

            <Segmented
              value={activeFilter}
              onChange={setActiveFilter}
              options={Object.keys(TYPE_LABELS).map((key) => ({
                label: TYPE_LABELS[key],
                value: key,
              }))}
              style={{ marginTop: 6 }}
            />

            <Space wrap style={{ marginTop: 4 }}>
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                style={{ borderRadius: 10 }}
              >
                Tümünü Okundu Yap
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={clearRead}
                style={{ borderRadius: 10 }}
              >
                Okunanları Temizle
              </Button>
            </Space>
          </Space>
        </Card>

        {filteredItems.length === 0 ? (
          <Card
            style={{
              background: "var(--bg-container)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
            }}
          >
            <Empty
              description={
                <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                  Bu filtrede bildirim bulunamadı.
                </Text>
              }
            />
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.22 }}
            >
              <Card
                style={{
                  marginBottom: 12,
                  background: item.read ? "var(--bg-container)" : "#1b1a34",
                  border: item.read
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(124,58,237,0.35)",
                  borderRadius: 14,
                }}
                styles={{ body: { padding: 14 } }}
              >
                <Space
                  style={{ justifyContent: "space-between", width: "100%" }}
                >
                  <Space align="start" size={10}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(124,58,237,0.12)",
                        marginTop: 2,
                      }}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <Space size={8}>
                        <Text strong style={{ color: "#fff" }}>
                          {item.title}
                        </Text>
                        {!item.read && <Tag color="purple">Yeni</Tag>}
                      </Space>
                      <br />
                      <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                        {item.message}
                      </Text>
                      <br />
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 12,
                        }}
                      >
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </div>
                  </Space>

                  <Space>
                    {!item.read && (
                      <Button
                        size="small"
                        onClick={() => handleMarkAsRead(item.id)}
                        style={{ borderRadius: 8 }}
                      >
                        Okundu
                      </Button>
                    )}
                    {item.actionPath && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          handleMarkAsRead(item.id);
                          navigate(item.actionPath);
                        }}
                        style={{ borderRadius: 8 }}
                      >
                        Git
                      </Button>
                    )}
                    <Button
                      size="small"
                      danger
                      onClick={() => handleRemoveNotification(item.id)}
                      style={{ borderRadius: 8 }}
                    >
                      Sil
                    </Button>
                  </Space>
                </Space>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
