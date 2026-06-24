/**
 * FitPlate - Main App Layout
 */
import { useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Typography,
  Space,
  Popover,
  Button,
} from "antd";
import {
  HomeOutlined,
  CompassOutlined,
  UserOutlined,
  BellOutlined,
  FireOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined,
  RobotOutlined,
  BookOutlined,
  TeamOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUserStore } from "../../stores/useUserStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { promptForPush, getPushPermissionStatus } from "../../services/oneSignalService";
import { getImageUrl } from "../../utils/helpers";
import appLogo from "../../assets/Gemini_Generated_Image_3hrhw23hrhw23hrh.png";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [pushStatus, setPushStatus] = useState("default");
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isPremium = useUserStore((s) => s.isPremium);
  const notifications = useNotificationStore((s) => s.items);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  // Check initial push permission status
  useMemo(() => {
    // Only works in browser
    if (typeof window !== "undefined") {
      // Small delay to allow SDK to initialize
      setTimeout(() => {
        setPushStatus(getPushPermissionStatus());
      }, 2000);
    }
  }, []);

  const handlePushPermission = async () => {
    await promptForPush();
    // After prompt, wait a bit and check again
    setTimeout(() => {
      setPushStatus(getPushPermissionStatus());
    }, 1000);
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const topNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications],
  );

  const siderMenuItems = useMemo(() => {
    const items = [
      {
        key: "/feed",
        icon: <HomeOutlined />,
        label: "Akış",
      },
      {
        key: "/discover",
        icon: <CompassOutlined />,
        label: "Keşfet",
      },
      {
        key: "/membership",
        icon: <CrownOutlined />,
        label: "Üyelik",
      },
    ];

    items.push({
      key: "/coaches",
      icon: <RobotOutlined />,
      label: "Koçlar",
    });

    items.push(
      {
        key: "/stats",
        icon: <FireOutlined />,
        label: "İstatistikler",
      },
      {
        key: "/checkin",
        icon: <CalendarOutlined />,
        label: "Haftalık Check-in",
      },
      {
        key: "/food-log",
        icon: <BookOutlined />,
        label: "Yemek Kaydı",
      },
      {
        key: "/diet-hub",
        icon: <DashboardOutlined />,
        label: "Diyet Merkezi",
      },
      {
        key: "/friends",
        icon: <TeamOutlined />,
        label: "Arkadaşlar",
      },
      {
        key: "/profile",
        icon: <UserOutlined />,
        label: "Profil",
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: "Ayarlar",
      },
    );

    return items;
  }, [isPremium]);

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Profil" },
    { key: "settings", icon: <SettingOutlined />, label: "Ayarlar" },
  ];

  if (pushStatus === "default") {
    userMenuItems.push({
      key: "push_permission",
      icon: <BellOutlined />,
      label: "Bildirimlere İzin Ver",
    });
  }

  userMenuItems.push(
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Çıkış Yap",
      danger: true,
    }
  );

  const handleUserMenuClick = ({ key }) => {
    if (key === "logout") {
      logout();
      navigate("/login");
    } else if (key === "push_permission") {
      handlePushPermission();
    } else {
      navigate(`/${key}`);
    }
  };

  const bellContent = (
    <div style={{ width: 340 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text strong style={{ color: "#fff" }}>
          Bildirimler
        </Text>
        <Badge count={unreadCount} size="small" />
      </div>

      {topNotifications.length === 0 ? (
        <Text style={{ color: "rgba(255,255,255,0.45)" }}>
          Henüz bildirim yok.
        </Text>
      ) : (
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {topNotifications.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: 10,
                background: item.read ? "#1a1a2e" : "#201a35",
                cursor: item.actionPath ? "pointer" : "default",
              }}
              onClick={() => {
                markAsRead(item.id);
                if (item.actionPath) navigate(item.actionPath);
              }}
            >
              <Text strong style={{ color: "#fff", fontSize: 13 }}>
                {item.title}
              </Text>
              <br />
              <Text style={{ color: "rgba(255,255,255,0.58)", fontSize: 12 }}>
                {item.message}
              </Text>
            </div>
          ))}
        </Space>
      )}

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <Button
          size="small"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Tümünü Oku
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={() => navigate("/notifications")}
        >
          Tüm Bildirimler
        </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          background: "#12122a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            onClick={() => navigate("/feed")}
          >
            <img
              src={appLogo}
              alt="FitPlate Logo"
              style={{
                width: collapsed ? 36 : 44,
                height: collapsed ? 36 : 44,
                objectFit: "contain",
                borderRadius: 10,
                padding: 4,
                background:
                  "linear-gradient(135deg, rgba(76,29,149,0.92), rgba(91,33,182,0.92))",
                border: "1px solid rgba(196,181,253,0.45)",
                boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
              }}
            />
            {!collapsed && (
              <Text
                strong
                style={{
                  color: "#a78bfa",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                }}
              >
                FitPlate
              </Text>
            )}
          </motion.div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={siderMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: "transparent",
            borderInlineEnd: "none",
            marginTop: 8,
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#0f0f1a",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Space size={16}>
            {/* Bildirimlere izin ver butonu dropdown'a taşındı */}
            <Popover
              trigger="click"
              placement="bottomRight"
              content={bellContent}
              overlayInnerStyle={{
                background: "#12122a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
              }}
            >
              <Badge count={unreadCount} size="small">
                <BellOutlined
                  style={{
                    fontSize: 22,
                    color: "rgba(255,255,255,0.65)",
                    cursor: "pointer",
                  }}
                />
              </Badge>
            </Popover>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  size={36}
                  src={getImageUrl(user?.profile_photo)}
                  icon={!user?.profile_photo && <UserOutlined />}
                  style={{ backgroundColor: "#7c3aed" }}
                />
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  {user?.name || "Kullanıcı"}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 16,
            minHeight: "calc(100vh - 64px - 32px)",
            overflow: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
}
