/**
 * FitPlate - Feed Composer Bileşeni
 * Çoklu giriş modu: yazı, fotoğraf, sesli komut
 * Hibrit beslenme veri girişi  kullanıcı seçtiği yöntemle yemeğini paylaşır
 */
import { useState, useCallback, useEffect } from "react";
import { Card, Input, Select, Button, Segmented, Typography } from "antd";
import {
  CameraOutlined,
  EditOutlined,
  AudioOutlined,
  SendOutlined,
  PictureOutlined,
  CloseOutlined,
  GlobalOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

const { TextArea } = Input;
const { Text } = Typography;

export default function FeedComposer({ onSubmit, isLoading }) {
  const [mode, setMode] = useState("text");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [visibility, setVisibility] = useState("public");

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setMode("photo");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    noClick: mode !== "photo",
    noKeyboard: true,
  });

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    await onSubmit?.({ content, image: imageFile, imagePreview, mode, visibility });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setContent("");
    setImageFile(null);
    setImagePreview(null);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (mode === "photo") setMode("text");
  };

  const placeholders = {
    text: 'Ne yedin bugün? Örn: "Yulaf sütlü latte ve çikolatalı kruvasan"',
    voice: "🎙️ Sesli tanıma başlatmak için mikrofon butonuna basın...",
    photo: "Fotoğrafla ilgili açıklama ekle (isteğe bağlı)...",
  };

  return (
    <Card
      style={{
        marginBottom: 20,
        background: "linear-gradient(135deg, var(--bg-container) 0%, #1e1b3a 100%)",
        border: "1px solid rgba(124, 58, 237, 0.12)",
        borderRadius: 16,
      }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Giriş Modu Seçimi */}
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { label: "Yazarak", value: "text", icon: <EditOutlined /> },
          { label: "Fotoğraf", value: "photo", icon: <CameraOutlined /> },
          { label: "Sesli", value: "voice", icon: <AudioOutlined /> },
        ]}
        style={{ marginBottom: 16 }}
        block
      />

      <AnimatePresence mode="wait">
        {/* Yazı veya Sesli Giriş */}
        {(mode === "text" || mode === "voice") && (
          <motion.div
            key="text-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholders[mode]}
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{
                background: "#12122a",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                borderRadius: 12,
                fontSize: 15,
              }}
            />
            <Text
              style={{
                display: "block",
                color: "rgba(255,255,255,0.3)",
                fontSize: 12,
                marginTop: 6,
              }}
            >
              Yemeğini yaz, biz kalori ve besin değerlerini hesaplayalım Üç
            </Text>
          </motion.div>
        )}

        {/* Fotoğraf Yükleme */}
        {mode === "photo" && (
          <motion.div
            key="photo-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {!imagePreview ? (
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? "#7c3aed" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isDragActive
                    ? "rgba(124, 58, 237, 0.05)"
                    : "transparent",
                }}
              >
                <input {...getInputProps()} />
                <PictureOutlined
                  style={{
                    fontSize: 48,
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: 12,
                  }}
                />
                <br />
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                  Yemeğinin fotoğrafını sürükle veya tıklayarak seç
                </Text>
                <br />
                <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                  Fotoğraftan otomatik besin analizi yapılacak
                </Text>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <img
                  src={imagePreview}
                  alt="Yemek önizleme"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "cover",
                    borderRadius: 12,
                    display: "block",
                  }}
                />
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  icon={<CloseOutlined />}
                  size="small"
                  onClick={clearImage}
                  style={{ position: "absolute", top: 8, right: 8 }}
                />
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={placeholders.photo}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{
                    marginTop: 12,
                    background: "#12122a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    borderRadius: 10,
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gönder Butonu ve Gizlilik Seçimi */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}
      >
        <Select
          value={visibility}
          onChange={setVisibility}
          style={{ width: 180 }}
          options={[
            {
              value: "public",
              label: (
                <span>
                  <GlobalOutlined style={{ marginRight: 6 }} /> Herkese Açık
                </span>
              ),
            },
            {
              value: "friends",
              label: (
                <span>
                  <TeamOutlined style={{ marginRight: 6 }} /> Sadece Arkadaşlar
                </span>
              ),
            },
          ]}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!content.trim() && !imageFile}
          style={{ borderRadius: 10, padding: "0 24px", height: 38 }}
        >
          Paylaş
        </Button>
      </div>
    </Card>
  );
}
