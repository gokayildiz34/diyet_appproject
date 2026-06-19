/**
 * FitPlate - Koç Yorum Bileşeni
 * Koçun yorumları doğal ve kişisel bir tonda gösterilir.
 */
import { Avatar, Typography, Tag, Space } from "antd";
import { motion } from "framer-motion";

const { Text, Paragraph } = Typography;

const coachPersonas = {
  demir: {
    name: "Demir",
    initial: "D",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.06)",
    borderColor: "rgba(239, 68, 68, 0.15)",
    tagColor: "red",
    tagLabel: "Sert Koç",
  },
  ipek: {
    name: "İpek",
    initial: "İ",
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.06)",
    borderColor: "rgba(236, 72, 153, 0.15)",
    tagColor: "pink",
    tagLabel: "Nazik Koç",
  },
  zen: {
    name: "Zen",
    initial: "Z",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.06)",
    borderColor: "rgba(16, 185, 129, 0.15)",
    tagColor: "green",
    tagLabel: "Dengeli Koç",
  },
};

export default function CoachComment({ comment, persona = "demir" }) {
  const coach = coachPersonas[persona] || coachPersonas.demir;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        padding: 16,
        background: coach.bgColor,
        borderRadius: 14,
        border: `1px solid ${coach.borderColor}`,
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar
          size={36}
          style={{
            backgroundColor: coach.color,
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {coach.initial}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Space size={6}>
            <Text strong style={{ color: coach.color, fontSize: 14 }}>
              {coach.name}
            </Text>
            <Tag
              style={{
                fontSize: 10,
                lineHeight: "16px",
                padding: "0 6px",
                borderRadius: 10,
                background: coach.bgColor,
                border: `1px solid ${coach.borderColor}`,
                color: coach.color,
              }}
            >
              {coach.tagLabel}
            </Tag>
          </Space>
          <Paragraph
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              marginBottom: 0,
              marginTop: 6,
              lineHeight: 1.65,
            }}
          >
            {comment}
          </Paragraph>
        </div>
      </div>
    </motion.div>
  );
}
