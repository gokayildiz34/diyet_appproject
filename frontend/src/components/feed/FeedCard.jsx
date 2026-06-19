/**
 * FitPlate - Feed Card Component
 * Her bir gönderiyi tüm etkileşimleriyle birlikte gösterir.
 * Tüm kullanıcılar (gerçek veya sistem üretimi) aynı şekilde görüntülenir.
 */
import { useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Space,
  Button,
  Input,
  Tag,
  Tooltip,
  Popover,
} from "antd";
import {
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  FireOutlined,
  UserOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// Doğal avatar renk havuzu — her kullanıcıya farklı bir renk
const avatarColors = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#9333ea",
  "#c026d3",
  "#0d9488",
  "#4f46e5",
  "#e11d48",
  "#ea580c",
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

export default function FeedCard({
  post,
  onLike,
  onComment,
  isOwnPost = false,
  isFriend = false,
  requestSent = false,
  onAddFriend,
  onRemoveFriend,
  onSupport,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleComment = () => {
    if (commentText.trim()) {
      onComment?.(post.id, commentText);
      setCommentText("");
    }
  };

  const avatarColor = getAvatarColor(post.user?.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        style={{
          marginBottom: 16,
          background: "#1a1a2e",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
        }}
        styles={{ body: { padding: 20 } }}
      >
        {/* Gönderi Başlığı */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <Avatar
            size={44}
            src={post.user?.avatar}
            icon={!post.user?.avatar && <UserOutlined />}
            style={{ backgroundColor: avatarColor, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <Text strong style={{ color: "#fff", fontSize: 15 }}>
              {post.user?.name || "Kullanıcı"}
            </Text>
            <br />
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              {post.timeAgo || post.createdAt || "Az önce"}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {/* Arkadaşlık aksiyonu */}
            {!isOwnPost &&
              (isFriend ? (
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={
                    <Button
                      danger
                      size="small"
                      onClick={() => onRemoveFriend?.(post.user)}
                      style={{ borderRadius: 8 }}
                    >
                      Arkadaşlıktan Çıkar
                    </Button>
                  }
                >
                  <Tag
                    color="green"
                    style={{
                      borderRadius: 20,
                      fontWeight: 600,
                      margin: 0,
                      cursor: "pointer",
                    }}
                  >
                    Bu senin arkadaşın
                  </Tag>
                </Popover>
              ) : (
                <Button
                  size="small"
                  type={requestSent ? "default" : "primary"}
                  disabled={requestSent}
                  onClick={() => onAddFriend?.(post.user)}
                  style={{ borderRadius: 999 }}
                >
                  {requestSent ? "İstek Gönderildi" : "Arkadaş Ekle"}
                </Button>
              ))}

            {/* Kalori rozeti */}
            {post.calories && (
              <Tooltip title={`Tahmini ${post.calories} kalori`}>
                <Tag
                  icon={<FireOutlined />}
                  color="volcano"
                  style={{ borderRadius: 20, fontWeight: 600, margin: 0 }}
                >
                  {post.calories} kcal
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>

        {(post.metadata?.type === "coach_diet_plan" ||
          post.metadata?.type === "coach_chat_plan" ||
          post.metadata?.type === "food_analysis" ||
          post.metadata?.type === "diet_progress") && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            {post.metadata?.type === "coach_diet_plan" && (
              <Tag color="purple" style={{ borderRadius: 16, margin: 0 }}>
                🤖 Koç Diyet Planı
              </Tag>
            )}
            {post.metadata?.type === "coach_chat_plan" && (
              <Tag color="magenta" style={{ borderRadius: 16, margin: 0 }}>
                💬 Koç Sohbet Planı
              </Tag>
            )}
            {post.metadata?.autoShared && (
              <Tag color="geekblue" style={{ borderRadius: 16, margin: 0 }}>
                Otomatik Paylaşım
              </Tag>
            )}
            {post.metadata?.type === "food_analysis" && (
              <Tag color="cyan" style={{ borderRadius: 16, margin: 0 }}>
                📸 Fotoğraf Analizi
              </Tag>
            )}
            {post.metadata?.type === "diet_progress" && (
              <Tag color="green" style={{ borderRadius: 16, margin: 0 }}>
                📈 Diyet İlerlemesi
              </Tag>
            )}
          </div>
        )}

        {/* Gönderi İçeriği */}
        <Paragraph
          style={{
            color: "rgba(255,255,255,0.88)",
            fontSize: 15,
            marginBottom: 12,
            lineHeight: 1.7,
          }}
        >
          {post.content}
        </Paragraph>

        {/* Gönderi Fotoğrafı */}
        {post.image && (
          <div
            style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12 }}
          >
            <img
              src={post.image}
              alt="Yemek fotoğrafı"
              style={{
                width: "100%",
                maxHeight: 400,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Besin Değerleri */}
        {post.macros && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <Tag
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                borderRadius: 8,
              }}
            >
              🍞 {post.macros.carbs}g Karbonhidrat
            </Tag>
            <Tag
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#34d399",
                borderRadius: 8,
              }}
            >
              🥩 {post.macros.protein}g Protein
            </Tag>
            <Tag
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                color: "#fbbf24",
                borderRadius: 8,
              }}
            >
              🧈 {post.macros.fat}g Yağ
            </Tag>
          </div>
        )}

        {post.metadata?.progress && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <Text style={{ color: "#34d399", fontSize: 12, fontWeight: 700 }}>
              📈 Diyet İlerlemesi
            </Text>
            <br />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              {post.metadata.progress.consumed} / {post.metadata.progress.goal}{" "}
              kcal ({post.metadata.progress.percent}%)
            </Text>
          </div>
        )}

        {/* Etkileşim Butonları */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 12,
          }}
        >
          <Button
            type="text"
            icon={
              post.isLiked ? (
                <HeartFilled style={{ color: "#ef4444" }} />
              ) : (
                <HeartOutlined />
              )
            }
            onClick={() => onLike?.(post.id, post.isLiked)}
            style={{
              color: post.isLiked ? "#ef4444" : "rgba(255,255,255,0.55)",
            }}
          >
            {post.likeCount || 0}
          </Button>

          <Button
            type="text"
            icon={<CommentOutlined />}
            onClick={() => setShowComments(!showComments)}
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {post.comments?.length || 0}
          </Button>

          <Button
            type="text"
            icon={<SmileOutlined />}
            onClick={() => onSupport?.(post.id)}
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {post.isSupported ? "Destek Oldun" : "Destek Ol"} (
            {post.supportCount || 0})
          </Button>
        </div>

        {/* Koç Yorumu — doğal bir kullanıcı yorumu gibi görünür */}
        <AnimatePresence>
          {post.coachComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 12,
                padding: 14,
                background: "rgba(124, 58, 237, 0.06)",
                borderRadius: 12,
                border: "1px solid rgba(124, 58, 237, 0.12)",
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <Avatar
                  size={32}
                  src={post.coachComment.avatar}
                  style={{
                    backgroundColor: post.coachComment.color || "#7c3aed",
                    flexShrink: 0,
                    fontSize: 14,
                  }}
                >
                  {post.coachComment.coachName?.[0] || "K"}
                </Avatar>
                <div>
                  <Space size={6}>
                    <Text strong style={{ color: "#c4b5fd", fontSize: 13 }}>
                      {post.coachComment.coachName || "Beslenme Koçu"}
                    </Text>
                    <Tag
                      style={{
                        fontSize: 10,
                        lineHeight: "16px",
                        padding: "0 6px",
                        borderRadius: 10,
                        background: "rgba(124, 58, 237, 0.15)",
                        border: "none",
                        color: "#a78bfa",
                      }}
                    >
                      Koçun
                    </Tag>
                  </Space>
                  <Paragraph
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 14,
                      marginBottom: 0,
                      marginTop: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    {post.coachComment.text}
                  </Paragraph>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yorumlar */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: 12 }}
            >
              {post.comments?.map((comment, idx) => (
                <div
                  key={comment.id || idx}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Avatar
                    size={28}
                    src={comment.user?.avatar}
                    icon={!comment.user?.avatar && <UserOutlined />}
                    style={{
                      backgroundColor: getAvatarColor(comment.user?.name),
                    }}
                  />
                  <div>
                    <Text strong style={{ color: "#fff", fontSize: 13 }}>
                      {comment.user?.name || "Kullanıcı"}
                    </Text>
                    <Paragraph
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 13,
                        marginBottom: 0,
                      }}
                    >
                      {comment.content}
                    </Paragraph>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <TextArea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Yorum yaz..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  style={{
                    background: "#12122a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    borderRadius: 10,
                  }}
                />
                <Button
                  type="primary"
                  onClick={handleComment}
                  style={{ borderRadius: 10 }}
                >
                  Gönder
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
