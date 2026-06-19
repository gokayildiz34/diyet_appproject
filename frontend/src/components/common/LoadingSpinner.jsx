/**
 * FitPlate - Loading Spinner Component
 */
import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Text } = Typography;

export default function LoadingSpinner({
  text = "Yükleniyor...",
  size = "large",
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        gap: 16,
      }}
    >
      <Spin
        indicator={
          <LoadingOutlined
            style={{
              fontSize: size === "large" ? 40 : 24,
              color: "#7c3aed",
            }}
            spin
          />
        }
      />
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        {text}
      </Text>
    </motion.div>
  );
}
